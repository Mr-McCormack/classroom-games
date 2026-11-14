const GAME={
key:'ctf',title:'Capture the Flag',emoji:'🚩',
tagline:'Right answer? Take a flag from another group.',
how:`<p>Every team starts with the same number of flags. Tap <b>✓ Correct</b> for the team that answered right, then tap the team to take a flag from. Teams with no flags can't be picked. The small <b>− / +</b> buttons fix counts by hand.</p>`,
options:[
  {id:'teams',label:'Teams',min:2,max:12,def:4},
  {id:'flags',label:'Flags per team',min:1,max:50,def:5}
],
init(o){return{flags:S.teams.map(()=>o.flags)}},
render(){
  const t=UI.team,picking=t!=null;
  if(picking)banner(`✅ ${tb(t)} got it! Tap the team to take a flag from.`,'pick',cancelBtn);
  else banner('Tap <b>✓ Correct</b> on the team that answered right.');
  const L=leaders(S.flags);
  $('board').innerHTML=`<div class="fgrid">${S.teams.map((_,i)=>{
    const n=S.flags[i],c=tc(i),cls=['fcard'];
    if(n===0)cls.push('out');
    if(L[i])cls.push('lead');
    if(t===i)cls.push('winner');else if(picking){cls.push('target');if(n===0)cls.push('empty');}
    if(FX.to===i)cls.push('pop');if(FX.from===i)cls.push('shake');
    return `<div class="${cls.join(' ')}" data-act="take" data-i="${i}"><div class="fbar" style="background:${c}"></div><div class="fbody">
      ${tn(i)}<div class="fcount">${n}<small>flag${n===1?'':'s'}</small></div>
      <div class="flags">${flagSvg(c).repeat(Math.min(n,40))}${n>40?' …':''}</div>
      <div class="frow"><button class="adj" data-act="minus" data-i="${i}" ${n===0?'disabled':''}>−</button><button class="ok" data-act="correct" data-i="${i}">✓ Correct</button><button class="adj" data-act="plus" data-i="${i}">+</button></div>
      <div class="fhint">${n===0?'No flags':'Take a flag 🚩'}</div></div></div>`;}).join('')}</div>`;
},
click(a,el){
  const i=+el.dataset.i;
  if(a==='correct'){
    if(!S.flags.some((n,j)=>j!==i&&n>0)){alert('No other team has a flag to take.');return;}
    ui({team:i});
  }else if(a==='take'){
    const t=UI.team;if(t==null||i===t||S.flags[i]<1)return;
    act(()=>{S.flags[i]--;S.flags[t]++;FX.from=i;FX.to=t;});
  }
  else if(a==='minus'){if(UI.team!=null||S.flags[i]<1)return;act(()=>{S.flags[i]--;FX.from=i;});}
  else if(a==='plus'){if(UI.team!=null)return;act(()=>{S.flags[i]++;FX.to=i;});}
}};
function flagSvg(c){return `<svg viewBox="0 0 24 28"><rect x="3" y="2" width="2.2" height="25" rx="1" fill="#555"/><path d="M5 3h15l-4 5 4 5H5z" fill="${c}"/></svg>`;}
