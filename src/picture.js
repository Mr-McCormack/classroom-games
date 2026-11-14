let IMG=null,IMG_AR=1;
const GAME={
key:'picture',title:'Mystery Picture',emoji:'🖼️',
noBuzz(){return S.teams.length<2},
tagline:'Right answers reveal tiles. Who can guess the picture first?',
how:`<p>Choose any picture from your computer. It stays on this device and is never uploaded. Tiles are numbered, so you can match them to worksheet problems if you like.</p><p>With one team (the whole class), just tap a tile to reveal it. With several teams, tap <b>✓ Correct</b> for the team, then a tile, and they earn 1 point. A correct guess of the picture earns the guess bonus.</p>`,
options:[
  {id:'pic',type:'html',html:`<div class="picpick"><label class="btn filebtn">📷 Choose picture<input type="file" accept="image/*" id="picFile"></label><span id="picName">No picture chosen</span></div><img id="picPrev" alt="" hidden>`},
  {id:'teams',label:'Teams (1 = whole class)',min:1,max:8,def:1},
  {id:'grid',label:'Tiles',type:'seg',def:'5',choices:[['4','4×4'],['5','5×5'],['6','6×6'],['8','8×8']]},
  {id:'bonus',label:'Guess bonus (points)',min:0,max:20,def:5}
],
setupInit(){picInput($('picFile'),()=>{$('picName').textContent='Picture ready ✓';$('picPrev').src=IMG;$('picPrev').hidden=false;});},
beforeStart(){
  if(!IMG){alert('Choose a picture first.');return false;}
  try{localStorage.setItem(KEY+'-img',IMG)}catch(e){alert("This picture is too large to save, so the game won't come back after a refresh. It will still play fine right now.")}
  return true;
},
onResume(){try{IMG=localStorage.getItem(KEY+'-img')}catch(e){IMG=null}},
init(o){if(S.teams.length===1)S.teams[0].name='Whole class';const n=+o.grid;return{n,open:Array(n*n).fill(-2),pts:S.teams.map(()=>0),bonus:o.bonus,solved:null,ar:IMG_AR}},
render(){
  if(!IMG){
    banner("This game's picture wasn't saved. Choose it again to keep playing.",'alert');
    $('board').innerHTML=`<div class="picpick center"><label class="btn filebtn">📷 Choose picture<input type="file" accept="image/*" id="picFile2"></label></div>`;
    picInput($('picFile2'),()=>{S.ar=IMG_AR;try{localStorage.setItem(KEY+'-img',IMG)}catch(e){}save();draw();});
    return;
  }
  const multi=S.teams.length>1,t=UI.team,n=S.n,hidden=S.open.filter(x=>x===-2).length,fade=FX.fade||[];
  if(UI.guess)banner('🔍 Who guessed the picture?','pick',(multi?S.teams.map((_,i)=>`<button data-act="solve" data-i="${i}" style="border-color:${tc(i)}">${esc(S.teams[i].name)}</button>`).join(''):'<button data-act="solve" data-i="0">✓ They got it!</button>')+cancelBtn);
  else if(S.solved!=null)banner(S.solved>=0?(multi?`🎉 ${tb(S.solved)} guessed it! +${S.bonus} bonus. ${winnerText(S.pts)}`:'🎉 The class guessed it!'):'🖼️ Picture revealed.','win');
  else if(t!=null)banner(`✅ ${tb(t)} got it! Tap a tile to reveal it.`,'pick',cancelBtn);
  else banner(multi?'Tap <b>✓ Correct</b> on the team that answered right, then pick a tile.':'Tap a tile to reveal it.');
  const can=S.solved==null&&(!multi||t!=null);
  const tiles=S.open.map((o,k)=>{
    if(o===-2)return `<button class="ptile ${can?'can':''}" data-act="tile" data-k="${k}" style="background:hsl(${(k*47)%360} 55% 50%)">${k+1}</button>`;
    if(fade.includes(k))return `<div class="ptile fade" style="background:hsl(${(k*47)%360} 55% 50%)">${k+1}</div>`;
    return '<div class="ptile open"></div>';
  }).join('');
  const L=leaders(S.pts);
  const pts=multi?`<div class="teamlist">${S.teams.map((_,i)=>`<div class="trow ${t===i?'active':''} ${L[i]?'lead':''}" style="--c:${tc(i)}"><div class="thead">${tn(i)}</div><div class="score">${S.pts[i]}</div><div class="tbtns"><button class="ok" data-act="correct" data-i="${i}" ${S.solved!=null?'disabled':''}>✓ Correct</button></div></div>`).join('')}</div>`:'';
  const dis=S.solved!=null?'disabled':'';
  const tools=`<div class="ptools"><span class="pleft">${hidden} tile${hidden===1?'':'s'} left</span><button class="btn" data-act="guess" ${dis}>🔍 Someone guessed it</button><button class="btn" data-act="revealall" ${dis}>Reveal all</button></div>`;
  $('board').innerHTML=`<div class="${multi?'layout':''}"><div><div class="pic" style="aspect-ratio:${S.ar};width:min(100%,calc(66vh * ${S.ar}))"><div class="pgrid" style="grid-template-columns:repeat(${n},1fr);grid-template-rows:repeat(${n},1fr)">${tiles}</div></div>${tools}</div>${pts}</div>`;
  $('board').querySelector('.pic').style.backgroundImage=`url(${IMG})`;
},
click(a,el){
  const multi=S.teams.length>1;
  if(a==='correct'){if(S.solved!=null)return;if(!S.open.includes(-2)){alert('Every tile is already showing.');return;}ui({team:+el.dataset.i});}
  else if(a==='tile'){
    if(S.solved!=null)return;const k=+el.dataset.k;if(S.open[k]!==-2)return;
    const t=multi?UI.team:-1;if(multi&&t==null)return;
    act(()=>{S.open[k]=t;if(t>=0)S.pts[t]++;FX.fade=[k];});
  }
  else if(a==='guess'){if(S.solved==null)ui({guess:true});}
  else if(a==='solve'){const i=+el.dataset.i;act(()=>{picRevealAll();S.solved=i;if(multi)S.pts[i]+=S.bonus;});}
  else if(a==='revealall'){if(confirm('Reveal the whole picture?'))act(()=>{picRevealAll();S.solved=-1;});}
}};
function picRevealAll(){FX.fade=[];S.open.forEach((o,k)=>{if(o===-2){S.open[k]=-1;FX.fade.push(k);}});}
function picInput(inp,cb){
  inp.addEventListener('change',()=>{
    const f=inp.files&&inp.files[0];if(!f)return;
    const rd=new FileReader();
    rd.onload=()=>{const im=new Image();
      im.onload=()=>{const sc=Math.min(1,1400/Math.max(im.width,im.height)),cv=document.createElement('canvas');
        cv.width=Math.round(im.width*sc);cv.height=Math.round(im.height*sc);
        const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(im,0,0,cv.width,cv.height);
        IMG=cv.toDataURL('image/jpeg',.85);IMG_AR=+(cv.width/cv.height).toFixed(4);cb();};
      im.onerror=()=>alert("That file couldn't be opened as a picture. Try a JPG or PNG.");
      im.src=rd.result;};
    rd.readAsDataURL(f);
  });
}
