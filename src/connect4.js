const GAME={
key:'connect4',title:'Connect Four',emoji:'🔴',
tagline:'Right answer? Drop a chip.',
how:`<p>Tap <b>✓ Correct</b> for the team that answered right, then tap a column to drop their chip. The first team to line up four in a row (across, down, or diagonal) wins the round.</p><p>Press <b>Next round</b> to clear the board. Round wins are kept for each team.</p>`,
options:[
  {id:'teams',label:'Teams',min:2,max:4,def:2},
  {id:'size',label:'Board',type:'seg',def:'7x6',choices:[['7x6','7 × 6'],['9x7','9 × 7']]}
],
init(o){const[c,r]=o.size.split('x').map(Number);return{cols:c,rows:r,grid:Array(c*r).fill(-1),wins:S.teams.map(()=>0),over:null}},
render(){
  const t=UI.team,picking=t!=null&&!S.over,C=S.cols,R=S.rows;
  if(S.over)banner(S.over.draw?'🤝 The board is full. No winner this round.':`🎉 ${tb(S.over.winner)} connected four!`,'win',nextBtn);
  else if(picking)banner(`✅ ${tb(t)} got it! Tap a column to drop a chip.`,'pick',cancelBtn);
  else banner('Tap <b>✓ Correct</b> on the team that answered right.');
  const win=new Set(S.over&&S.over.cells||[]);
  let cells='';
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){
    const k=r*C+c,o=S.grid[k],open=S.grid[c]===-1;
    cells+=`<button class="hole ${picking&&open?'can':''} ${win.has(k)?'win':''}" data-act="col" data-c="${c}">${o>=0?`<span class="chip ${FX.k===k?'drop':''}" style="--chip:${tc(o)};--r:${r+1}"></span>`:''}</button>`;
  }
  const arrows=Array.from({length:C},(_,c)=>`<button class="arrow" data-act="col" data-c="${c}" ${picking&&S.grid[c]===-1?'':'disabled'} style="${picking?`color:${tc(t)}`:''}">▼</button>`).join('');
  const L=leaders(S.wins);
  const teams=S.teams.map((_,i)=>`<div class="trow ${t===i?'active':''} ${L[i]?'lead':''}" style="--c:${tc(i)}"><div class="thead">${tn(i)}</div><div class="score">${S.wins[i]}</div><div class="sub">round${S.wins[i]===1?'':'s'} won</div><div class="tbtns"><button class="ok" data-act="correct" data-i="${i}" ${S.over?'disabled':''}>✓ Correct</button></div></div>`).join('');
  $('board').innerHTML=`<div class="layout"><div class="c4wrap" style="width:min(100%,calc(66vh * ${C} / ${R}))"><div class="c4arrows" style="grid-template-columns:repeat(${C},1fr)">${arrows}</div><div class="c4" style="grid-template-columns:repeat(${C},1fr)">${cells}</div></div><div class="teamlist">${teams}</div></div>`;
},
click(a,el){
  if(a==='correct'){if(!S.over)ui({team:+el.dataset.i});}
  else if(a==='col'){
    const t=UI.team;if(t==null||S.over)return;
    const c=+el.dataset.c,C=S.cols;let r=-1;
    for(let rr=S.rows-1;rr>=0;rr--)if(S.grid[rr*C+c]===-1){r=rr;break;}
    if(r<0)return;
    act(()=>{const k=r*C+c;S.grid[k]=t;FX.k=k;const line=c4Four(r,c,t);
      if(line){S.over={winner:t,cells:line};S.wins[t]++;}
      else if(S.grid.every(x=>x>=0))S.over={draw:true};});
  }
  else if(a==='next')act(()=>{S.grid=S.grid.map(()=>-1);S.over=null;});
}};
function c4Four(r,c,t){
  const C=S.cols,R=S.rows,g=S.grid;
  for(const[dr,dc]of[[0,1],[1,0],[1,1],[1,-1]]){
    const cells=[r*C+c];
    for(const s of[1,-1]){let rr=r+dr*s,cc=c+dc*s;while(rr>=0&&rr<R&&cc>=0&&cc<C&&g[rr*C+cc]===t){cells.push(rr*C+cc);rr+=dr*s;cc+=dc*s;}}
    if(cells.length>=4)return cells;
  }
  return null;
}
