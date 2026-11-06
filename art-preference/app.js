// Static, deterministic demonstration model. NOT a validated preference diagnosis.
// Production must replace preview-artworks.json with a provenance-checked 1,024-painting manifest.
const VERSION="preview-v0.4-offline-fixture";
const $$=id=>document.getElementById(id);

/* Offline-safe preview fixture. Original algorithmic sample images, NOT actual museum artworks.
   Remove only after a rights-audited snapshot with verified stored image bytes is deployed. */
function previewSvg(i){
  const palettes=[
    ["#e5d9bf","#c65c4e","#243b4b","#eab86c","#759287"],
    ["#eae3d7","#416b78","#d79b53","#704655","#b5b3a4"],
    ["#f2e8cf","#172d45","#d64f38","#d9b44b","#94b7a3"],
    ["#d8e0dc","#a14a4a","#f0bc67","#44575e","#eff0d6"],
    ["#ede0c5","#8b7156","#23364a","#b94f36","#b7a48a"],
    ["#e2dad7","#315866","#c9a083","#772f3a","#cad1b3"]
  ];
  const p=palettes[i%palettes.length];
  let state=(i+1)*17389;
  const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
  const esc=x=>Number(x.toFixed(1));
  const rect=(x,y,w,h,c,op=1)=>`<rect x="${esc(x)}" y="${esc(y)}" width="${esc(w)}" height="${esc(h)}" fill="${c}" opacity="${op}"/>`;
  const circle=(x,y,r,c,op=1)=>`<circle cx="${esc(x)}" cy="${esc(y)}" r="${esc(r)}" fill="${c}" opacity="${op}"/>`;
  const style=i%4;
  let shapes="";
  if(style===0){
    for(let n=0;n<18;n++){const x=rnd()*600,y=rnd()*720;shapes+=rect(x,y,28+rnd()*210,18+rnd()*160,p[1+n%4],.53+rnd()*.35)}
    for(let n=0;n<8;n++)shapes+=`<path d="M ${esc(rnd()*600)} 0 V 720" stroke="${p[2]}" stroke-width="${1+rnd()*6}" opacity=".62"/>`;
  } else if(style===1){
    shapes+=circle(360+rnd()*80,110+rnd()*80,50+rnd()*48,p[3],.8);
    for(let n=0;n<6;n++){const y=250+n*80;shapes+=`<path d="M0 ${y} Q 160 ${esc(y-160*rnd())} 300 ${esc(y+40*rnd())} T600 ${esc(y-70*rnd())} L600 720 L0 720Z" fill="${p[(n+1)%5]}" opacity="${.50+n*.06}"/>`;}
    for(let n=0;n<21;n++)shapes+=`<path d="M${esc(rnd()*600)} ${esc(460+rnd()*270)} q ${esc(rnd()*25)} -${esc(10+rnd()*60)} ${esc(rnd()*55)} -${esc(5+rnd()*35)}" stroke="${p[3]}" fill="none" stroke-width="${2+rnd()*7}" opacity=".6"/>`;
  } else if(style===2){
    for(let n=0;n<24;n++){const x=rnd()*600,y=rnd()*700,w=10+rnd()*170;shapes+=`<path d="M${esc(x)} ${esc(y)} C${esc(x+50)} ${esc(y-90)} ${esc(x+w)} ${esc(y+100)} ${esc(x+w/2)} ${esc(y+100)}" fill="none" stroke="${p[n%5]}" stroke-width="${2+rnd()*21}" stroke-linecap="round" opacity=".7"/>`;}
    for(let n=0;n<20;n++)shapes+=circle(rnd()*600,rnd()*720,6+rnd()*60,p[(n+2)%5],.3+rnd()*.3);
  } else {
    for(let n=0;n<120;n++){const x=rnd()*600,y=rnd()*720;shapes+=circle(x,y,3+rnd()*27,p[n%5],.3+rnd()*.55)}
    for(let n=0;n<7;n++)shapes+=`<path d="M${esc(rnd()*600)} ${esc(rnd()*720)} Q${esc(rnd()*600)} ${esc(rnd()*720)} ${esc(rnd()*600)} ${esc(rnd()*720)}" fill="none" stroke="${p[n%5]}" stroke-width="${8+rnd()*23}" opacity=".5"/>`;
  }
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="720" viewBox="0 0 600 720"><rect width="600" height="720" fill="${p[0]}"/>${shapes}<rect x="8" y="8" width="584" height="704" fill="none" stroke="#ffffff" stroke-opacity=".2" stroke-width="8"/></svg>`;
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
function previewCatalog(){
  return Array.from({length:32},(_,i)=>({
    id:"preview-original-"+String(i+1).padStart(2,"0"),
    title:"構図習作 "+String(i+1).padStart(2,"0"),
    artist:"Karin-Lab 試験用生成画像",
    image:previewSvg(i),
    features:Array.from({length:6},(_,k)=>Number((((i*17+k*11)%29)/28).toFixed(5)))
  }));
}
const CATALOG=previewCatalog();
const D=CATALOG[0]?.features?.length||6;
let history=[],seen=new Set(),bad=new Set(),currentPair=[],displayedAt=0,round=0,epoch=0;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const subtract=(a,b)=>a.map((x,i)=>x-b[i]);
const dist2=(a,b)=>a.reduce((s,x,i)=>s+(x-b[i])**2,0);
function direction(record){const a=CATALOG.find(x=>x.id===record.pair[0]);const b=CATALOG.find(x=>x.id===record.pair[1]);return record.choice===0?subtract(a.features,b.features):subtract(b.features,a.features)}
export function preference(records,weighted=true){
  if(!records.length)return Array(D).fill(0);
  const logs=records.map(r=>Math.log(Math.max(0.15,r.ms/1000)));
  const mean=logs.reduce((s,x)=>s+x,0)/logs.length;
  const variance=logs.reduce((s,x)=>s+(x-mean)**2,0)/Math.max(1,logs.length-1);
  const sigma=Math.sqrt(variance+0.04);
  const weights=records.map((r,i)=>{
    if(!weighted||records.length<4)return 1;
    const z=(logs[i]-mean)/sigma;
    // Tentative conservative two-level rule; not validated as a confidence measure.
    return z>0?0.75:1;
  });
  return records.reduce((v,r,i)=>v.map((n,j)=>n+weights[i]*direction(r)[j]),Array(D).fill(0));
}
function nextPair(){
  const available=CATALOG.filter(x=>!seen.has(x.id)&&!bad.has(x.id));
  if(available.length<2)return [];
  const u=preference(history,false);
  let best=null,bestScore=-Infinity;
  for(let i=0;i<available.length;i++)for(let j=i+1;j<available.length;j++){
    const a=available[i],b=available[j],delta=subtract(a.features,b.features);
    const diversity=dist2(a.features,b.features);
    const closeness=1/(1+Math.abs(dot(u,delta)));
    const quality=history.length? 0.55*diversity+1.6*closeness:diversity;
    // Stable ID tie breaker.
    if(quality>bestScore+1e-10||(Math.abs(quality-bestScore)<1e-10&&[a.id,b.id].join("|")<(best||[]).map(x=>x.id).join("|"))){best=[a,b];bestScore=quality}
  }
  return best;
}
function choiceImage(p,index,token){
 const button=document.createElement("button");button.type="button";button.className="art";
 button.setAttribute("aria-label",`作品 ${index===0?"A":"B"} を選ぶ`);
 const img=document.createElement("img");img.alt=`絵画 ${index===0?"A":"B"}`;img.decoding="async";img.loading="eager";
 button.append(img);
 img.addEventListener("error",()=>{if(p.fallback_image&&!img.dataset.fallback){img.dataset.fallback="true";img.src=p.fallback_image;return}if(token!==epoch)return;bad.add(p.id);displayedAt=0;showRound()});
 button.addEventListener("click",()=>choose(index));img.src=p.image;return {button,img};
}
async function showRound(){
 round=history.length;
 if(round===8)return finish();
 currentPair=nextPair();if(currentPair.length!==2){document.getElementById("question").textContent="利用可能な作品が不足しています。ページを再読み込みしてください。";return;}const token=++epoch;
 $$("fill").style.width=`${round/8*100}%`;
 $$("question").textContent=`${round+1} / 8   どちらが好き？`;
 const root=$$("paintings");root.replaceChildren();
 const nodes=currentPair.map((p,i)=>choiceImage(p,i,token));
 nodes.forEach(({button})=>{button.disabled=true;root.append(button)});
 await Promise.all(nodes.map(({img})=>img.decode().catch(()=>{})));
 // Before the timer starts, make the pair visible in one frame. No history leaves the browser.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(token!==epoch)return;nodes.forEach(({button})=>{if(button.querySelector("img"))button.disabled=false});
   displayedAt=performance.now();
 }));
}
function choose(choice){
 if(!displayedAt||history.length>=8)return;
 const ms=Math.max(100,Math.round((performance.now()-displayedAt)/100)*100);
 const pair=currentPair.map(p=>p.id);
 history.push({pair,choice,ms});
 pair.forEach(x=>seen.add(x));
 displayedAt=0;showRound();
}
function escapeHtml(str){return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function finish(){
 $$("quiz").classList.add("hidden");$$("results").classList.remove("hidden");
 const u=preference(history,true);
 const candidates=CATALOG.filter(x=>!seen.has(x.id)).map(p=>({...p,score:dot(u,p.features)}));
 candidates.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const root=$$("recommendations");root.replaceChildren();
 candidates.slice(0,3).forEach((p,i)=>{
   const article=document.createElement("article");article.className="result";
   article.innerHTML=`<img alt="" src="${escapeHtml(p.image)}"><div><small>候補 ${i+1}</small><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.artist)}</p><small>相対スコア ${p.score.toFixed(2)}</small></div>`;
   root.append(article);
 });
 const names=["具象性","色彩の強さ","幾何学性","構図の密度","規則性","筆触・質感"];
 const dims=u.map((x,i)=>({x,i})).sort((a,b)=>Math.abs(b.x)-Math.abs(a.x));
 $$("explanation").textContent=`暫定的に「${names[dims[0].i]}」と「${names[dims[1].i]}」の選好を推定しました。これは未検証の試験特徴に基づく説明です。`;
 const left=history.filter(x=>x.choice===0).length;
 const extreme=(left===0||left===8);
 $$("audit").textContent=JSON.stringify({version:VERSION,questions:history,normalizedPreference:u,side:{left,right:8-left,biasCorrection:"none",note:extreme?"極端な左右選択を観測。ただし8問では原因を特定できない。":"個人の位置効果を確定する証拠なし"},recommended:candidates.slice(0,3).map(x=>x.id)},null,2);
}
$$("restart").addEventListener("click",()=>{history=[];seen=new Set();bad=new Set();currentPair=[];displayedAt=0;$$("results").classList.add("hidden");$$("quiz").classList.remove("hidden");showRound()});
if(CATALOG.length>=19)showRound();
