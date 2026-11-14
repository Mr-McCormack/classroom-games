let TUG_PREV=null;
const GAME={
key:'tug',title:'Tug of War',emoji:'🪢',fixedTeams:2,buzzCool:false,
correct(i){if(S.over!=null){alert('Start the next round first.');return;}GAME.click('pull',{dataset:{i:String(i),n:'1'}});},
tagline:'Every right answer pulls the rope your way.',
how:`<p>Two teams. Each correct answer pulls the marker one step toward that team. Use <b>Hard ×2</b> for tougher problems. Pull the marker all the way into your zone to win the round.</p>`,
options:[{id:'goal',label:'Pulls to win',min:3,max:15,def:7}],
init(o){return{pos:0,goal:o.goal,wins:[0,0],over:null}},
render(){
  const g=S.goal,p=S.pos,done=S.over!=null;
  if(done)banner(`🎉 ${tb(S.over)} wins the round!`,'win',nextBtn);
  else if(p===0)banner('Dead even! Tap <b>✓ Correct</b> for the team that answered right.');
  else{const lead=p<0?0:1;banner(`${tb(lead)} is pulling ahead. ${g-Math.abs(p)} more to win.`);}
  const pct=50+(p/g)*42;
  let ticks='';for(let k=-g;k<=g;k++)ticks+=`<span class="tick ${k===0?'mid':''}" style="left:${50+(k/g)*42}%"></span>`;
  const side=i=>{const need=i===0?g+p:g-p;return `<div class="tside" style="--c:${tc(i)}">${tn(i)}
    <div class="tw">${S.wins[i]}<small> round${S.wins[i]===1?'':'s'} won</small></div>
    <div class="away">${done?'':need+' pull'+(need===1?'':'s')+' to win'}</div>
    <button class="ok" data-act="pull" data-i="${i}" data-n="1" ${done?'disabled':''}>✓ Correct</button>
    <button class="adj" data-act="pull" data-i="${i}" data-n="2" ${done?'disabled':''}>Hard problem ×2</button></div>`};
  const start=TUG_PREV==null?pct:TUG_PREV;
  $('board').innerHTML=`<div class="rope-area"><div class="zone left" style="background:${tc(0)}"></div><div class="zone right" style="background:${tc(1)}"></div>${ticks}<div class="rope"></div><div class="knot" id="knot" style="left:${start}%"></div></div><div class="tsides">${side(0)}${side(1)}</div>`;
  const kn=$('knot');kn.getBoundingClientRect();kn.style.left=pct+'%';TUG_PREV=pct;
},
click(a,el){
  if(a==='pull'){
    if(S.over!=null)return;
    const i=+el.dataset.i,n=+el.dataset.n;
    act(()=>{S.pos=Math.max(-S.goal,Math.min(S.goal,S.pos+(i===0?-n:n)));if(Math.abs(S.pos)>=S.goal){S.over=i;S.wins[i]++;}});
  }
  else if(a==='next')act(()=>{S.pos=0;S.over=null;});
}};
