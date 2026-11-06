import{MODEL_VERSION,validateCatalog,nextPair,auditResult}from"./recommender-v1.mjs";
const $=id=>document.getElementById(id),names=[["4","すごい好き！"],["3","確かに好き"],["2","まあまあ"],["1","好きじゃない"],["0","なんでこれ？"]];
let artworks=[],history=[],ratings=new Map(),seenAt=new Map(),shownAt=0,visiblePaused=0,hiddenAt=null,version=0,active=false,result=null,started=performance.now(),finalized=false;
const sessionId=crypto.randomUUID(),pending=new Map(),storageKey="art-pending-v1";
try{for(const e of JSON.parse(localStorage.getItem(storageKey)||"[]"))pending.set(e.eventId,e)}catch{}
function flush(){for(const [id,e]of pending)fetch("/api/events",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(e),keepalive:true}).then(r=>{if(r.ok){pending.delete(id);save()}}).catch(()=>{})}
function save(){try{localStorage.setItem(storageKey,JSON.stringify([...pending.values()].slice(-150)))}catch{}}
function emit(type,body={},beacon=false){const e={type,sessionId,eventId:crypto.randomUUID(),model:MODEL_VERSION,at:new Date().toISOString(),elapsedMs:Math.round(performance.now()-started),...body};pending.set(e.eventId,e);save();if(beacon&&navigator.sendBeacon)try{navigator.sendBeacon("/api/events",new Blob([JSON.stringify(e)],{type:"application/json"}))}catch{}flush()}
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const url=p=>"/img/"+encodeURIComponent(p.id)+".jpg";
async function get(url){const r=await fetch(url,{cache:"no-cache"});if(!r.ok)throw Error(url+" HTTP "+r.status);return r.json()}
function fail(text){active=false;$("quiz").classList.add("hidden");$("results").classList.add("hidden");const s=$("status");s.classList.remove("hidden");s.classList.add("error");s.textContent=text+" ";let b=document.createElement("button");b.textContent="再試行";b.className="secondary";b.onclick=()=>location.reload();s.append(b)}
async function begin(){
 try{flush();const [catalog,features]=await Promise.all([get("/api/catalog"),get("/api/features")]);
 if(catalog.count!==1024||catalog.status!=="FROZEN_METADATA_AND_IMAGES"||features.count!==1024||!String(features.status).startsWith("FEATURES_FROZEN"))throw Error("固定データが未完成");
 const byFeature=new Map(features.items.map(a=>[a.id,a.features]));
 artworks=catalog.artworks.map(a=>({...a,features:byFeature.get(a.id)}));
 validateCatalog(artworks);if(artworks.some(a=>a.license!=="CC0"||!a.image_sha256))throw Error("画像の権利・ハッシュが不足");
 $("status").classList.add("hidden");$("quiz").classList.remove("hidden");started=performance.now();round();
 }catch(e){fail("絵画データの準備ができていません: "+String(e.message||e))}
}
async function round(){
 if(history.length===8){finish();return}
 const token=++version;active=false;shownAt=0;visiblePaused=0;hiddenAt=null;
 const pair=nextPair(artworks,history);if(pair.length!==2){fail("絵画を選べませんでした");return}
 $("question").textContent=(history.length+1)+" / 8　どちらが好き？";$("fill").style.width=(history.length*12.5)+"%";
 const buttons=pair.map((a,side)=>{const b=document.createElement("button");b.type="button";b.className="art";b.disabled=true;b.setAttribute("aria-label","作品"+(side?"B":"A")+"を選ぶ");const img=new Image();img.alt="絵画"+(side?"B":"A");img.loading="eager";img.decoding="async";img.src=url(a);b.append(img);b.onclick=()=>{
 if(!active||token!==version)return;active=false;const now=performance.now();const hidden=visiblePaused+(hiddenAt===null?0:now-hiddenAt);const ms=Math.max(100,Math.round((now-shownAt-hidden)/100)*100);history.push({pair:pair.map(x=>x.id),choice:side,ms});round()};
 return{b,img}});
 $("paintings").replaceChildren(...buttons.map(x=>x.b));
 try{await Promise.all(buttons.map(x=>x.img.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(token!==version)return;buttons.forEach(x=>x.b.disabled=false);shownAt=performance.now();active=true;if(document.hidden)hiddenAt=shownAt}
 catch(e){if(token===version)fail("絵画画像の読み込みに失敗: "+String(e))}
}
function rate(group,painting,rank){
 const grid=document.createElement("div");grid.className="rating";grid.setAttribute("role","group");grid.setAttribute("aria-label","推薦"+rank+"の評価");
 names.forEach(([v,label])=>{const b=document.createElement("button");b.type="button";b.dataset.score=v;b.setAttribute("aria-pressed","false");b.textContent=label;b.onclick=()=>{
 const now=performance.now(),prev=ratings.get(painting.id),newScore=Number(v);
 const val={score:newScore,firstMs:prev?.firstMs??Math.round(now-(seenAt.get(painting.id)||started)),revisions:(prev?.revisions||0)+(prev&&prev.score!==newScore?1:0)};
 ratings.set(painting.id,val);grid.querySelectorAll("button").forEach(x=>{x.classList.toggle("selected",x===b);x.setAttribute("aria-pressed",String(x===b))});
 emit("rating",{artworkId:painting.id,rank,oldScore:prev?.score??null,newScore,firstResponseMs:val.firstMs,revisionCount:val.revisions,clickMs:Math.round(now-(seenAt.get(painting.id)||started)),sameChoice:prev?.score===newScore});
 };grid.append(b)});group.append(grid)
}
function finish(){
 $("quiz").classList.add("hidden");$("results").classList.remove("hidden");$("fill").style.width="100%";
 result=auditResult(artworks,history,{timeCorrection:true,count:3});if(result.recommendations.length!==3){fail("おすすめ作品が不足");return}
 const root=$("recommendations");root.replaceChildren();
 result.recommendations.forEach((p,i)=>{const box=document.createElement("article");box.className="result";const img=new Image();img.alt=p.title+" / "+p.artist;img.src=url(p);img.addEventListener("load",()=>seenAt.set(p.id,performance.now()),{once:true});const meta=document.createElement("div");meta.innerHTML="<small>おすすめ "+(i+1)+"</small><h3>"+esc(p.title)+"</h3><p>"+esc(p.artist)+"</p><small>相対類似度 "+Number(p.score).toFixed(3)+" (検証前)</small><p><a href='"+esc(p.source_url)+"' target='_blank' rel='noopener noreferrer'>美術館の作品情報</a></p>";box.append(img,meta);rate(box,p,i+1);root.append(box)});
 $("explanation").textContent="選択した絵と選択しなかった絵の画像特徴の差分から、未提示作品を順位付けしました。決断時間は８回答内の相対的な差から暫定的に調整しています。左右の個人的な選択癖は８回答から確定できないため補正していません。推薦精度は未検証です。";
 $("audit").textContent=JSON.stringify({model:MODEL_VERSION,answers:history,recommended:result.recommendations.map(p=>({id:p.id,title:p.title,score:p.score,imageSha256:p.image_sha256})),timeCorrection:"experimental two-step",sideCorrection:"none"},null,2);
 emit("result-shown",{answers:history,recommendations:result.recommendations.map(x=>x.id)})
}
$("restart").onclick=()=>{emit("restart",{ratings:result?.recommendations.map(x=>({artworkId:x.id,score:ratings.get(x.id)?.score??null}))||[]});history=[];ratings.clear();seenAt.clear();result=null;finalized=false;$("results").classList.add("hidden");$("quiz").classList.remove("hidden");round()};
document.addEventListener("visibilitychange",()=>{if(active&&shownAt){if(document.hidden&&hiddenAt===null)hiddenAt=performance.now();if(!document.hidden&&hiddenAt!==null){visiblePaused+=performance.now()-hiddenAt;hiddenAt=null}}if(document.hidden&&result)emit("visibility-hidden",{ratings:result.recommendations.map(x=>({artworkId:x.id,score:ratings.get(x.id)?.score??null}))},true);if(!document.hidden)flush()});
window.addEventListener("pagehide",()=>{if(finalized||!result)return;finalized=true;emit("pagehide",{ratings:result.recommendations.map(x=>({artworkId:x.id,answered:ratings.has(x.id),score:ratings.get(x.id)?.score??null})),note:"pagehide observed; physical tab closure not guaranteed"},true)});
begin();