import {createHash} from "node:crypto";
import {gzipSync} from "node:zlib";
import {mkdir,rm,writeFile} from "node:fs/promises";
import {resolve,dirname,sep} from "node:path";
import {unzipSync} from "fflate";

const version="0.5.0";
const expected="fbd9dbc48694676812c7bbca7f5f2e776cbc52c37d8f425a2dc033b5d23ce606";
const url="https://github.com/storytold/gridcraft/releases/download/v"+version+"/gridcraft-web-"+version+".zip";
const prefix="gridcraft-web-"+version+"/";
const dest=resolve("public");
const resp=await fetch(url,{headers:{"User-Agent":"Karin-GridCraft-Cloudflare-Build"},signal:AbortSignal.timeout(120000)});
if(!resp.ok)throw new Error("GridCraft download HTTP "+resp.status);
const zip=new Uint8Array(await resp.arrayBuffer());
if(zip.byteLength>40000000)throw new Error("Unexpected release archive size");
const digest=createHash("sha256").update(zip).digest("hex");
if(digest!==expected)throw new Error("GridCraft SHA256 mismatch: "+digest);
const entries=unzipSync(zip);
await rm(dest,{recursive:true,force:true});
await mkdir(dest,{recursive:true});
const manifest=[];
for(const [name,original] of Object.entries(entries)){
  if(!name.startsWith(prefix)||name.endsWith("/"))continue;
  const rel=name.slice(prefix.length);
  if(!rel||rel.startsWith("/")||rel.includes("\\")||rel.split("/").some(x=>x==="."||x===".."))throw new Error("Unsafe zip entry "+name);
  if(rel.startsWith(".")||["_headers","HOSTING.md","NOTICE","LICENSE-MIT","LICENSE-APACHE","ATTRIBUTION.md"].includes(rel))continue;
  const wasm=rel.endsWith(".wasm");
  const filename=wasm?rel+".gz":rel;
  const bytes=wasm?gzipSync(original,{level:9}):original;
  if(bytes.byteLength>24000000)throw new Error("Too large for Cloudflare static assets: "+filename);
  const target=resolve(dest,filename);
  if(!target.startsWith(dest+sep))throw new Error("Unsafe path "+filename);
  await mkdir(dirname(target),{recursive:true});
  await writeFile(target,bytes);
  manifest.push({name:filename,bytes:bytes.byteLength});
}
if(!manifest.some(x=>x.name==="index.html")||
   !manifest.some(x=>/^gridcraft-web-.*\.js$/.test(x.name))||
   !manifest.some(x=>/^gridcraft-web-.*\.wasm\.gz$/.test(x.name))){
  throw new Error("Incomplete GridCraft web release "+JSON.stringify(manifest));
}
console.log("SHA256-verified GridCraft",version,JSON.stringify(manifest));
