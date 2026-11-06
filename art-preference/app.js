// Static, deterministic demonstration model. NOT a validated preference diagnosis.
// Production must replace preview-artworks.json with a provenance-checked 1,024-painting manifest.
const VERSION="preview-v0.3";
const $$=id=>document.getElementById(id);
let CATALOG=[];
try {
  const response=await fetch("./data/preview-artworks.json",{cache:"no-store"});
  if(!response.ok)throw new Error("作品データ HTTP "+response.status);
  const json=await response.json();
  if(!Array.isArray(json.artworks)||json.artworks.length<19)throw new Error("作品数が不足しています");
  CATALOG=json.artworks;
} catch(error) {
  document.getElementById("question").textContent="作品一覧を読み込めませんでした。";
  const retry=document.createElement("button");retry.className="secondary";retry.textContent="再読み込み";
  retry.onclick=()=>location.reload();document.getElementById("paintings").append(retry);
  console.error("Catalog load failed",error);
}
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
