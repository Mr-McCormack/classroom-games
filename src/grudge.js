const GAME={
key:'grudge',title:'Grudge Ball',emoji:'❌',
tagline:"Right answer? Erase X's from the other teams.",
how:`<p>Every team starts with the same number of X's. Tap <b>✓ Correct</b> for the team that answered right, then tap other teams to erase their X's, one tap per X. The erases can be split across teams.</p><p>A team at zero is still in the game and can keep answering and erasing. The team with the most X's at the end wins.</p>`,
options:[
  {id:'teams',label:'Teams',min:2,max:10,def:4},
  {id:'xs',label:"Starting X's",min:3,max:20,def:10},
  {id:'erase',label:'Erases per correct answer',type:'seg',def:'2',choices:[['1','1'],['2','2'],['3','3']]}
],
init(o){return{xs:S.teams.map(()=>o.xs),erase:+o.erase}},
render(){
  const t=UI.team,picking=t!=null;
  if(picking)banner(`✅ ${tb(t)} got it! Tap another team to erase an X. <b>${UI.left}</b> left.`,'pick','<button data-act="cancel">Done</button>');
  else banner('Tap <b>✓ Correct</b> on the team that answered right.');
  const L=leaders(S.xs);
  $('board').innerHTML=`<div class="ggrid">${S.teams.map((_,i)=>{const n=S.xs[i],tgt=picking&&i!==t;
    const cls=['gt',L[i]?'lead':'',t===i?'active':'',tgt?(n>0?'target':'target empty'):'',FX.hit===i?'shake':''].join(' ');
    return `<div class="${cls}" style="--c:${tc(i)}" data-act="hit" data-i="${i}"><div class="ghead">${tn(i)}<span class="gcount">${n}</span></div>
      <div class="xs">${'<span class="x">✕</span>'.repeat(Math.min(n,40))}${n>40?' …':''}${n===0?'<span class="still">Still in it!</span>':''}</div>
      <div class="gbtns"><button class="adj" data-act="minus" data-i="${i}" ${n===0?'disabled':''}>−</button><button class="ok" data-act="correct" data-i="${i}">✓ Correct</button><button class="adj" data-act="plus" data-i="${i}">+</button></div>
      <div class="ghint">${n>0?'Erase an X ✕':"No X's to erase"}</div></div>`}).join('')}</div>`;
},
click(a,el){
  const i=+el.dataset.i;
  if(a==='correct'){
    if(!S.xs.some((n,j)=>j!==i&&n>0)){alert("No other team has an X to erase.");return;}
    ui({team:i,left:S.erase});
  }else if(a==='hit'){
    const t=UI.team;if(t==null||i===t||S.xs[i]<1)return;
    UI.left--;
    const more=UI.left>0&&S.xs.some((n,j)=>j!==t&&(j===i?n-1:n)>0);
    if(!more)UI={};
    act(()=>{S.xs[i]--;FX.hit=i;},true);
  }
  else if(a==='minus'){if(S.xs[i]<1)return;act(()=>{S.xs[i]--;});}
  else if(a==='plus')act(()=>{S.xs[i]++;});
}};
