const GAME={
key:'tictactoe',title:'Tic-Tac-Toe Takeover',emoji:'⭕',
tagline:'Right answer? Claim a square, or steal one.',
how:`<p>Tap <b>✓ Correct</b> for the team that answered right, then tap a square to claim it. With steals on, they can also take a square another team owns.</p><p>Score: 1 point per square, plus 3 points for every three-in-a-row in any direction. A steal can break another team's line.</p>`,
options:[
  {id:'teams',label:'Teams',min:2,max:4,def:2},
  {id:'size',label:'Board',type:'seg',def:'3',choices:[['3','3×3'],['4','4×4'],['5','5×5']]},
  {id:'steal',label:'Steals',type:'seg',def:'1',choices:[['1','On'],['0','Off']]}
],
init(o){const n=+o.size;return{n,cells:Array(n*n).fill(-1),steal:o.steal==='1'}},
render(){
  const st=tttStats(),t=UI.team,picking=t!=null,full=S.cells.every(c=>c>=0);
  if(picking)banner(`✅ ${tb(t)} got it! Tap ${S.steal?'an empty square, or steal one':'an empty square'}.`,'pick',cancelBtn);
  else if(full)banner(`🏁 Board full! ${winnerText(st.score)}`,'win');
  else banner('Tap <b>✓ Correct</b> on the team that answered right.');
  const cells=S.cells.map((o,k)=>{
    const can=picking&&tttCanTake(t,k);
    const style=o>=0?`style="background:${tc(o)}26;color:${tc(o)}"`:'';
    const cls=['cell',can?'can':'',st.lineCells.has(k)?'line':'',FX.cell===k?'pop':''].join(' ');
    return `<button class="${cls}" data-act="cell" data-k="${k}" ${style}>${o>=0?MARKS[o]:''}</button>`;
  }).join('');
  const L=leaders(st.score);
  const teams=S.teams.map((_,i)=>`<div class="trow ${t===i?'active':''} ${L[i]?'lead':''}" style="--c:${tc(i)}">
    <div class="thead"><span class="mark" style="color:${tc(i)}">${MARKS[i]}</span>${tn(i)}</div><div class="score">${st.score[i]}</div>
    <div class="sub">${st.sq[i]} square${st.sq[i]===1?'':'s'} · ${st.lines[i]} line${st.lines[i]===1?'':'s'}</div>
    <div class="tbtns"><button class="ok" data-act="correct" data-i="${i}">✓ Correct</button></div></div>`).join('');
  $('board').innerHTML=`<div class="layout"><div class="ttt" style="grid-template-columns:repeat(${S.n},1fr)">${cells}</div><div class="teamlist">${teams}</div></div>`;
},
click(a,el){
  if(a==='correct'){
    const i=+el.dataset.i;
    if(!S.cells.some((_,k)=>tttCanTake(i,k))){alert('There are no squares this team can take.');return;}
    ui({team:i});
  }else if(a==='cell'){
    const t=UI.team;if(t==null)return;
    const k=+el.dataset.k;if(!tttCanTake(t,k))return;
    act(()=>{S.cells[k]=t;FX.cell=k;});
  }
}};
function tttCanTake(t,k){const o=S.cells[k];return o===-1||(S.steal&&o!==t)}
function tttWindows(n){const W=[];for(let r=0;r<n;r++)for(let c=0;c<n;c++)[[0,1],[1,0],[1,1],[1,-1]].forEach(([dr,dc])=>{const er=r+2*dr,ec=c+2*dc;if(er<0||er>=n||ec<0||ec>=n)return;W.push([0,1,2].map(k=>(r+dr*k)*n+(c+dc*k)));});return W;}
function tttStats(){
  const lineCells=new Set(),lines=S.teams.map(()=>0),sq=S.teams.map(()=>0);
  S.cells.forEach(o=>{if(o>=0)sq[o]++});
  tttWindows(S.n).forEach(w=>{const o=S.cells[w[0]];if(o>=0&&w.every(k=>S.cells[k]===o)){lines[o]++;w.forEach(k=>lineCells.add(k));}});
  return{lines,sq,score:sq.map((s,i)=>s+3*lines[i]),lineCells};
}
