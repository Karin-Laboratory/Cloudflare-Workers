// Frozen preview builder. Downloads real, individually verified public-domain paintings.
// The site has no runtime dependency on museum APIs. Preview features are provisional.
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const images=path.join(root,"images");
await mkdir(images,{recursive:true});
const artists=["Monet","Van Gogh","Renoir","Cezanne","Seurat","Cassatt","Pissarro","Morisot","Manet","Gauguin","Whistler","Turner","Hopper","Klimt","Degas","Sargent","Seurat","Matisse","Rembrandt","Botticelli"];
const records=[],ids=new Set(),features=[/people|person|woman|man|portrait|figure/,/bright|red|blue|yellow|colorful/,/architecture|house|building|line/,/group|crowd|market|many/,/pattern|repeat|geometric/,/brush|texture|paint/];
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(url,attempts=3){
 for(let i=0;i<attempts;i++){try{const r=await fetch(url,{signal:AbortSignal.timeout(22000),headers:{"User-Agent":"Karin-Lab/1.0 Art Research (https://github.com/Karin-Laboratory/Cloudflare-Workers)"}});if(r.ok)return r;if(r.status===429||r.status>=500){await wait(1500*(i+1));continue;}return null}catch(e){if(i===attempts-1)console.warn("FETCH FAILED",url,e.message);await wait(1000*(i+1))}}
 return null;
}
async function addChicago(p){
 if(records.length>=36||!p||ids.has("aic-"+p.id)||p.is_public_domain!==true||!p.image_id||!/painting/i.test((p.artwork_type_title||"")+" "+(p.classification_title||"")))return;
 const id="aic-"+p.id,filename=id+".jpg";
 const url="https://www.artic.edu/iiif/2/"+p.image_id+"/full/700,/0/default.jpg";
 const image=await get(url,2);if(!image)return;
 const bytes=Buffer.from(await image.arrayBuffer());if(bytes.length<1500||bytes[0]!==255||bytes[1]!==216)return;
 await writeFile(path.join(images,filename),bytes);
 const alt=(p.thumbnail?.alt_text||"").toLowerCase();
 records.push({id,title:p.title||"Untitled",artist:p.artist_title||"Unknown",image:"./images/"+filename,features:features.map((re,i)=>re.test(alt)?0.8:0.2+((p.id+i*13)%9)*0.06),source_url:"https://www.artic.edu/artworks/"+p.id,image_license:"CC0 / public domain (AIC metadata)",source_object_id:p.id});
 ids.add(id);console.log("OK",id,bytes.length,p.title);
}
for(const artist of artists){
 if(records.length>=36)break;
 const url=new URL("https://api.artic.edu/api/v1/artworks/search");
 url.searchParams.set("q",artist);url.searchParams.set("limit","80");
 url.searchParams.set("fields","id,title,artist_title,image_id,is_public_domain,artwork_type_title,classification_title,thumbnail");
 const response=await get(url.toString());if(!response)continue;
 const json=await response.json();
 const candidates=(json.data||[]).filter(x=>x.is_public_domain&&x.image_id&&/painting/i.test((x.artwork_type_title||"")+" "+(x.classification_title||"")));
 for(const p of candidates.slice(0,5))await addChicago(p);
}
if(records.length<24){
 // AIC public-domain bulk query fallback. Widens the initial selection without weakening rights checks.
 for(let page=1;page<=30&&records.length<36;page++){
  const url=new URL("https://api.artic.edu/api/v1/artworks/search");
  url.searchParams.set("query[term][is_public_domain]","true");
  url.searchParams.set("limit","100");url.searchParams.set("page",String(page));
  url.searchParams.set("fields","id,title,artist_title,image_id,is_public_domain,artwork_type_title,classification_title,thumbnail");
  const r=await get(url.toString(),2);if(!r)continue;
  const j=await r.json();
  for(const p of (j.data||[]))if(records.length<36)await addChicago(p);
 }
}
if(records.length<19)throw Error("Only "+records.length+" verified paintings; refusing empty site release");
const catalog={status:"FROZEN_VERIFIED_IMAGE_PREVIEW",source:"Art Institute of Chicago",verified_image_count:records.length,model_notice:"Feature vectors and suitability are provisional and not scientifically validated; 1,024-work selection pending.",artworks:records};
await writeFile(path.join(root,"data","preview-artworks.json"),JSON.stringify(catalog,null,2)+"\n");
console.log("SUCCESS: STATIC_IMAGE_CATALOG",records.length);
