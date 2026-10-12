import HTML from "./index.html";
import CSS from "./style.css";
import APP from "./app.txt";

const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const asset=(content,type)=>new Response(content,{headers:{"content-type":type,"cache-control":"no-cache","x-content-type-options":"nosniff"}});

// Pin upstream sources; serve them from our own hostname so Chrome never has to contact a third-party CDN.
const vendors={
 "/vendor/xspreadsheet.css":{mime:"text/css; charset=utf-8",urls:[
  "https://cdn.jsdelivr.net/npm/x-data-spreadsheet@1.1.5/dist/xspreadsheet.css",
  "https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.css"
 ]},
 "/vendor/xspreadsheet.js":{mime:"application/javascript; charset=utf-8",urls:[
  "https://cdn.jsdelivr.net/npm/x-data-spreadsheet@1.1.5/dist/xspreadsheet.js",
  "https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.js"
 ]},
 "/vendor/xlsx.full.min.js":{mime:"application/javascript; charset=utf-8",urls:[
  "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"
 ]}
};
async function vendor(req,path){
 const spec=vendors[path];
 const cache=caches.default;
 const cached=await cache.match(req);
 if(cached)return cached;
 for(const url of spec.urls){
  try{
   const upstream=await fetch(url,{redirect:"follow"});
   if(!upstream.ok)continue;
   const content=await upstream.arrayBuffer();
   if(!content.byteLength)continue;
   const response=new Response(content,{status:200,headers:{
    "content-type":spec.mime,
    "cache-control":"public, max-age=86400",
    "x-content-type-options":"nosniff"
   }});
   await cache.put(req,response.clone());
   return response;
  }catch(e){console.error("vendor asset error:",path,String(e));}
 }
 return new Response("Library temporarily unavailable",{status:503,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}});
}

const cleanName=s=>String(s||"新しいブック").trim().slice(0,100)||"新しいブック";
const validId=id=>/^[a-f0-9-]{36}$/i.test(id||"");
async function ready(env){
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS workbooks (id TEXT PRIMARY KEY, name TEXT NOT NULL, payload TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
}
async function bodyJSON(req){
 const length=Number(req.headers.get("content-length")||0);
 if(length>1600000)throw new Error("ブックが大きすぎます（上限1.6MB）");
 const text=await req.text();if(text.length>1600000)throw new Error("ブックが大きすぎます（上限1.6MB）");
 try{return JSON.parse(text);}catch(_){throw new Error("JSONを読み取れません");}
}
const validData=data=>Array.isArray(data)&&data.length>0&&data.length<=30&&data.every(s=>s&&typeof s.name==="string"&&s.name.length<=100&&s.rows&&typeof s.rows==="object");
export default {
 async fetch(req,env){
  const url=new URL(req.url);
  if(req.method==="GET"){
   if(Object.prototype.hasOwnProperty.call(vendors,url.pathname))return vendor(req,url.pathname);
   if(url.pathname==="/")return asset(HTML,"text/html; charset=utf-8");
   if(url.pathname==="/style.css")return asset(CSS,"text/css; charset=utf-8");
   if(url.pathname==="/app.js")return asset(APP,"application/javascript; charset=utf-8");
   if(url.pathname==="/favicon.ico")return new Response(null,{status:204});
   if(url.pathname==="/healthz")return json({ok:true,service:"karin-excel"});
  }
  if(!url.pathname.startsWith("/api/"))return new Response("Not Found",{status:404});
  if(!env.DB)return json({error:"データベースが設定されていません"},503);
  try{
   await ready(env);
   if(url.pathname==="/api/books"&&req.method==="GET"){
    const r=await env.DB.prepare("SELECT id,name,version,updated_at FROM workbooks ORDER BY updated_at DESC LIMIT 150").all();
    return json({items:r.results||[]});
   }
   if(url.pathname==="/api/books"&&req.method==="POST"){
    const b=await bodyJSON(req);
    if(!validData(b.data))return json({error:"シート形式が正しくありません"},400);
    const count=await env.DB.prepare("SELECT COUNT(*) AS n FROM workbooks").first();
    if(Number(count?.n||0)>=150)return json({error:"ブック数の上限（150）に達しました"},400);
    const id=crypto.randomUUID(),name=cleanName(b.name),stamp=new Date().toISOString();
    await env.DB.prepare("INSERT INTO workbooks(id,name,payload,version,updated_at) VALUES(?,?,?,?,?)").bind(id,name,JSON.stringify(b.data),1,stamp).run();
    return json({id,name,version:1,updated_at:stamp},201);
   }
   const match=/^\/api\/books\/([0-9a-f-]+)$/i.exec(url.pathname);
   if(!match||!validId(match[1]))return json({error:"存在しないAPIです"},404);
   const id=match[1];
   if(req.method==="GET"){
    const r=await env.DB.prepare("SELECT id,name,payload,version,updated_at FROM workbooks WHERE id=?").bind(id).first();
    if(!r)return json({error:"ブックが見つかりません"},404);
    return json({id:r.id,name:r.name,data:JSON.parse(r.payload),version:r.version,updated_at:r.updated_at});
   }
   if(req.method==="PUT"){
    const b=await bodyJSON(req),version=Number(b.version);
    if(!Number.isInteger(version)||version<1||!validData(b.data))return json({error:"保存形式が正しくありません"},400);
    const stamp=new Date().toISOString();
    const r=await env.DB.prepare("UPDATE workbooks SET name=?,payload=?,version=version+1,updated_at=? WHERE id=? AND version=?").bind(cleanName(b.name),JSON.stringify(b.data),stamp,id,version).run();
    if((r.meta?.changes||0)<1)return json({error:"別端末による更新または削除を検出しました。上書きしません。"},409);
    return json({id,version:version+1,updated_at:stamp});
   }
   if(req.method==="DELETE"){
    const r=await env.DB.prepare("DELETE FROM workbooks WHERE id=?").bind(id).run();
    if((r.meta?.changes||0)<1)return json({error:"ブックが見つかりません"},404);
    return json({deleted:true});
   }
   return json({error:"許可されていない操作です"},405);
  }catch(e){
   if(/JSONを読み取れません|大きすぎます/.test(String(e.message)))return json({error:e.message},400);
   console.error("karin-excel API error:",e?.message);
   return json({error:"サーバー処理に失敗しました"},500);
  }
 }
};
