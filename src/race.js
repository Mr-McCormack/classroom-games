const GAME={
key:'race',title:'Race Track',emoji:'🏁',
correct(i){if(S.hz!=null){alert('Finish the hazard question first.');return;}raceMove(i,1);},
tagline:'Right answers drive your car to the finish line.',
how:`<p>Tap <b>+1</b> for a correct answer, or <b>+2</b> / <b>+3</b> for harder problems. <b>−1</b> moves a car back.</p><p>With hazards on, a car that lands on ⚠️ has to answer a bonus question. Right means it stays put. Wrong sends it back 2.</p>`,
options:[
  {id:'teams',label:'Teams',min:2,max:8,def:4},
  {id:'len',label:'Track length',min:10,max:40,def:20},
  {id:'hz',label:'Hazards',type:'seg',def:'1',choices:[['1','On'],['0','Off']]}
],
init(o){
  const len=o.len,hz=[];
  if(o.hz==='1'){const want=Math.max(2,Math.round(len/6)),pool=[];for(let k=2;k<len-1;k++)pool.push(k);
    while(hz.length<want&&pool.length){const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0];if(!hz.some(h=>Math.abs(h-k)<2))hz.push(k);}}
  return{len,pos:S.teams.map(()=>0),hazards:hz,finish:[],hz:null};
},
render(){
  const medals=['🥇','🥈','🥉'],lock=S.hz!=null;
  if(lock)banner(`⚠️ ${tb(S.hz)} hit a hazard! Bonus question: right = stay, wrong = back 2.`,'alert','<button data-act="hzok">✓ Got it</button><button data-act="hzmiss">✗ Missed (back 2)</button>');
  else if(S.finish.length)banner(`🏁 ${tb(S.finish[0])} crossed the finish line first!`,'win');
  else banner('Tap <b>+1</b> for a correct answer, or <b>+2</b> / <b>+3</b> for harder problems.');
  const lanes=S.teams.map((_,i)=>{
    const place=S.finish.indexOf(i);let cells='';
    for(let k=0;k<=S.len;k++){const cls=k===0?'start':k===S.len?'fin':S.hazards.includes(k)?'hz':'';
      cells+=`<div class="sq ${cls}">${S.pos[i]===k?`<span class="car ${FX.car===i?'pop':''}">${carSvg(tc(i))}</span>`:(cls==='hz'?'⚠️':'')}</div>`;}
    const d=lock?'disabled':'';
    return `<div class="lane" style="--c:${tc(i)}"><div class="lname">${tn(i)}<span class="lpos">${place>=0?(medals[place]||'🏁')+' Finished #'+(place+1):S.pos[i]+' / '+S.len}</span></div>
      <div class="track" style="grid-template-columns:repeat(${S.len+1},minmax(26px,1fr))">${cells}</div>
      <div class="lbtns"><button class="adj" data-act="mv" data-i="${i}" data-d="-1" ${d}>−1</button><button class="ok" data-act="mv" data-i="${i}" data-d="1" ${d}>+1</button><button class="adj" data-act="mv" data-i="${i}" data-d="2" ${d}>+2</button><button class="adj" data-act="mv" data-i="${i}" data-d="3" ${d}>+3</button></div></div>`;
  }).join('');
  $('board').innerHTML=`<div class="lanes">${lanes}</div>`;
},
click(a,el){
  if(a==='mv'){if(S.hz!=null)return;raceMove(+el.dataset.i,+el.dataset.d,true);}
  else if(a==='hzok')act(()=>{S.hz=null;});
  else if(a==='hzmiss'){const i=S.hz;if(i==null)return;act(()=>{S.hz=null;raceSet(i,S.pos[i]-2);});}
}};
function raceSet(i,p){p=Math.max(0,Math.min(S.len,p));S.pos[i]=p;FX.car=i;
  if(p>=S.len){if(!S.finish.includes(i))S.finish.push(i);}else S.finish=S.finish.filter(x=>x!==i);}
function raceMove(i,d){
  const p=Math.max(0,Math.min(S.len,S.pos[i]+d));if(p===S.pos[i])return;
  act(()=>{raceSet(i,p);if(d>0&&p<S.len&&S.hazards.includes(p))S.hz=i;});
}
function carSvg(c){return `<svg viewBox="0 0 40 24"><path d="M3 17 L7 10 Q9 6 14 6 H24 Q28 6 31 10 L36 12 Q39 13 39 17 V19 H1 V17Z" fill="${c}"/><rect x="15" y="8" width="9" height="5" rx="1.5" fill="#d7ecff"/><circle cx="10" cy="19" r="4" fill="#222"/><circle cx="30" cy="19" r="4" fill="#222"/></svg>`}
