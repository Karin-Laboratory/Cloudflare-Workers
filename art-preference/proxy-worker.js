// Static offline-friendly painting fixture preview (v0.4).
// Source is a content-addressed Git commit, independent from runtime museum APIs.
const SOURCE="76d9d7e446d4a760a514fea8de313d9620678c1d";
const BASE="https://raw.githubusercontent.com/Karin-Laboratory/Cloudflare-Workers/"+SOURCE+"/art-preference/";
const MAP={"/":"index.html","/index.html":"index.html","/app.js":"app.js"};
async function handler(request) {
  if(request.method!=="GET"&&request.method!=="HEAD")return new Response("Method not allowed",{status:405});
  const path=new URL(request.url).pathname;
  if(path==="/health")return Response.json({ok:true,version:"preview-v0.4-offline-fixture",source:SOURCE,external_catalog:false});
  const filename=MAP[path];
  if(!filename)return new Response("Not found",{status:404});
  let result;try{result=await fetch(BASE+filename,{cf:{cacheEverything:true,cacheTtl:180}})}
  catch{return new Response("Static source temporarily unavailable",{status:502})}
  if(!result.ok)return new Response("Static asset unavailable",{status:502});
  return new Response(request.method==="HEAD"?null:result.body,{status:200,headers:{
    "content-type":filename.endsWith(".html")?"text/html; charset=utf-8":"text/javascript; charset=utf-8",
    "cache-control":"public,max-age=120","x-content-type-options":"nosniff",
    "referrer-policy":"no-referrer","x-art-preview":"v0.4-offline-fixture"}});
}
addEventListener("fetch",event=>event.respondWith(handler(event.request)));
