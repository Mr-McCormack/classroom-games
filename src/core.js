// ===== Shared engine =====
const COLORS=['#e63946','#1d7bd8','#2a9d4a','#f4a300','#8e44ad','#e76f51','#0fa3b1','#d63384','#5a3e2b','#3a86ff','#80b918','#6c757d'];
const MARKS=['✕','◯','▲','■'];
const $=id=>document.getElementById(id);
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Math.round(Number(v)||lo)));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='classgame-'+GAME.key+'-v1';
const cancelBtn='<button data-act="cancel">Cancel</button>';
const nextBtn='<button data-act="next">Next round ▶</button>';
let S=null,H=[],UI={},FX={};
const OPTS={};
// Buzz-in hand-off: QPEND is the team the line just sent up. When that team's reward is committed
// (the next act), the buzz-in panel takes them out of the line.
let QPEND=null,QDID=false;

function save(){try{localStorage.setItem(KEY,JSON.stringify({S,H}))}catch(e){try{localStorage.setItem(KEY,JSON.stringify({S,H:H.slice(-15)}))}catch(e2){}}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.S&&Array.isArray(d.S.teams)&&d.S.teams.length)return d}catch(e){}return null}
// Every scoring change goes through act(): it snapshots the state first so Undo can restore it.
function act(fn,keepUI){
  const before=JSON.stringify(S);if(fn()===false)return;
  H.push(before);if(H.length>200)H.shift();if(!keepUI)UI={};
  QDID=true;if(QPEND!=null){const t=QPEND;QPEND=null;if(window.BZ)BZ.served(t);}
  save();draw();
}
function undo(){
  if(!H.length)return;
  const names=S.teams.map(t=>t.name),kept={};(GAME.keep||[]).forEach(k=>kept[k]=S[k]);
  S=JSON.parse(H.pop());
  S.teams.forEach((t,i)=>{if(names[i]!=null)t.name=names[i]});           // renames survive undo
  (GAME.keep||[]).forEach(k=>{if(kept[k]!==undefined)S[k]=kept[k]});
  UI={};FX={};QPEND=null;save();draw();
}
function ui(o){UI=o||{};if(!Object.keys(UI).length)QPEND=null;draw();}
function draw(){$('undoBtn').disabled=!H.length;GAME.render();FX={};if(window.BZ)BZ.render();}
function banner(msg,cls,btns){const b=$('banner');b.className=cls||'';b.innerHTML='<span class="msg">'+msg+'</span>'+(btns||'');}
function tc(i){return COLORS[i%COLORS.length]}
function tn(i){return `<button class="tname" data-rename="${i}" title="Click to rename" style="--c:${tc(i)}"><span class="dot"></span>${esc(S.teams[i].name)}</button>`}
function tb(i){return `<b class="tlabel" style="--c:${tc(i)}"><span class="dot"></span>${esc(S.teams[i].name)}</b>`}
function leaders(arr){const m=Math.max(...arr),tied=arr.every(v=>v===m);return arr.map(v=>m>0&&v===m&&!tied)}
function winnerText(arr){const m=Math.max(...arr);const w=arr.map((v,i)=>v===m?i:-1).filter(i=>i>=0);return w.length===1?`${tb(w[0])} wins! 🎉`:`It's a tie: ${w.map(tb).join(' & ')}!`}

// ----- Buzz-in hooks (the panel itself lives in the buzz module) -----
// Called by the line's ✓ Correct button. Runs the game's normal "this team got it right" step.
function buzzCorrect(i){
  if(Object.keys(UI).length){UI={};draw();}
  QPEND=i;QDID=false;
  if(GAME.correct)GAME.correct(i);else GAME.click('correct',{dataset:{i:String(i)}});
  if(!QDID&&!Object.keys(UI).length)QPEND=null;   // the game refused (e.g. round over); team stays in line
  if(window.BZ)BZ.render();
}
function buzzWrong(i){if(GAME.wrong)GAME.wrong(i);}
function buzzAllowed(){return !(GAME.noBuzz&&GAME.noBuzz())}

// ----- Setup screen -----
function buildSetup(){
  const f=$('fields');f.innerHTML='';
  GAME.options.forEach(o=>{
    const row=document.createElement('div');row.className='field';
    if(o.type==='seg'){OPTS[o.id]=o.def;row.innerHTML=`<span>${o.label}</span><div class="seg">${o.choices.map(c=>`<button data-opt="${o.id}" data-val="${c[0]}" class="${c[0]===o.def?'on':''}">${c[1]}</button>`).join('')}</div>`;}
    else if(o.type==='html'){row.className='field col';row.innerHTML=o.html;}
    else row.innerHTML=`<span>${o.label}</span><div class="stepper"><button data-step="${o.id}" data-d="-1">−</button><input id="opt_${o.id}" type="number" min="${o.min}" max="${o.max}" value="${o.def}"><button data-step="${o.id}" data-d="1">+</button></div>`;
    f.appendChild(row);
  });
}
function readOpts(){const o={};GAME.options.forEach(x=>{if(x.type==='seg')o[x.id]=OPTS[x.id];else if(x.type!=='html')o[x.id]=clamp($('opt_'+x.id).value,x.min,x.max);});return o;}
$('setup').addEventListener('click',e=>{
  const st=e.target.closest('[data-step]');
  if(st){const o=GAME.options.find(x=>x.id===st.dataset.step),inp=$('opt_'+o.id);inp.value=clamp(+inp.value+ +st.dataset.d,o.min,o.max);return;}
  const sg=e.target.closest('[data-opt]');
  if(sg){OPTS[sg.dataset.opt]=sg.dataset.val;sg.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===sg));}
});
$('startBtn').onclick=async()=>{
  const o=readOpts();
  if(GAME.beforeStart&&!(await GAME.beforeStart(o)))return;
  const n=o.teams||GAME.fixedTeams||2;
  S={teams:Array.from({length:n},(_,i)=>({name:'Team '+(i+1)})),o};
  Object.assign(S,GAME.init(o));
  H=[];UI={};FX={};QPEND=null;save();
  if(window.BZ)BZ.newGame();
  showGame();
};
$('resumeBtn').onclick=()=>{const d=load();if(!d)return;S=d.S;H=Array.isArray(d.H)?d.H:[];UI={};FX={};QPEND=null;if(GAME.onResume)GAME.onResume();showGame();if(window.BZ)BZ.resume();};
function showGame(){$('setup').hidden=true;$('game').hidden=false;window.scrollTo(0,0);draw();}
function showSetup(){$('game').hidden=true;$('setup').hidden=false;$('resumeBtn').hidden=!load();}

// ----- Game screen -----
$('undoBtn').onclick=undo;
$('newBtn').onclick=()=>{if(confirm('End this game and go back to setup?')){if(window.BZ)BZ.end();showSetup();}};
document.addEventListener('keydown',e=>{
  if($('game').hidden)return;
  if(e.key==='Escape'&&Object.keys(UI).length)ui({});
  if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();undo();}
});
$('game').addEventListener('click',e=>{
  const r=e.target.closest('[data-rename]');
  if(r&&!Object.keys(UI).length){
    const i=+r.dataset.rename,n=prompt('Team name:',S.teams[i].name);
    if(n&&n.trim()){S.teams[i].name=n.trim().slice(0,30);save();draw();if(window.BZ)BZ.teamsChanged();}
    return;
  }
  const a=e.target.closest('[data-act]');
  if(!a||a.disabled)return;
  if(a.dataset.act==='cancel'){ui({});return;}
  GAME.click(a.dataset.act,a,e);
});

document.title=GAME.title;
document.querySelectorAll('.gtitle').forEach(h=>h.textContent=GAME.emoji+' '+GAME.title);
$('tagline').textContent=GAME.tagline;
$('how').innerHTML='<summary>How to play</summary>'+GAME.how+'<p><b>Buzz-in:</b> turn it on from the game screen. Each group opens this site on one computer, taps <b>Students: Buzz in</b>, types the code, and picks their team. Their buzzes line up on your screen in order.</p>';
buildSetup();
if(GAME.setupInit)GAME.setupInit();
if(load())$('resumeBtn').hidden=false;
