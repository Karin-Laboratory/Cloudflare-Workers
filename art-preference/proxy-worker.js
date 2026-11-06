// Static application code is pinned to an immutable Git commit. Preview catalog is temporary.
// Backup: backup/art-preference-preview-20261107
const SOURCE="6c851a0d30d3721b9fa3410df715fa3ee0d3c77a";
const BASE="https://raw.githubusercontent.com/Karin-Laboratory/Cloudflare-Workers/"+SOURCE+"/art-preference/";
const FILES={"/":"index.html","/index.html":"index.html","/app.js":"app.js"};
const ARTISTS=["Monet","Van Gogh","Renoir","Cezanne","Seurat","Pissarro","Morisot","Cassatt","Manet","Gauguin","Gustave Caillebotte","Whistler"];
const TOKENS=[/person|people|woman|man|figure/,/red|yellow|blue|color|bright/,/line|building|geometric|roof/,/crowd|many|busy|dense/,/pattern|repeat|rows/,/brushstroke|texture|thick/];
const painting=p=>p&&p.is_public_domain===true&&typeof p.image_id==="string"&&p.image_id.length>10&&/painting/i.test((p.artwork_type_title||"")+" "+(p.classification_title||""));
async function collect(){
  // No preflight download: an entire catalog must never fail due to one bad painting URL.
  // These queries only obtain metadata from AIC official open-access API.
  const queries=await Promise.all(ARTISTS.map(async artist=>{
    const u=new URL("https://api.artic.edu/api/v1/artworks/search");
    u.searchParams.set("q",artist);
    u.searchParams.set("limit","50");
    u.searchParams.set("fields","id,title,artist_title,image_id,is_public_domain,artwork_type_title,classification_title,thumbnail");
    try {const r=await fetch(u.toString());if(!r.ok)return [];const j=await r.json();return (j.data||[]).filter(painting).slice(0,8)}
    catch{return []}
  }));
  // Broader official query if artist-specific searches are throttled or return too few paintings.
  if(queries.reduce((n,g)=>n+g.length,0)<25){
    for(let page=1;page<=3;page++){
      const u=new URL("https://api.artic.edu/api/v1/artworks/search");
      u.searchParams.set("query[term][is_public_domain]","true");
      u.searchParams.set("limit","100");
      u.searchParams.set("page",String(page));
      u.searchParams.set("fields","id,title,artist_title,image_id,is_public_domain,artwork_type_title,classification_title,thumbnail");
      try{const response=await fetch(u.toString());if(response.ok){const j=await response.json();queries.push((j.data||[]).filter(painting).slice(0,40));}}
      catch{}
    }
  }
  const all=[];const used=new Set();
  // Round-robin prevents one artist from filling the whole list.
  for(let i=0;i<40;i++)for(const g of queries){
    const p=g[i];if(!p||used.has(p.id))continue;used.add(p.id);all.push(p);
  }
  const artworks=all.slice(0,42).map(p=>{
    const txt=(p.thumbnail?.alt_text||"").toLowerCase();
    return {id:"aic-"+p.id,title:p.title,artist:p.artist_title||"Unknown",
      image:"/image/"+encodeURIComponent(p.image_id),
      fallback_image:"https://www.artic.edu/iiif/2/"+p.image_id+"/full/400,/0/default.jpg",
      features:TOKENS.map((re,i)=>re.test(txt)?0.8:0.3+((p.id+i*17)%5)*0.06),
      is_public_domain:true,source_url:"https://www.artic.edu/artworks/"+p.id};
  });
  if(artworks.length<19)throw new Error("insufficient_paintings:"+artworks.length+",group_counts="+queries.map(x=>x.length).join(","));
  return JSON.stringify({status:"AIC_METADATA_PREVIEW_V03",note:"Temporary live museum metadata. A frozen 1024-work dataset and audited model are pending.",artworks});
}
async function getCatalog(){
  const key=new Request("https://art.karin-lab.com/__cache/catalog-v03");
  const cached=await caches.default.match(key);if(cached)return cached;
  const data=await collect();const response=new Response(data,{headers:{"content-type":"application/json; charset=utf-8","cache-control":"public,max-age=1800","x-catalog-source":"art-institute-chicago"}});
  await caches.default.put(key,response.clone());return response;
}
async function handler(req){
  const url=new URL(req.url);
  if(req.method!=="GET"&&req.method!=="HEAD")return new Response("Method not allowed",{status:405});
  if(url.pathname==="/health")return Response.json({ok:true,version:"preview-v0.3",source:SOURCE});
  if(url.pathname==="/data/preview-artworks.json"){
    try {const r=await getCatalog();return req.method==="HEAD"?new Response(null,{headers:r.headers}):r}
    catch(e){return Response.json({error:"catalog_unavailable",message:String(e)},{status:503,headers:{"cache-control":"no-store"}})}
  }
  if(url.pathname.startsWith("/image/")){
    const id=url.pathname.slice(7);
    if(!/^[a-f0-9-]{32,40}$/i.test(id))return new Response("Invalid image id",{status:400});
    const target="https://www.artic.edu/iiif/2/"+id+"/full/843,/0/default.jpg";
    let response;
    try{response=await fetch(target,{cf:{cacheEverything:true,cacheTtl:86400}})}
    catch{return new Response("Image source error",{status:502})}
    if(!response.ok)return new Response("Artwork image unavailable",{status:response.status});
    return new Response(req.method==="HEAD"?null:response.body,{status:200,headers:{"content-type":response.headers.get("content-type")||"image/jpeg","cache-control":"public,max-age=86400","x-content-type-options":"nosniff"}});
  }
  const file=FILES[url.pathname];if(!file)return new Response("Not found",{status:404});
  const upstream=await fetch(BASE+file,{cf:{cacheEverything:true,cacheTtl:300}});
  if(!upstream.ok)return new Response("Source unavailable",{status:502});
  return new Response(req.method==="HEAD"?null:upstream.body,{status:200,headers:{"content-type":file.endsWith(".html")?"text/html; charset=utf-8":"text/javascript; charset=utf-8","cache-control":"public,max-age=300","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});
}
addEventListener("fetch",event=>event.respondWith(handler(event.request)));
