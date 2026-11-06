// Backup ref: backup/art-preference-preview-20261107 (immutable recovery point).
// Temporary museum-verified preview gateway; final dataset is a frozen R2+GitHub manifest.
const SOURCE="49d72105fb9c3cea50f9373ab1faa922fd4fed7a";
const BASE="https://raw.githubusercontent.com/Karin-Laboratory/Cloudflare-Workers/"+SOURCE+"/art-preference/";
const FILES={"/":"index.html","/index.html":"index.html","/app.js":"app.js"};
const ARTISTS=["Monet","Van Gogh","Renoir","Cezanne","Seurat","Pissarro","Morisot","Cassatt","Manet","Gauguin"];
const TOKENS=[/person|people|woman|man|figure/,/red|yellow|blue|color|bright/,/line|building|geometric|roof/,/crowd|many|busy|dense/,/pattern|repeat|rows/,/brushstroke|texture|thick/];
async function collect(){
 const groups=await Promise.all(ARTISTS.map(async q=>{
  const u=new URL("https://api.artic.edu/api/v1/artworks/search");u.searchParams.set("q",q);u.searchParams.set("limit","40");u.searchParams.set("fields","id,title,artist_title,image_id,is_public_domain,artwork_type_title,classification_title,thumbnail");
  const r=await fetch(u.toString());if(!r.ok)return[];const json=await r.json();
  return (json.data||[]).filter(p=>p.is_public_domain===true&&p.image_id&&/painting/i.test((p.artwork_type_title||"")+" "+(p.classification_title||""))).slice(0,5);
 }));
 const candidate=[];const used=new Set();
 for(const group of groups)for(const p of group)if(!used.has(p.id)){
  used.add(p.id);candidate.push(p);
 }
 const checked=await Promise.all(candidate.map(async p=>{
  const image="https://www.artic.edu/iiif/2/"+p.image_id+"/full/843,/0/default.jpg";
  try{const r=await fetch(image,{method:"GET"});if(!r.ok||!(r.headers.get("content-type")||"").startsWith("image/"))return null;await r.body?.cancel()}catch{return null}
  const txt=(p.thumbnail?.alt_text||"").toLowerCase();
  return{id:"aic-"+p.id,title:p.title,artist:p.artist_title||"Artist unknown",image,features:TOKENS.map((re,i)=>re.test(txt)?0.8:0.3+((p.id+i*17)%5)*0.06),is_public_domain:true,source_url:"https://www.artic.edu/artworks/"+p.id,image_checked:true};
 }));
 const artworks=checked.filter(Boolean).slice(0,32);
 if(artworks.length<19)throw new Error("Not enough public-domain paintings with verified images: "+artworks.length);
 return JSON.stringify({status:"MUSEUM_IMAGE_CHECKED_PREVIEW",note:"Temporary museum-verified live preview; production data and coefficients must be frozen and audited.",artworks});
}
async function serve(request){
 if(!["GET","HEAD"].includes(request.method))return new Response("Method not allowed",{status:405});
 const path=new URL(request.url).pathname;
 if(path==="/health")return Response.json({ok:true,version:"preview-museum-v0.2",source:SOURCE});
 if(path==="/data/preview-artworks.json"){
  const key=new Request("https://art.karin-lab.com/data/preview-artworks.json");
  let cached=await caches.default.match(key);
  if(!cached){
   try{
    const body=await collect();
    cached=new Response(body,{headers:{"content-type":"application/json; charset=utf-8","cache-control":"public,max-age=86400","x-catalog-source":"aic-api-image-verified"}});
    await caches.default.put(key,cached.clone());
   }catch(e){return Response.json({error:"catalog_unavailable",message:String(e)},{status:503})}
  }
  return request.method==="HEAD"?new Response(null,{headers:cached.headers}):cached;
 }
 const file=FILES[path];if(!file)return new Response("Not found",{status:404});
 const upstream=await fetch(BASE+file,{cf:{cacheTtl:600,cacheEverything:true}});
 if(!upstream.ok)return new Response("Source unavailable",{status:502});
 const type=file.endsWith(".html")?"text/html; charset=utf-8":"text/javascript; charset=utf-8";
 return new Response(request.method==="HEAD"?null:upstream.body,{headers:{"content-type":type,"cache-control":"public,max-age=600","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});
}
addEventListener("fetch",event=>event.respondWith(serve(event.request)));
