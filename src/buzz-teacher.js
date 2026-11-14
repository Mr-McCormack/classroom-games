// ===== Buzz-in line: the teacher's side =====
// Students' computers can only drop a "press" (join or leave) into the room. This screen is the only
// thing that writes the line itself, so order is decided in one place, by Firebase's server clock.
const BZKEY = 'classgame-' + GAME.key + '-buzz';
const CODECH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no 0/O or 1/I/L
let R = null;          // live room: {code, queue:[{team,dev,n}], cool, coolOn, last}
let R_state = 'off';   // off | signin | connecting | on | error
let R_err = '', R_undo = null, R_unsub = null, R_chime = lsGet('classgame-chime') !== 'off', R_wasFront = false;

const studentURL = () => location.host + location.pathname.replace(/[^/]*$/, '');

function frontIndex() {
  if (!R) return -1;
  return R.queue.findIndex(q => !(R.coolOn && q.team === R.cool));
}

async function ensureAuth() {
  await new Promise(r => { const u = onAuthStateChanged(auth, () => { u(); r(); }); });
  if (auth.currentUser) return true;
  for (const k of ['hp-teacher-key', 'cg-teacher-key']) {
    let key = null; try { key = JSON.parse(lsGet(k) || 'null'); } catch (e) {}
    if (key && key.email && key.password) {
      try { await signInWithEmailAndPassword(auth, key.email, key.password); return true; } catch (e) {}
    }
  }
  return false;
}

async function turnOn(resumeCode) {
  if (!buzzAllowed()) return;
  R_state = 'connecting'; R_err = ''; bzRender();
  try {
    if (!(await ensureAuth())) { R_state = 'signin'; bzRender(); return; }
    let code = resumeCode, snap = null;
    if (code) {
      snap = await getDoc(roomRef(code));
      if (!snap.exists() || snap.data().ownerUid !== auth.currentUser.uid) { code = null; snap = null; }
    }
    if (!code) {
      for (let t = 0; t < 8 && !code; t++) {
        const c = Array.from(crypto.getRandomValues(new Uint8Array(4)), b => CODECH[b % CODECH.length]).join('');
        if (!(await getDoc(roomRef(c))).exists()) code = c;
      }
      if (!code) throw new Error('Could not make a room code.');
      R = { code, queue: [], cool: -1, coolOn: GAME.buzzCool !== false, last: null };
      await setDoc(roomRef(code), { ownerUid: auth.currentUser.uid, game: GAME.title, teams: teamList(),
        queue: [], cool: -1, coolOn: R.coolOn, last: null, created: serverTimestamp() });
    } else {
      const d = snap.data();
      R = { code, queue: d.queue || [], cool: d.cool ?? -1, coolOn: d.coolOn !== false, last: d.last || null };
      await updateDoc(roomRef(code), { teams: teamList(), game: GAME.title });
    }
    lsSet(BZKEY, code);
    listen(code);
    R_state = 'on'; R_wasFront = frontIndex() >= 0;
  } catch (e) {
    console.error(e); R_state = 'error';
    R_err = /permission/i.test(String(e && (e.code || e.message))) ? "Firebase said no. Check that the new rules were published." : "Can't reach Firebase right now.";
  }
  bzRender();
}

function listen(code) {
  if (R_unsub) R_unsub();
  let busy = Promise.resolve();
  R_unsub = onSnapshot(pressCol(code), snap => {
    const adds = snap.docChanges().filter(c => c.type === 'added')
      .map(c => ({ id: c.doc.id, ...c.doc.data() }))
      .sort((a, b) => ms(a.at) - ms(b.at));
    if (!adds.length) return;
    busy = busy.then(() => handlePresses(code, adds));
  }, e => { console.error(e); R_state = 'error'; R_err = 'Lost the connection to Firebase.'; bzRender(); });
}
const ms = t => (t && t.toMillis) ? t.toMillis() : Number.MAX_SAFE_INTEGER;

async function handlePresses(code, presses) {
  if (!R || R.code !== code) return;
  let changed = false;
  for (const p of presses) {
    const t = p.team;
    if (!Number.isInteger(t) || t < 0 || t >= S.teams.length) continue;
    const at = R.queue.findIndex(q => q.team === t);
    if (p.action === 'join' && at < 0) { R.queue.push({ team: t, dev: p.device || '', n: 0 }); changed = true; }
    if (p.action === 'leave' && at >= 0 && R.queue[at].dev === p.device) { R.queue.splice(at, 1); changed = true; }
  }
  if (changed) await push();
  bzRender();
  for (const p of presses) { try { await deleteDoc(doc(db, 'buzz', code, 'presses', p.id)); } catch (e) {} }
}

async function push() {
  if (!R) return;
  try {
    await updateDoc(roomRef(R.code), { queue: R.queue, cool: R.cool, coolOn: R.coolOn, last: R.last });
    if (R_state === 'error') { R_state = 'on'; R_err = ''; bzRender(); }
  } catch (e) { console.error(e); R_state = 'error'; R_err = "Couldn't save the line. Check the internet connection."; bzRender(); }
}
const teamList = () => S.teams.map((t, i) => ({ name: t.name, color: tc(i) }));

// ---- actions ----
function served(team) {
  if (!R) return;
  const at = R.queue.findIndex(q => q.team === team);
  R_undo = { entry: at >= 0 ? R.queue[at] : null, index: at, cool: R.cool, team };
  if (at >= 0) R.queue.splice(at, 1);
  R.cool = team; R.last = { team, r: 'ok', t: Date.now() };
  push(); bzRender();
}
function notYet(team) {
  const at = R.queue.findIndex(q => q.team === team); if (at < 0) return;
  const [q] = R.queue.splice(at, 1); q.n = (q.n || 0) + 1; R.queue.push(q);
  R.last = { team, r: 'no', t: Date.now() }; R_undo = null;
  buzzWrong(team); push(); bzRender();
}
function remove(team) {
  const at = R.queue.findIndex(q => q.team === team); if (at < 0) return;
  R.queue.splice(at, 1); R_undo = null; push(); bzRender();
}
function putBack() {
  if (!R_undo) return;
  const u = R_undo; R_undo = null;
  if (u.entry && !R.queue.some(q => q.team === u.team)) R.queue.splice(Math.max(0, Math.min(u.index, R.queue.length)), 0, u.entry);
  R.cool = u.cool; push(); bzRender();
}
async function end() {
  if (R_unsub) { R_unsub(); R_unsub = null; }
  const code = R ? R.code : lsGet(BZKEY);
  R = null; R_state = 'off'; R_undo = null; lsSet(BZKEY, null);
  if (code) { try { await ensureAuth(); await deleteDoc(roomRef(code)); } catch (e) {} }
  bzRender();
}

function chime() {
  if (!R_chime) return;
  try {
    const A = new (window.AudioContext || window.webkitAudioContext)(), o = A.createOscillator(), g = A.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(880, A.currentTime); o.frequency.setValueAtTime(1175, A.currentTime + .12);
    g.gain.setValueAtTime(.0001, A.currentTime); g.gain.exponentialRampToValueAtTime(.25, A.currentTime + .02);
    g.gain.exponentialRampToValueAtTime(.0001, A.currentTime + .45);
    o.connect(g); g.connect(A.destination); o.start(); o.stop(A.currentTime + .5);
  } catch (e) {}
}

// ---- panel ----
function bzRender() {
  const el = $('buzz'); if (!el) return;
  if ($('game').hidden || !S || !buzzAllowed()) { el.innerHTML = ''; el.className = ''; return; }
  if (R_state === 'off') {
    el.className = 'bz off';
    el.innerHTML = `<button class="bzon" data-bz="on">📣 Turn on buzz-in</button><span class="bzhint">Groups signal from their computers when they have an answer, and line up here in order.</span>`;
    return;
  }
  if (R_state === 'connecting') { el.className = 'bz off'; el.innerHTML = '<span class="bzhint">Connecting buzz-in…</span>'; return; }
  if (R_state === 'signin') {
    el.className = 'bz alertbz';
    el.innerHTML = `<span class="bzhint"><b>Buzz-in uses your Hall Pass teacher key.</b> Open Hall Pass on this computer once, then try again, or load your Hall Pass backup file.</span>
      <button data-bz="on">Try again</button><label class="btn filebtn">Load backup file<input type="file" accept=".json,application/json" data-bzfile></label><button data-bz="off">Cancel</button>`;
    return;
  }
  if (!R) { el.className = 'bz alertbz'; el.innerHTML = `<span class="bzhint">⚠️ ${esc(R_err)}</span><button data-bz="on">Try again</button><button data-bz="off">Turn off</button>`; return; }
  const f = frontIndex(), busy = Object.keys(UI).length > 0 || QPEND != null;
  if (f >= 0 && !R_wasFront) chime();
  R_wasFront = f >= 0;
  const name = t => S.teams[t] ? esc(S.teams[t].name) : 'Team ' + (t + 1);
  let line = '';
  if (!R.queue.length) line = '<span class="bzempty">No one in line yet.</span>';
  else {
    let pos = 0;
    line = R.queue.map((q, k) => {
      const waiting = R.coolOn && q.team === R.cool;
      if (k === f) {
        pos++;
        return `<div class="bzfront" style="--c:${tc(q.team)}"><span class="bzpos">1</span><b>${name(q.team)}</b>${q.n ? `<small>try ${q.n + 1}</small>` : ''}
          <button class="ok" data-bz="ok" data-t="${q.team}" ${busy ? 'disabled' : ''}>✓ Correct</button>
          <button class="no" data-bz="no" data-t="${q.team}" ${busy ? 'disabled' : ''}>✗ Not yet</button>
          <button class="bzx" data-bz="rm" data-t="${q.team}" title="Take out of line">×</button></div>`;
      }
      if (waiting) return `<div class="bzchip wait" style="--c:${tc(q.team)}"><span class="dot"></span>${name(q.team)} <small>waits: scored last</small>
        <button class="bzlet" data-bz="let">Let them go</button><button class="bzx" data-bz="rm" data-t="${q.team}">×</button></div>`;
      pos++;
      return `<div class="bzchip" style="--c:${tc(q.team)}"><span class="bzpos sm">${pos}</span>${name(q.team)}<button class="bzx" data-bz="rm" data-t="${q.team}" title="Take out of line">×</button></div>`;
    }).join('');
  }
  const undoChip = R_undo ? `<button class="bzundo" data-bz="putback">↩ Put ${name(R_undo.team)} back in line</button>` : '';
  el.className = 'bz';
  el.innerHTML = `<div class="bzcode"><span>Buzz-in code</span><b>${R.code}</b><small>${esc(studentURL())}</small></div>
    <div class="bzline">${line}${undoChip}</div>
    <div class="bztools">${R_state === 'error' ? `<span class="bzwarn" title="${esc(R_err)}">⚠️ Offline</span>` : '<span class="bzlive">● Live</span>'}
      <button data-bz="cool" title="When on, a team that just scored waits until another team scores">${R.coolOn ? '✓' : '○'} No back-to-back</button>
      <button data-bz="chime" title="Sound when a team reaches the front">${R_chime ? '🔔' : '🔕'}</button>
      <button data-bz="off">Turn off</button></div>`;
}

$('buzz').addEventListener('click', e => {
  const b = e.target.closest('[data-bz]'); if (!b || b.disabled) return;
  const a = b.dataset.bz, t = +b.dataset.t;
  if (a === 'on') turnOn(lsGet(BZKEY));
  else if (a === 'off') { if (R_state !== 'on' || confirm('Turn off buzz-in? Groups will need the new code if you turn it back on.')) end(); }
  else if (a === 'ok') buzzCorrect(t);
  else if (a === 'no') notYet(t);
  else if (a === 'rm') remove(t);
  else if (a === 'let') { R.cool = -1; push(); bzRender(); }
  else if (a === 'putback') putBack();
  else if (a === 'cool') { R.coolOn = !R.coolOn; push(); bzRender(); }
  else if (a === 'chime') { R_chime = !R_chime; lsSet('classgame-chime', R_chime ? null : 'off'); bzRender(); }
});
$('buzz').addEventListener('change', async e => {
  const inp = e.target.closest('[data-bzfile]'); if (!inp || !inp.files[0]) return;
  try {
    const b = JSON.parse(await inp.files[0].text());
    if (!b || !b.key || !b.key.email || !b.key.password) throw new Error('bad');
    await signInWithEmailAndPassword(auth, b.key.email, b.key.password);
    lsSet('cg-teacher-key', JSON.stringify(b.key));
    turnOn(lsGet(BZKEY));
  } catch (err) { alert("That file didn't work. Use the backup file you downloaded from Hall Pass."); }
});

window.BZ = {
  render: bzRender, served,
  newGame() { end(); },
  end,
  resume() { const c = lsGet(BZKEY); if (c && buzzAllowed()) turnOn(c); else bzRender(); },
  teamsChanged() { if (R) updateDoc(roomRef(R.code), { teams: teamList() }).catch(() => {}); }
};
// The module loads after the game script; pick up a game that's already on screen.
if (!$('game').hidden) BZ.resume();
