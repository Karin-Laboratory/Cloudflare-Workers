// One-shot, restartable AIC CC0 painting acquisition.
// No browser or runtime museum dependency; only scheduled events write R2.
// Source policy: https://api.artic.edu/docs/ (<=1 source request/second).
const PREFIX="art-preference/cma-v1";
const STATE=PREFIX+"/build-state.json";
const TARGET=1024;
const BATCH=22;
const EXPIRES=Date.parse("2026-11-08T00:00:00Z");
const delay=(ms)=>new Promise(r=>setTimeout(r,ms));
const hex=(bytes)=>[...bytes].map(x=>x.toString(16).padStart(2,"0")).join("");
const writeJSON=(env,k,obj)=>env.ART_IMAGES.put(k,JSON.stringify(obj),{httpMetadata:{contentType:"application/json"}});
async function readState(env){
 const f=await env.ART_IMAGES.get(STATE);
 if(f){try{return await f.json()}catch{}}
 return {version:"cma-cc0-v1",target:TARGET,source:"Cleveland Museum of Art Open Access",source_policy:"share_license_status CC0 AND type Painting AND images.web.url",startedAt:new Date().toISOString(),updatedAt:null,page:1,queue:[],artworks:[],failed:[],skipped:0,status:"IN_PROGRESS",lastError:null};
}
async function request(url){
 const r=await fetch(url,{headers:{"Accept":"application/json,image/jpeg","User-Agent":"Karin-Laboratory Art-Preference research (https://github.com/Karin-Laboratory/Cloudflare-Workers)"},signal:AbortSignal.timeout(23000)});
 if(!r.ok)throw Error("HTTP "+r.status+" "+new URL(url).pathname);
 return r;
}
async function loadPage(s){
 const url=new URL("https://openaccess-api.clevelandart.org/api/artworks/");
 url.searchParams.set("cc0","");
 url.searchParams.set("has_image","1");
 url.searchParams.set("type","Painting");
 url.searchParams.set("limit","100");
 // Pages 1-4 were imported before this policy change. Traverse all later pages
 // in a fixed permutation instead of accession order, to reduce period skew.
 const sourcePage=s.page<5?s.page:5+(((s.page-5)*17+5)%36);
 url.searchParams.set("skip",String((sourcePage-1)*100));
 const data=await (await request(url.toString())).json();
 s.page++;
 if(!Array.isArray(data.data)||!data.data.length){s.status="STOPPED_SOURCE_EXHAUSTED";return}
 const existing=new Set(s.artworks.map(a=>a.id));
 const waiting=new Set(s.queue.map(a=>a.id));
 for(const p of data.data){
  const id="cma-"+p.id;
  if(existing.has(id)||waiting.has(id))continue;
  if(p.share_license_status!=="CC0"||!p.images?.web?.url||!/painting/i.test(p.type||p.classification_type||"Painting")){s.skipped++;continue}
  s.queue.push({id,source_id:p.id,title:p.title||"Untitled",artist:(p.creators||[]).map(x=>x.description||x.name||"").filter(Boolean).join("; ")||"Unknown",date:p.creation_date||"",image_url:p.images.web.url,is_highlight:!!p.is_highlight,alt_text:p.description||p.tombstone||"",source_record_url:p.url||""});
 }
}
async function acquire(env,s,p){
 const response=await request(p.image_url);
 const bytes=new Uint8Array(await response.arrayBuffer());
 if(bytes.length<2000||bytes.length>8000000||bytes[0]!==0xff||bytes[1]!==0xd8)throw Error("invalid JPEG bytes");
 const digest=hex(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)));
 const key=PREFIX+"/images/"+p.id+".jpg";
 await env.ART_IMAGES.put(key,bytes,{httpMetadata:{contentType:"image/jpeg",cacheControl:"public,max-age=31536000,immutable"},customMetadata:{source:"Cleveland Museum of Art",sourceId:String(p.source_id),sha256:digest}});
 const {image_url,alt_text,...metadata}=p;
 return {...metadata,image_key:key,image_sha256:digest,image_bytes:bytes.length,source_url:p.source_record_url||"https://www.clevelandart.org/art/"+p.source_id,api_url:"https://openaccess-api.clevelandart.org/api/artworks/"+p.source_id,license:"CC0",share_license_status:"CC0",description:alt_text};
}
async function run(env){
 if(Date.now()>EXPIRES)return;
 const s=await readState(env);
 if(s.status!=="IN_PROGRESS")return;
 let done=0,sourceCalls=0;
 try {
  while(done<BATCH&&s.artworks.length<TARGET){
   if(!s.queue.length){
    if(s.page>40){s.status="STOPPED_PAGE_LIMIT";break}
    await loadPage(s);sourceCalls++;await delay(1100);
    if(s.status!=="IN_PROGRESS")break;
    if(!s.queue.length)continue;
   }
   const p=s.queue.shift();
   try {
    const item=await acquire(env,s,p);
    s.artworks.push(item);
   }catch(e){
    if(s.failed.length<120)s.failed.push({id:p.id,reason:String(e).slice(0,180)});
   }
   done++;sourceCalls++;
   await delay(1100);
  }
  if(s.artworks.length===0&&s.failed.length>=40){s.status="STOPPED_ALL_IMAGES_FAILED";s.lastError="No JPEG successfully imported in 40 attempts";}
  if(s.artworks.length>=TARGET){
   const fixed=s.artworks.slice(0,TARGET);
   const catalog={version:"cma-cc0-v1",status:"FROZEN_METADATA_AND_IMAGES",selection_notice:"CMA CC0 paintings selected from accession pages using fixed page permutation; NOT verified global popularity top 1024",source:"Cleveland Museum of Art",count:fixed.length,artworks:fixed};
   await writeJSON(env,PREFIX+"/catalog.json",catalog);
   s.status="IMAGES_COMPLETE_FEATURES_PENDING";
   s.queue=[];
  }
 }catch(e){s.lastError=String(e).slice(0,300)}
 s.updatedAt=new Date().toISOString();
 await writeJSON(env,STATE,s);
 return s;
}
async function synchronizeFeatures(env){
 const present=await env.ART_IMAGES.head(PREFIX+"/features.json");
 if(present)return true;
 const saved=await env.ART_IMAGES.get(PREFIX+"/catalog.json");
 if(!saved)return false;
 const catalog=await saved.json();
 if(catalog.count!==1024||catalog.artworks.length!==1024)return false;
 const endpoint="https://raw.githubusercontent.com/Karin-Laboratory/Cloudflare-Workers/feature/art-1024-r2-20261107/art-preference/data/features-v1.json";
 let response;try{response=await fetch(endpoint,{headers:{"cache-control":"no-cache"},signal:AbortSignal.timeout(20000)})}catch{return false}
 if(!response.ok)return false;
 const raw=await response.text();
 if(raw.length>3500000)return false;
 let values;try{values=JSON.parse(raw)}catch{return false}
 if(values.count!==1024||!Array.isArray(values.items)||values.items.length!==1024||values.status!=="FEATURES_FROZEN_UNVALIDATED_RECOMMENDATION"||!values.version?.startsWith("openclip-"))return false;
 const m=new Map(catalog.artworks.map(x=>[x.id,x.image_sha256]));
 if(m.size!==1024||values.items.some(x=>!m.has(x.id)||m.get(x.id)!==x.image_sha256||!Array.isArray(x.features)||x.features.length<4||!x.features.every(Number.isFinite)))return false;
 const digest=hex(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(raw))));
 await env.ART_IMAGES.put(PREFIX+"/features.json",raw,{httpMetadata:{contentType:"application/json"},customMetadata:{sha256:digest,githubBranch:"feature/art-1024-r2-20261107"}});
 await writeJSON(env,PREFIX+"/ready.json",{ready:true,status:"FEATURES_FROZEN",count:1024,model:values.version,feature_sha256:digest,source_catalog:catalog.version,at:new Date().toISOString(),model_accuracy:"NOT_VALIDATED"});
 return true;
}

export default {
 async fetch(){return new Response("Not found",{status:404})},
 async scheduled(_event,env,ctx){ctx.waitUntil(run(env))},
 async queue(batch,env){
  for(const msg of batch.messages){
   try{
    if(msg.body?.job==="sync-features"){
     const ok=await synchronizeFeatures(env);
     if(!ok&&Date.now()<EXPIRES)await env.ART_QUEUE.send({job:"sync-features"},{delaySeconds:180});
     msg.ack();continue;
    }
    if(msg.body?.job==="probe"){msg.ack();continue}
    const state=await run(env);
    if(state?.status==="IN_PROGRESS"&&Date.now()<EXPIRES&&!state.lastError)await env.ART_QUEUE.send({job:"cma-1024",next:state.artworks.length},{delaySeconds:2});
    if(state?.status==="IMAGES_COMPLETE_FEATURES_PENDING")await env.ART_QUEUE.send({job:"sync-features"},{delaySeconds:180});
    msg.ack()
   }catch(error){msg.retry({delaySeconds:120})}
  }
 }
};