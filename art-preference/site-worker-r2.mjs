// Static preview stays available until a validated production dataset is released.
// Additional R2-backed routes expose frozen CC0 artwork images without museum API calls.
const COMMIT="76d9d7e446d4a760a514fea8de313d9620678c1d";
const RAW="https://raw.githubusercontent.com/Karin-Laboratory/Cloudflare-Workers/"+COMMIT+"/art-preference/";
const HTML={"/":"index.html","/index.html":"index.html","/app.js":"app.js"};
export default {
 async fetch(request,env){
  const method=request.method;
  if(method!=="GET"&&method!=="HEAD")return new Response("Method not allowed",{status:405});
  const path=new URL(request.url).pathname;
  if(path==="/health")return Response.json({ok:true,version:"preview-v0.4+r2-readonly",source:COMMIT});
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
  const filename=HTML[path];if(!filename)return new Response("Not found",{status:404});
  let upstream;try{upstream=await fetch(RAW+filename,{cf:{cacheEverything:true,cacheTtl:180}})}catch{return new Response("Static source unavailable",{status:502})}
  if(!upstream.ok)return new Response("Static source unavailable",{status:502});
  return new Response(method==="HEAD"?null:upstream.body,{status:200,headers:{"content-type":filename.endsWith(".html")?"text/html; charset=utf-8":"text/javascript; charset=utf-8","cache-control":"public,max-age=120","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});
 }
};