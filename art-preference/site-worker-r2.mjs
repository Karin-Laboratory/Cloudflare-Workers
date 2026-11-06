// Static preview stays available until a validated production dataset is released.
// Additional R2-backed routes expose frozen CC0 artwork images without museum API calls.
const COMMIT="76d9d7e446d4a760a514fea8de313d9620678c1d";
const PROD_COMMIT="0afc7247119a94538c94bc29085cf59e2040f279";
const GITHUB="https://raw.githubusercontent.com/Karin-Laboratory/Cloudflare-Workers/";
const PREVIEW={"/":"index.html","/index.html":"index.html","/app.js":"app.js"};
const PRODUCTION={"/":"index-v1.html","/index.html":"index-v1.html","/app.js":"app-v1.js","/app-v1.js":"app-v1.js","/recommender-v1.mjs":"recommender-v1.mjs"};
async function ready(env){return !!(await env.ART_IMAGES.head("art-preference/cma-v1/ready.json"))}
export default {
 async fetch(request,env){
  const method=request.method;
  if(method==="POST"&&new URL(request.url).pathname==="/api/events"){
   const size=Number(request.headers.get("content-length")||"0");
   if(size>14000)return new Response("Event too large",{status:413});
   let event;try{const body=await request.text();if(body.length>14000)throw 0;event=JSON.parse(body)}catch{return new Response("Invalid JSON",{status:400})}
   const types=new Set(["result-shown","rating","pagehide","visibility-hidden","restart"]);
   const uuid=/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i;
   if(!event||!types.has(event.type)||!uuid.test(event.sessionId||"")||!uuid.test(event.eventId||"")||typeof event.model!=="string"||event.model.length>90)return new Response("Invalid event",{status:400});
   const sanitized={...event,recordedAt:new Date().toISOString(),observation:"client-reported"};
   const key="art-preference/feedback/"+sanitized.recordedAt.slice(0,10)+"/"+event.eventId+".json";
   await env.ART_IMAGES.put(key,JSON.stringify(sanitized),{httpMetadata:{contentType:"application/json"}});
   return new Response(null,{status:204,headers:{"cache-control":"no-store"}});
  }
  if(method!=="GET"&&method!=="HEAD")return new Response("Method not allowed",{status:405});
  const path=new URL(request.url).pathname;
  if(path==="/health"){
   const complete=await ready(env);
   return Response.json({ok:true,version:complete?"art-v1-frozen":"preview-v0.4+r2-import",ready:complete,source:complete?PROD_COMMIT:COMMIT});
  }
  if(path==="/api/status"){
   const state=await env.ART_IMAGES.get("art-preference/cma-v1/build-state.json");
   let data;try{data=state?await state.json():null}catch{}
   return Response.json({dataset:"cma-cc0-v1",target:1024,images:data?.artworks?.length||0,failed:data?.failed?.length||0,status:data?.status||"NOT_STARTED",ready:await ready(env),lastError:data?.lastError||null},{headers:{"cache-control":"no-store"}});
  }
  if(path==="/api/features"){
   const object=await env.ART_IMAGES.get("art-preference/cma-v1/features.json");
   if(!object)return Response.json({ready:false,status:"FEATURE_EXTRACTION_PENDING"},{status:503,headers:{"cache-control":"no-store"}});
   return new Response(method==="HEAD"?null:object.body,{headers:{"content-type":"application/json; charset=utf-8","cache-control":"public,max-age=300"}});
  }
  if(path==="/api/catalog"){
   const object=await env.ART_IMAGES.get("art-preference/cma-v1/catalog.json");
   if(!object)return Response.json({status:"IMPORT_NOT_COMPLETE",ready:false},{status:503,headers:{"cache-control":"no-store"}});
   return new Response(method==="HEAD"?null:object.body,{headers:{"content-type":"application/json; charset=utf-8","cache-control":"public,max-age=300","access-control-allow-origin":"*"}});
  }
  if(path.startsWith("/img/")){
   const match=/^\/img\/(cma-[0-9]+)\.jpg$/.exec(path);
   if(!match)return new Response("Invalid artwork image key",{status:400});
   const key="art-preference/cma-v1/images/"+match[1]+".jpg";
   const object=await env.ART_IMAGES.get(key);
   if(!object)return new Response("Image not found",{status:404});
   return new Response(method==="HEAD"?null:object.body,{headers:{"content-type":"image/jpeg","cache-control":"public,max-age=31536000,immutable","x-content-type-options":"nosniff","access-control-allow-origin":"*"}});
  }
  const complete=await ready(env);
  const filename=(complete?PRODUCTION:PREVIEW)[path];if(!filename)return new Response("Not found",{status:404});
  let upstream;try{upstream=await fetch(GITHUB+(complete?PROD_COMMIT:COMMIT)+"/art-preference/"+filename,{cf:{cacheEverything:true,cacheTtl:180}})}catch{return new Response("Static source unavailable",{status:502})}
  if(!upstream.ok)return new Response("Static source unavailable",{status:502});
  return new Response(method==="HEAD"?null:upstream.body,{status:200,headers:{"content-type":filename.endsWith(".html")?"text/html; charset=utf-8":"text/javascript; charset=utf-8","cache-control":"public,max-age=120","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});
 }
};