// One-shot, restartable AIC CC0 painting acquisition.
// No browser or runtime museum dependency; only scheduled events write R2.
// Source policy: https://api.artic.edu/docs/ (<=1 source request/second).
const PREFIX="art-preference/v1";
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
 return {version:"aic-cc0-v1",target:TARGET,source:"Art Institute of Chicago Open Access",source_policy:"is_public_domain true AND Painting AND nonempty image_id",startedAt:new Date().toISOString(),updatedAt:null,page:1,queue:[],artworks:[],failed:[],skipped:0,status:"IN_PROGRESS",lastError:null};
}
async function request(url){
 const r=await fetch(url,{headers:{"Accept":"application/json,image/jpeg","User-Agent":"Karin-Laboratory Art-Preference research (https://github.com/Karin-Laboratory/Cloudflare-Workers)"},signal:AbortSignal.timeout(23000)});
 if(!r.ok)throw Error("HTTP "+r.status+" "+new URL(url).pathname);
 return r;
}
async function loadPage(s){
 const url=new URL("https://api.artic.edu/api/v1/artworks/search");
 url.searchParams.set("query[term][is_public_domain]","true");
 url.searchParams.set("limit","100");
 url.searchParams.set("page",String(s.page));
 url.searchParams.set("fields","id,title,artist_title,date_display,image_id,is_public_domain,artwork_type_title,classification_title,thumbnail,is_boosted");
 const data=await (await request(url.toString())).json();
 s.page++;
 if(!Array.isArray(data.data)||!data.data.length){s.status="STOPPED_SOURCE_EXHAUSTED";return}
 const existing=new Set(s.artworks.map(a=>a.id));
 const waiting=new Set(s.queue.map(a=>a.id));
 for(const p of data.data){
  const id="aic-"+p.id;
  if(existing.has(id)||waiting.has(id))continue;
  if(p.is_public_domain!==true||!p.image_id||!/painting/i.test((p.artwork_type_title||"")+" "+(p.classification_title||""))){s.skipped++;continue}
  s.queue.push({id,source_id:p.id,title:p.title||"Untitled",artist:p.artist_title||"Unknown",date:p.date_display||"",image_id:p.image_id,is_boosted:Boolean(p.is_boosted),alt_text:p.thumbnail?.alt_text||""});
 }
}
async function acquire(env,s,p){
 const imageUrl="https://www.artic.edu/iiif/2/"+encodeURIComponent(p.image_id)+"/full/843,/0/default.jpg";
 const response=await request(imageUrl);
 const bytes=new Uint8Array(await response.arrayBuffer());
 if(bytes.length<2000||bytes.length>8000000||bytes[0]!==0xff||bytes[1]!==0xd8)throw Error("invalid JPEG bytes");
 const digest=hex(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)));
 const key=PREFIX+"/images/"+p.id+".jpg";
 await env.ART_IMAGES.put(key,bytes,{httpMetadata:{contentType:"image/jpeg",cacheControl:"public,max-age=31536000,immutable"},customMetadata:{source:"Art Institute of Chicago",sourceId:String(p.source_id),sha256:digest}});
 const {image_id,alt_text,...metadata}=p;
 return {...metadata,image_key:key,image_sha256:digest,image_bytes:bytes.length,source_url:"https://www.artic.edu/artworks/"+p.source_id,api_url:"https://api.artic.edu/api/v1/artworks/"+p.source_id,license:"CC0",is_public_domain:true,description:alt_text};
}
async function run(env){
 if(Date.now()>EXPIRES)return;
 const s=await readState(env);
 if(s.status!=="IN_PROGRESS")return;
 let done=0,sourceCalls=0;
 try {
  while(done<BATCH&&s.artworks.length<TARGET){
   if(!s.queue.length){
    if(s.page>350){s.status="STOPPED_PAGE_LIMIT";break}
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
  if(s.artworks.length>=TARGET){
   const fixed=s.artworks.slice(0,TARGET);
   const catalog={version:"aic-cc0-v1",status:"FROZEN_METADATA_AND_IMAGES",selection_notice:"AIC public-domain paintings in API retrieval order; NOT verified global popularity top 1024",source:"Art Institute of Chicago",count:fixed.length,artworks:fixed};
   await writeJSON(env,PREFIX+"/catalog.json",catalog);
   s.status="IMAGES_COMPLETE_FEATURES_PENDING";
   s.queue=[];
  }
 }catch(e){s.lastError=String(e).slice(0,300)}
 s.updatedAt=new Date().toISOString();
 await writeJSON(env,STATE,s);
 return s;
}
export default {
 async fetch(){return new Response("Not found",{status:404})},
 async scheduled(_event,env,ctx){ctx.waitUntil(run(env))},
 async queue(batch,env){for(const msg of batch.messages){try{const s=await run(env);if(s?.status==='IN_PROGRESS'&&Date.now()<EXPIRES){await env.ART_QUEUE.send({job:'aic-1024',next:s.artworks.length},{delaySeconds:2})}msg.ack()}catch(error){msg.retry({delaySeconds:120})}}}
};