const GAME={
key:'bank',title:'Bank It or Risk It',emoji:'🏦',
correct(i){GAME.click('right',{dataset:{i:String(i)}});},
wrong(i){if(S.pot[i])GAME.click('miss',{dataset:{i:String(i)}});},
tagline:'Build your pot, then bank it before you miss.',
how:`<p>Each correct answer adds points to a team's pot. With a growing pot, the first correct answer adds 1, the next adds 2, then 3, and so on.</p><p>A team can <b>Bank it</b> at any time to lock in the pot. If they miss before banking, the whole pot is lost. Only banked points count.</p>`,
options:[
  {id:'teams',label:'Teams',min:2,max:8,def:4},
  {id:'esc',label:'Pot',type:'seg',def:'1',choices:[['1','Grows 1, 2, 3…'],['0','+1 each']]}
],
init(o){const z=()=>S.teams.map(()=>0);return{bank:z(),pot:z(),streak:z(),esc:o.esc==='1',last:null}},
render(){
  if(S.last){const L=S.last;banner(L.t==='bust'?`💥 ${tb(L.i)} missed and lost ${L.v} point${L.v===1?'':'s'}!`:`🏦 ${tb(L.i)} banked ${L.v} point${L.v===1?'':'s'}.`,L.t==='bust'?'alert':'win');}
  else banner('Right answer: <b>✓ Correct</b>. Lock it in: <b>Bank it</b>. A miss loses the pot.');
  const L=leaders(S.bank);
  $('board').innerHTML=`<div class="bkgrid">${S.teams.map((_,i)=>{const next=S.esc?S.streak[i]+1:1;
    return `<div class="bk ${L[i]?'lead':''} ${FX.bust===i?'shake bust':''} ${FX.bank===i?'pop':''}" style="--c:${tc(i)}">${tn(i)}
      <div class="bkbank"><span>🏦</span>${S.bank[i]}</div><div class="bklabel">banked</div>
      <div class="bkpot ${S.pot[i]?'hot':''}">At risk: <b>${S.pot[i]}</b></div>
      <button class="ok" data-act="right" data-i="${i}">✓ Correct (+${next})</button>
      <div class="bkrow"><button class="bankbtn" data-act="bank" data-i="${i}" ${S.pot[i]?'':'disabled'}>🏦 Bank it</button><button class="no" data-act="miss" data-i="${i}" ${S.pot[i]?'':'disabled'}>✗ Missed</button></div></div>`}).join('')}</div>`;
},
click(a,el){
  const i=+el.dataset.i;
  if(a==='right')act(()=>{S.streak[i]++;S.pot[i]+=S.esc?S.streak[i]:1;S.last=null;FX.bank=-1;});
  else if(a==='bank'){if(!S.pot[i])return;act(()=>{S.last={t:'bank',i,v:S.pot[i]};S.bank[i]+=S.pot[i];S.pot[i]=0;S.streak[i]=0;FX.bank=i;});}
  else if(a==='miss'){if(!S.pot[i])return;act(()=>{S.last={t:'bust',i,v:S.pot[i]};S.pot[i]=0;S.streak[i]=0;FX.bust=i;});}
}};
