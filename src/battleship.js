const GAME={
key:'battleship',title:'Battleship',emoji:'🚢',
tagline:"Right answers earn a shot at another team's fleet.",
how:`<p>Each team gets a hidden fleet, placed at random. Tap <b>✓ Correct</b> for the team that answered right, then tap a square on another team's board to fire. 💥 is a hit and • is a miss. Students can call shots by grid name, like "B4".</p><p>The last team with a ship afloat wins. Teams whose fleet is sunk can still answer and fire, so everyone stays in it.</p>`,
options:[
  {id:'teams',label:'Teams',min:2,max:4,def:2},
  {id:'size',label:'Board',type:'seg',def:'6',choices:[['6','6×6 · 3 ships'],['8','8×8 · 4 ships']]}
],
init(o){const N=+o.size,sizes=N===6?[3,2,2]:[4,3,3,2];return{N,b:S.teams.map(()=>({ships:bsPlace(N,sizes),shots:Array(N*N).fill(0)})),last:null,reveal:false}},
render(){
  const t=UI.team,picking=t!=null,N=S.N,letters='ABCDEFGH';
  const af=S.teams.map((_,i)=>bsAfloat(i)),nAlive=af.filter(x=>x>0).length;
  if(picking)banner(`✅ ${tb(t)} got it! Tap a square on another team's board to fire.`,'pick',cancelBtn);
  else if(nAlive<=1){const w=af.findIndex(x=>x>0);banner(w>=0?`🏆 ${tb(w)} has the last fleet afloat!`:'Every fleet is sunk!','win',`<button data-act="reveal">${S.reveal?'Hide':'Show'} all ships</button>`);}
  else if(S.last){const L=S.last;banner(L.r==='miss'?`💦 ${tb(L.s)} missed ${tb(L.t)} at ${L.c}.`:L.r==='hit'?`💥 ${tb(L.s)} hit ${tb(L.t)} at ${L.c}!`:`🔥 ${tb(L.s)} sank ${tb(L.t)}'s ${L.z}-square ship!`,L.r==='miss'?'':'alert');}
  else banner('Tap <b>✓ Correct</b> on the team that answered right.');
  const boards=S.teams.map((_,i)=>{
    const b=S.b[i],target=picking&&i!==t&&af[i]>0;
    let g='<div class="lbl"></div>';for(let c=0;c<N;c++)g+=`<div class="lbl">${c+1}</div>`;
    for(let r=0;r<N;r++){g+=`<div class="lbl">${letters[r]}</div>`;
      for(let c=0;c<N;c++){const k=r*N+c,sh=b.shots[k],si=bsShipAt(i,k),sunk=si>=0&&b.ships[si].every(x=>b.shots[x]===2),show=si>=0&&(sunk||S.reveal);
        const cls=['bc',sh===1?'miss':'',sh===2?'hit':'',show?'ship':'',sunk?'sunk':'',target&&sh===0?'can':'',FX.k===i+':'+k?'pop':''].join(' ');
        g+=`<button class="${cls}" data-act="fire" data-i="${i}" data-k="${k}">${sh===2?'💥':sh===1?'•':''}</button>`;}}
    return `<div class="bboard ${t===i?'active':''} ${af[i]===0?'out':''}" style="--c:${tc(i)}"><div class="bhead">${tn(i)}<span class="afloat">${af[i]===0?'🏴 Fleet sunk':`🚢 ${af[i]} of ${b.ships.length} afloat`}</span></div><div class="bgrid" style="grid-template-columns:22px repeat(${N},1fr)">${g}</div><button class="ok" data-act="correct" data-i="${i}">✓ Correct</button></div>`;
  }).join('');
  $('board').innerHTML=`<div class="bboards">${boards}</div>`;
},
click(a,el){
  if(a==='correct'){
    const i=+el.dataset.i;
    if(!S.b.some((b,j)=>j!==i&&bsAfloat(j)>0)){alert('There are no fleets left to fire at.');return;}
    ui({team:i});
  }else if(a==='fire'){
    const t=UI.team;if(t==null)return;
    const i=+el.dataset.i,k=+el.dataset.k;
    if(i===t||S.b[i].shots[k]!==0||bsAfloat(i)===0)return;
    act(()=>{const b=S.b[i],si=bsShipAt(i,k),c='ABCDEFGH'[Math.floor(k/S.N)]+(k%S.N+1);FX.k=i+':'+k;
      if(si<0){b.shots[k]=1;S.last={s:t,t:i,r:'miss',c};}
      else{b.shots[k]=2;const sunk=b.ships[si].every(x=>b.shots[x]===2);S.last={s:t,t:i,r:sunk?'sunk':'hit',c,z:b.ships[si].length};}});
  }else if(a==='reveal'){S.reveal=!S.reveal;save();draw();}
}};
function bsAfloat(i){const b=S.b[i];return b.ships.filter(s=>s.some(k=>b.shots[k]!==2)).length}
function bsShipAt(i,k){return S.b[i].ships.findIndex(s=>s.includes(k))}
function bsPlace(N,sizes){
  for(let tries=0;tries<500;tries++){
    const used=new Set(),ships=[];let ok=true;
    for(const L of sizes){let placed=false;
      for(let t=0;t<200&&!placed;t++){const h=Math.random()<.5,r=Math.floor(Math.random()*(h?N:N-L+1)),c=Math.floor(Math.random()*(h?N-L+1:N)),cells=[];
        for(let k=0;k<L;k++)cells.push(h?r*N+c+k:(r+k)*N+c);
        if(cells.every(x=>!used.has(x))){cells.forEach(x=>used.add(x));ships.push(cells);placed=true;}}
      if(!placed){ok=false;break;}}
    if(ok)return ships;
  }
  return [];
}
