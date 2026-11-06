// Preview release gateway: immutable repository snapshot, not a GitHub branch tip.
// Cloudflare Worker mirrors static files from the pinned GitHub commit.
// Replace this gateway with Workers Static Assets when 1,024 R2 images are ready.
const SOURCE_COMMIT="49d72105fb"; // pinned prefix of full GitHub commit, immutable
const BASE="https://raw.githubusercontent.com/Karin-Laboratory/Cloudflare-Workers/"+SOURCE_COMMIT+"/art-preference/";
const PATHS=new Map([["/","index.html"],["/index.html","index.html"],["/app.js","app.js"],["/data/preview-artworks.json","data/preview-artworks.json"]]);
addEventListener("fetch",event=>event.respondWith(handle(event.request)));
async function handle(request){
 if(request.method!=="GET"&&request.method!=="HEAD")return new Response("Method not allowed",{status:405});
 const path=new URL(request.url).pathname;
 if(path==="/health")return new Response(JSON.stringify({ok:true,version:"preview-v0.1",commit:SOURCE_COMMIT}),{headers:{"content-type":"application/json","cache-control":"no-store"}});
 const target=PATHS.get(path);if(!target)return new Response("Not found",{status:404});
 const upstream=await fetch(BASE+target,{cf:{cacheTtl:600,cacheEverything:true}});
 if(!upstream.ok)return new Response("Preview source unavailable",{status:502,headers:{"cache-control":"no-store"}});
 const mime=target.endsWith(".html")?"text/html; charset=utf-8":target.endsWith(".js")?"text/javascript; charset=utf-8":"application/json; charset=utf-8";
 const headers=new Headers({"content-type":mime,"cache-control":"public, max-age=600","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-model-version":"preview-v0.1"});
 return new Response(request.method==="HEAD"?null:upstream.body,{headers,status:200});
}
