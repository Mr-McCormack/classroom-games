const GAME={
key:'jeopardy',title:'Jeopardy Board',emoji:'💰',keep:['cats'],
correct(i){if(!S.done.includes(null)){alert('Every tile has been played.');return;}ui({award:i});},
tagline:'Pick a category and value. The problem is on the worksheet.',
how:`<p>Label the worksheet problems by category and value, like <i>Category 2 · 300</i>. Click a category name on the board to rename it.</p><p>Tap a tile to open it, then tap the team that answered right. With penalties on, a wrong answer loses that many points and the tile stays open for other teams. Tap a played tile to reopen it.</p>`,
options:[
  {id:'teams',label:'Teams',min:2,max:8,def:3},
  {id:'cats',label:'Categories',min:2,max:6,def:5},
  {id:'rows',label:'Values',type:'seg',def:'5',choices:[['3','100–300'],['4','100–400'],['5','100–500']]},
  {id:'pen',label:'Wrong answers lose points',type:'seg',def:'0',choices:[['0','No'],['1','Yes']]}
],
init(o){const rows=+o.rows;return{cats:Array.from({length:o.cats},(_,j)=>'Category '+(j+1)),rows,done:Array(o.cats*rows).fill(null),scores:S.teams.map(()=>0),pen:o.pen==='1'}},
render(){
  const nc=S.cats.length,open=UI.tile;
  if(UI.award!=null)banner(`✅ ${tb(UI.award)} got it! Tap the tile they solved.`,'pick',cancelBtn);
  else if(S.done.every(d=>d!==null))banner(`🏁 Board cleared! ${winnerText(S.scores)}`,'win');
  else banner('Tap a tile to open it. Click a category name to rename it.');
  let g=S.cats.map((c,j)=>`<button class="jcat" data-act="cat" data-j="${j}" title="Click to rename">${esc(c)}</button>`).join('');
  for(let r=0;r<S.rows;r++)for(let j=0;j<nc;j++){const k=r*nc+j,d=S.done[k],v=(r+1)*100;
    g+=d===null?`<button class="jtile ${UI.award!=null?'can':''}" data-act="tile" data-k="${k}">${v}</button>`
      :`<button class="jtile played ${d>=0?'':'none'} ${FX.k===k?'pop':''}" data-act="tile" data-k="${k}" title="Click to reopen" style="${d>=0?`--c:${tc(d)}`:''}">${d>=0?esc(S.teams[d].name):'—'}<small>${v}</small></button>`;}
  const L=leaders(S.scores);
  const teams=S.teams.map((_,i)=>`<div class="jteam ${L[i]?'lead':''}" style="--c:${tc(i)}">${tn(i)}<div class="jscore ${FX.s===i?'pop':''}">${S.scores[i]}</div><div class="jadj"><button class="adj" data-act="adj" data-i="${i}" data-d="-100">−100</button><button class="adj" data-act="adj" data-i="${i}" data-d="100">+100</button></div></div>`).join('');
  let modal='';
  if(open!=null){const j=open%nc,v=jVal(open),wrong=UI.wrong||[];
    modal=`<div class="modal"><div class="mbox"><div class="mcat">${esc(S.cats[j])}</div><div class="mval">${v}</div><p class="mq">Worksheet problem: <b>${esc(S.cats[j])} · ${v}</b></p>
      <div class="mteams">${S.teams.map((_,i)=>{const w=wrong.includes(i)?'disabled':'';return `<div class="mrow" style="--c:${tc(i)}">${tb(i)}${S.pen?`<button class="no" data-act="wrong" data-i="${i}" ${w}>✗ −${v}</button>`:''}<button class="ok" data-act="award" data-i="${i}" ${w}>✓ +${v}</button></div>`}).join('')}</div>
      <div class="mfoot"><button class="btn" data-act="nobody">Nobody got it</button><button class="btn" data-act="cancel">Back to board</button></div></div></div>`;}
  $('board').innerHTML=`<div class="jboard" style="grid-template-columns:repeat(${nc},1fr)">${g}</div><div class="jteams">${teams}</div>${modal}`;
},
click(a,el){
  if(a==='cat'){if(UI.tile!=null)return;const j=+el.dataset.j,n=prompt('Category name:',S.cats[j]);if(n&&n.trim()){S.cats[j]=n.trim().slice(0,40);save();draw();}}
  else if(a==='tile'){const k=+el.dataset.k;
    if(UI.award!=null){const i=UI.award;if(S.done[k]===null)act(()=>{S.scores[i]+=jVal(k);S.done[k]=i;FX.k=k;FX.s=i;});return;}
    if(S.done[k]===null){ui({tile:k,wrong:[]});return;}
    if(confirm('Reopen this tile? Any points it gave will be taken back.'))act(()=>{const d=S.done[k];if(d>=0)S.scores[d]-=jVal(k);S.done[k]=null;});}
  else if(a==='award'){const k=UI.tile;if(k==null)return;const i=+el.dataset.i;act(()=>{S.scores[i]+=jVal(k);S.done[k]=i;FX.k=k;FX.s=i;});}
  else if(a==='wrong'){const k=UI.tile;if(k==null)return;const i=+el.dataset.i;if(UI.wrong.includes(i))return;UI.wrong.push(i);act(()=>{S.scores[i]-=jVal(k);FX.s=i;},true);}
  else if(a==='nobody'){const k=UI.tile;if(k==null)return;act(()=>{S.done[k]=-1;FX.k=k;});}
  else if(a==='adj'){const i=+el.dataset.i,d=+el.dataset.d;act(()=>{S.scores[i]+=d;FX.s=i;});}
}};
function jVal(k){return(Math.floor(k/S.cats.length)+1)*100}
