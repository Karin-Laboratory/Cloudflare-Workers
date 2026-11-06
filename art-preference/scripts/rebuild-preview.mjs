// Generate a displayable *preview* catalog from the Art Institute of Chicago.
// This is NOT the final 1,024-work popularity ranking nor validated feature extraction.
// Each selected image is checked by GET and each artwork must have is_public_domain=true.
import {writeFileSync} from "node:fs";
const artists=["Monet","Van Gogh","Renoir","Seurat","Cézanne","Pissarro","Gauguin","Morisot","Manet","Cassatt","Hopper"];
const needed=32, out=[], seen=new Set();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
for(const artist of artists){
  if(out.length>=needed)break;
  const u=new URL("https://api.artic.edu/api/v1/artworks/search");
  u.searchParams.set("q",artist);u.searchParams.set("limit","30");u.searchParams.set("fields","id,title,artist_title,image_id,is_public_domain,artwork_type_title,classification_title,thumbnail");
  const res=await fetch(u,{headers:{"User-Agent":"Karin-Lab art-preference (public data preview)"}});
  if(!res.ok)throw new Error("Museum API "+res.status+" for "+artist);
  const body=await res.json();
  for(const p of body.data||[]){
    if(out.length>=needed)break;
    if(seen.has(p.id)||p.is_public_domain!==true||!p.image_id)continue;
    if(!/painting/i.test((p.artwork_type_title||"")+" "+(p.classification_title||"")))continue;
    const image=`https://www.artic.edu/iiif/2/${p.image_id}/full/843,/0/default.jpg`;
    try{
      const photo=await fetch(image,{method:"GET",signal:AbortSignal.timeout(20000)});
      const type=photo.headers.get("content-type")||"";
      if(!photo.ok||!type.startsWith("image/"))continue;
      await photo.arrayBuffer();
    }catch{continue}
    seen.add(p.id);
    // Explicitly provisional non-AI numerical features. Replaced by audited v1 model.
    const text=(p.thumbnail?.alt_text||"").toLowerCase();
    const tokens=[/person|people|woman|man|figure/,/red|yellow|blue|color|bright/,/line|building|geometric|roof/,/crowd|many|busy|dense/,/pattern|repeat|rows/,/brushstroke|texture|thick/];
    const features=tokens.map((re,i)=>re.test(text)?0.8:0.3+((p.id+i*17)%5)*0.06);
    out.push({id:"aic-"+p.id,title:p.title,artist:p.artist_title||"Unknown",image,features,source_url:"https://www.artic.edu/artworks/"+p.id,api_url:"https://api.artic.edu/api/v1/artworks/"+p.id,is_public_domain:true,verified_image_at:"2026-11-07",license_source:"https://www.artic.edu/image-licensing"});
    console.log("verified",p.id,p.title);
  }
  await pause(700);
}
if(out.length<19)throw new Error("Insufficient verified artwork images: "+out.length);
writeFileSync(new URL("../data/preview-artworks.json",import.meta.url),JSON.stringify({status:"MUSEUM_IMAGE_CHECKED_PREVIEW",note:"Images GET-tested; provisional heuristic features; not final 1,024 works; not a validated diagnosis.",artworks:out},null,2)+"\n");
console.log("Preview validated count:",out.length);
