let RISK_CACHE=null;
const GAME={
key:'risk',title:'RISK',emoji:'🗺️',
tagline:'Right answers grow your empire, one territory at a time.',
how:`<p>Each team starts with one territory. Tap <b>✓ Correct</b> for the team that answered right, then tap a glowing territory next to their land to claim it.</p><p>With attacks on, teams can also capture a neighbor's territory. A team that loses all its land can claim any open territory to get back in. Every new game draws a new map.</p>`,
options:[
  {id:'teams',label:'Teams',min:2,max:6,def:4},
  {id:'size',label:'Map',type:'seg',def:'m',choices:[['s','Small · 24'],['m','Medium · 40'],['l','Large · 60']]},
  {id:'atk',label:'Attacks',type:'seg',def:'1',choices:[['1','On'],['0','Off']]}
],
init(o){
  const dims={s:[6,4],m:[8,5],l:[10,6]}[o.size],seed=Math.floor(Math.random()*2147483647);
  S.seed=seed;S.dims=dims;const M=riskMap();
  const owner=Array(M.length).fill(-1);riskStarts(M,S.teams.length).forEach((k,i)=>owner[k]=i);
  return{seed,dims,owner,atk:o.atk==='1'};
},
render(){
  const M=riskMap(),t=UI.team,picking=t!=null,total=M.length;
  const counts=S.teams.map((_,i)=>S.owner.filter(o=>o===i).length),free=S.owner.filter(o=>o===-1).length,champ=counts.indexOf(total);
  if(champ>=0)banner(`👑 ${tb(champ)} conquered the whole map!`,'win');
  else if(picking)banner(`✅ ${tb(t)} got it! Tap a glowing territory to ${S.atk?'claim or capture':'claim'} it.`,'pick',cancelBtn);
  else if(!free&&!S.atk)banner(`🏁 The map is full! ${winnerText(counts)}`,'win');
  else banner('Tap <b>✓ Correct</b> on the team that answered right.');
  let base='',hl='';
  M.forEach((m,k)=>{const o=S.owner[k],can=picking&&riskCan(t,k);
    const p=`<path d="${m.d}" class="terr ${can?'can':''} ${picking&&!can?'dim':''} ${FX.k===k?'flash':''}" data-act="terr" data-k="${k}" style="fill:${o>=0?tc(o):'#efe9dc'};${can?`--hl:${tc(t)}`:''}"/>`;
    if(can)hl+=p;else base+=p;});
  const L=leaders(counts);
  const teams=S.teams.map((_,i)=>`<div class="trow ${t===i?'active':''} ${L[i]?'lead':''}" style="--c:${tc(i)}"><div class="thead">${tn(i)}</div><div class="score">${counts[i]}</div><div class="sub">${Math.round(counts[i]/total*100)}% of the map${counts[i]===0?' · can rejoin on any open land':''}</div><div class="tbtns"><button class="ok" data-act="correct" data-i="${i}" ${champ>=0?'disabled':''}>✓ Correct</button></div></div>`).join('');
  $('board').innerHTML=`<div class="layout"><div class="mapwrap"><svg viewBox="0 0 1000 620" class="map">${base}${hl}</svg><div class="mapnote">${free} open territor${free===1?'y':'ies'} · ${total} total</div></div><div class="teamlist">${teams}</div></div>`;
},
click(a,el){
  if(a==='correct'){const i=+el.dataset.i;if(!S.owner.some((_,k)=>riskCan(i,k))){alert('This team has no territory it can take right now.');return;}ui({team:i});}
  else if(a==='terr'){const t=UI.team;if(t==null)return;const k=+el.dataset.k;if(!riskCan(t,k))return;act(()=>{S.owner[k]=t;FX.k=k;});}
}};
function riskCan(t,k){
  const M=riskMap(),o=S.owner[k];if(o===t)return false;
  if(!S.owner.includes(t))return o===-1||(S.atk&&!S.owner.includes(-1));
  if(o!==-1&&!S.atk)return false;
  return M[k].adj.some(j=>S.owner[j]===t);
}
function riskStarts(M,n){
  const pick=[Math.floor(Math.random()*M.length)];
  while(pick.length<n){let best=-1,bd=-1;
    M.forEach((m,k)=>{if(pick.includes(k))return;const d=Math.min(...pick.map(p=>Math.hypot(M[p].c[0]-m.c[0],M[p].c[1]-m.c[1])));if(d>bd){bd=d;best=k;}});
    pick.push(best);}
  return pick;
}
// --- Map: seeded Voronoi territories (one Lloyd relaxation), rebuilt from the seed so saves stay small ---
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function clipHalf(poly,a,b,lab){
  const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],f=v=>(v.x-mx)*dx+(v.y-my)*dy,out=[],n=poly.length;
  for(let i=0;i<n;i++){const P=poly[i],Q=poly[(i+1)%n],fp=f(P),fq=f(Q);
    if(fp<=0){out.push(P);if(fq>0){const t=fp/(fp-fq);out.push({x:P.x+(Q.x-P.x)*t,y:P.y+(Q.y-P.y)*t,l:lab});}}
    else if(fq<0){const t=fp/(fp-fq);out.push({x:P.x+(Q.x-P.x)*t,y:P.y+(Q.y-P.y)*t,l:P.l});}}
  return out;
}
function centroid(poly){let a=0,cx=0,cy=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],cr=p.x*q.y-q.x*p.y;a+=cr;cx+=(p.x+q.x)*cr;cy+=(p.y+q.y)*cr;}a/=2;return Math.abs(a)>1e-6?[cx/(6*a),cy/(6*a)]:[poly[0].x,poly[0].y]}
function riskMap(){
  if(RISK_CACHE&&RISK_CACHE.seed===S.seed)return RISK_CACHE.M;
  const[cols,rows]=S.dims,R=mulberry(S.seed),W=1000,Hh=620,pad=12,cw=(W-2*pad)/cols,ch=(Hh-2*pad)/rows;
  let P=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)P.push([pad+(c+.5+(R()-.5)*.75)*cw,pad+(r+.5+(R()-.5)*.75)*ch]);
  const cells=pts=>pts.map((p,i)=>{let poly=[{x:pad,y:pad,l:-1},{x:W-pad,y:pad,l:-1},{x:W-pad,y:Hh-pad,l:-1},{x:pad,y:Hh-pad,l:-1}];
    for(let j=0;j<pts.length&&poly.length;j++)if(j!==i)poly=clipHalf(poly,p,pts[j],j);return poly;});
  P=cells(P).map(centroid);
  const C=cells(P),adj=C.map(()=>new Set());
  C.forEach((poly,i)=>poly.forEach((v,vi)=>{const w=poly[(vi+1)%poly.length];if(v.l>=0&&Math.hypot(w.x-v.x,w.y-v.y)>4){adj[i].add(v.l);adj[v.l].add(i);}}));
  const M=C.map((poly,i)=>({d:'M'+poly.map(v=>v.x.toFixed(1)+','+v.y.toFixed(1)).join('L')+'Z',c:centroid(poly),adj:[...adj[i]]}));
  RISK_CACHE={seed:S.seed,M};return M;
}
