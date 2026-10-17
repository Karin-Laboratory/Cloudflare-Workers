const CLIENT_JS_PLACEHOLDER="(function browserClient() {\n  const PREFIX='__karinCloudV1';\n  let revision=0, dirty=0, saved=0, saving=false, disabled=true, lastError='', initComplete=false;\n  const wait=(ms)=>new Promise(r=>setTimeout(r,ms));\n  const reqResult=(r)=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});\n  const txDone=(tx)=>new Promise((ok,no)=>{tx.oncomplete=()=>ok();tx.onerror=()=>no(tx.error);tx.onabort=()=>no(tx.error)});\n  async function available(){if(indexedDB.databases){const d=await indexedDB.databases();return d.some(x=>x.name==='neoma')}return true}\n  async function openExisting(){if(!(await available()))return null;return new Promise((ok,no)=>{let created=false;let r=indexedDB.open('neoma');r.onupgradeneeded=()=>{created=true;r.transaction.abort()};r.onsuccess=()=>{if(created){r.result.close();ok(null)}else ok(r.result)};r.onerror=()=>{if(created)ok(null);else no(r.error)}})}\n  async function b64(blob){const a=new Uint8Array(await blob.arrayBuffer());let chunks=[];for(let i=0;i<a.length;i+=12000)chunks.push(String.fromCharCode(...a.subarray(i,i+12000)));return btoa(chunks.join(''))}\n  function from64(s,type){let x=atob(s);let a=new Uint8Array(x.length);for(let i=0;i<x.length;i++)a[i]=x.charCodeAt(i);return new Blob([a],{type:type||''})}\n  async function serialize(v){if(v instanceof Blob)return {__karin_blob:await b64(v),mime:v.type};if(Array.isArray(v))return Promise.all(v.map(serialize));if(v&&typeof v==='object'){const r={};for(const [k,x] of Object.entries(v))r[k]=await serialize(x);return r}return v}\n  function revive(v){if(Array.isArray(v))return v.map(revive);if(v&&typeof v==='object'){if(typeof v.__karin_blob==='string')return from64(v.__karin_blob,v.mime);const r={};for(const [k,x] of Object.entries(v))r[k]=revive(x);return r}return v}\n  const stores=['vaults','files','folders','trash'];\n  async function snapshot(){\n    const db=await openExisting();const data={format:1,stores:{},prefs:{},timestamp:Date.now()};\n    if(db){try{for(const s of stores){if(!db.objectStoreNames.contains(s)){data.stores[s]=[];continue}let tx=db.transaction(s,'readonly');let all=await reqResult(tx.objectStore(s).getAll());data.stores[s]=await serialize(all)}}finally{db.close()}}\n    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&!k.startsWith(PREFIX))data.prefs[k]=localStorage.getItem(k)}\n    return data;\n  }\n  function openSchema(){return new Promise((ok,no)=>{const r=indexedDB.open('neoma',1);r.onupgradeneeded=()=>{const d=r.result;for(const [name,key,idx] of [['vaults','id',['lastOpenedAt']],['files',['vaultId','path'],['vaultId']],['folders',['vaultId','path'],['vaultId']],['trash','id',['vaultId','deletedAt']],['handles','vaultId',[]]]){if(d.objectStoreNames.contains(name))continue;const store=d.createObjectStore(name,{keyPath:key});for(const field of idx)store.createIndex(field,field)}};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}\n  async function restore(data){\n    if(!data||data.format!==1||!data.stores)throw Error('クラウドの保存形式が不明です');\n    if(await available()){await new Promise((ok,no)=>{const r=indexedDB.deleteDatabase('neoma');r.onsuccess=ok;r.onerror=()=>no(r.error);r.onblocked=()=>no(Error('別のNeomaタブを閉じてください'))})}\n    const db=await openSchema();\n    try{for(const s of stores){const rows=data.stores[s]||[];if(!rows.length)continue;const tx=db.transaction(s,'readwrite');const os=tx.objectStore(s);for(const row of rows)os.put(revive(row));await txDone(tx)}}finally{db.close()}\n    for(const k of Object.keys(localStorage)){if(!k.startsWith(PREFIX))localStorage.removeItem(k)}\n    for(const [k,v] of Object.entries(data.prefs||{}))localStorage.setItem(k,v);\n  }\n  function banner(message,actions=[]){\n    let el=document.getElementById('karin-cloud-banner');\n    if(!el){el=document.createElement('div');el.id='karin-cloud-banner';el.style.cssText='position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483647;max-width:95vw;background:#172a36;color:white;padding:10px 14px;border-radius:9px;box-shadow:0 4px 18px #0006;font:14px sans-serif';document.body.appendChild(el)}\n    el.replaceChildren(document.createTextNode(message+' '));for(const a of actions){const b=document.createElement('button');b.textContent=a[0];b.style.cssText='margin-left:9px;padding:4px 9px;cursor:pointer';b.onclick=a[1];el.appendChild(b)}return el;\n  }\n  function unbanner(){document.getElementById('karin-cloud-banner')?.remove()}\n  async function getMeta(){const r=await fetch('/__cloud/meta',{cache:'no-store'});if(!r.ok)throw Error('保存先に接続できません: '+r.status);return r.json()}\n  async function getState(){const r=await fetch('/__cloud/state',{cache:'no-store'});if(!r.ok)throw Error('クラウド取得失敗: '+r.status);return r.json()}\n  // Display wikilinks as clickable anchors by default; users may switch back to Edit.\n  function preferReadingView(){\n    const flag=PREFIX+'ReadingDefaultV1';\n    if(localStorage.getItem(flag)==='1')return false;\n    const key='neoma.settings';\n    let persisted;\n    try{persisted=JSON.parse(localStorage.getItem(key)||'{\"state\":{\"settings\":{}},\"version\":0}')}catch{return false}\n    if(!persisted||typeof persisted!=='object')return false;\n    if(!persisted.state||typeof persisted.state!=='object')persisted.state={};\n    if(!persisted.state.settings||typeof persisted.state.settings!=='object')persisted.state.settings={};\n    const prior=persisted.state.settings.defaultEditorMode;\n    localStorage.setItem(flag,'1');\n    if(prior&&prior!=='edit')return false;\n    persisted.state.settings.defaultEditorMode='reading';\n    localStorage.setItem(key,JSON.stringify(persisted));\n    return true;\n  }\n  function saveFile(){snapshot().then(data=>{const blob=new Blob([JSON.stringify(data)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='Karin-Lab-local-safety-copy.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)})}\n  function conflict(){disabled=true;banner('ほかの端末で更新されています。ローカル保存内容を退避してから再読み込みしてください。',[['ローカル退避',saveFile],['クラウドを再読込',()=>location.reload()]])}\n  let timer=0;\n  function mark(){if(disabled||!initComplete)return;dirty++;localStorage.setItem(PREFIX+'Pending','1');clearTimeout(timer);timer=setTimeout(()=>void sync(),1100)}\n  async function sync(){\n    if(disabled||saving||dirty===saved)return;\n    saving=true;const at=dirty;\n    try{\n      const state=await snapshot();const resp=await fetch('/__cloud/state',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json','If-Match':String(revision)},body:JSON.stringify(state),cache:'no-store'});\n      if(resp.status===409){conflict();return}\n      if(!resp.ok)throw Error('Cloud save HTTP '+resp.status);\n      const o=await resp.json();revision=o.revision;saved=at;lastError='';unbanner();\n      if(dirty===saved)localStorage.removeItem(PREFIX+'Pending');\n    }catch(e){lastError=String(e);banner('クラウド保存失敗: '+lastError,[['再試行',()=>{unbanner();void sync()}],['退避',saveFile]])}\n    finally{saving=false;if(!disabled&&dirty!==saved){clearTimeout(timer);timer=setTimeout(()=>void sync(),1500)}}\n  }\n  const originalTransaction=IDBDatabase.prototype.transaction;\n  IDBDatabase.prototype.transaction=function(...args){const tx=originalTransaction.apply(this,args);if(this.name==='neoma'&&args[1]==='readwrite'){tx.addEventListener('complete',mark)}return tx};\n  const originalSet=Storage.prototype.setItem;\n  Storage.prototype.setItem=function(k,v){const old=this.getItem(k);originalSet.call(this,k,v);if(this===localStorage&&!String(k).startsWith(PREFIX)&&old!==String(v))mark()};\n  const originalRemove=Storage.prototype.removeItem;\n  Storage.prototype.removeItem=function(k){const had=this.getItem(k)!==null;originalRemove.call(this,k);if(this===localStorage&&had&&!String(k).startsWith(PREFIX))mark()};\n  window.addEventListener('beforeunload',e=>{if(dirty!==saved&&!disabled){e.preventDefault();e.returnValue=''}})\n  async function init(){\n    try{\n      // Access login is already required; every cloud API call independently verifies the Access JWT.\n      const meta=await getMeta();\n      revision=meta.revision||0;\n      const pending=localStorage.getItem(PREFIX+'Pending');\n      if(revision>0){\n        if(pending){disabled=true;banner('前回の未同期編集があります。上書きせずに停止しました。',[['ローカル退避',saveFile],['クラウド版を使用',()=>{localStorage.removeItem(PREFIX+'Pending');location.reload()}]]);throw Error('未同期の編集あり')}\n        const data=await getState();await restore(data);localStorage.setItem(PREFIX+'Revision',String(revision));\n      }else{\n        // New cloud state: preserve and upload the browser vault, if any.\n        const data=await snapshot();\n        const hasData=(data.stores.vaults||[]).length>0||(data.stores.files||[]).length>0;\n        if(hasData){const r=await fetch('/__cloud/state',{method:'PUT',headers:{'Content-Type':'application/json','If-Match':'0'},body:JSON.stringify(data)});if(!r.ok)throw Error('初回保存に失敗しました: '+r.status);revision=(await r.json()).revision}\n      }\n      const viewPreferenceChanged=preferReadingView();\n      disabled=false;initComplete=true;dirty=viewPreferenceChanged?1:0;saved=0;\n      if(viewPreferenceChanged){localStorage.setItem(PREFIX+'Pending','1');setTimeout(()=>void sync(),300)}\n      navigator.serviceWorker?.getRegistrations?.().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});\n      setInterval(async()=>{if(disabled||saving)return;try{const m=await getMeta();if(m.revision!==revision){disabled=true;banner('別の端末でノートが更新されました。',[['ローカル退避',saveFile],['更新を読み込む',()=>location.reload()]])}}catch(e){banner('同期接続が不安定です。変更はこの端末に残ります。',[['再試行',()=>void sync()]])}},15000);\n      window.addEventListener('online',()=>void sync());\n      // App may have loaded persisted settings only after the initial restore.\n    }catch(e){if(!document.getElementById('karin-cloud-banner'))banner('クラウド保存の初期化に失敗: '+String(e),[['再読込',()=>location.reload()],['ローカル退避',saveFile]]);throw e}\n  }\n  window.__karinCloudReady=init();\n})();";
export default (function serverMain(){
 const AUD='96965dac03a664778b9123ac54f6eeb8b2ff1010f594c4b339195edf2220b67d';
 const clientJs=CLIENT_JS_PLACEHOLDER;
 const OWNER='karin-lab',max=30*1024*1024;
 const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
 const decode=x=>{x=x.replace(/-/g,'+').replace(/_/g,'/');return atob(x.padEnd(Math.ceil(x.length/4)*4,'='))};
 async function checkJwt(req){
   const jwt=req.headers.get('Cf-Access-Jwt-Assertion');
   if(!jwt)return false;
   const seg=jwt.split('.');if(seg.length!==3)return false;
   let h,p;try{h=JSON.parse(decode(seg[0]));p=JSON.parse(decode(seg[1]))}catch{return false}
   const arr=Array.isArray(p.aud)?p.aud:[p.aud];if(!arr.includes(AUD)||p.exp*1000<Date.now()||p.nbf&&p.nbf*1000>Date.now())return false;
   const issuer=p.iss;if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com\/?$/.test(issuer))return false;
   const r=await fetch(issuer.replace(/\/$/,'')+'/cdn-cgi/access/certs',{cf:{cacheTtl:300,cacheEverything:true}});
   if(!r.ok)return false;const cert=await r.json();const jwk=(cert.keys||[]).find(x=>x.kid===h.kid);if(!jwk)return false;
   if(h.alg!=='RS256')return false;
   const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
   return crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,Uint8Array.from(decode(seg[2]),x=>x.charCodeAt(0)),new TextEncoder().encode(seg[0]+'.'+seg[1]));
 }

 // Per-note catalog and conflict-checked change queue. The existing R2 snapshot remains canonical.
 const NOTE_ABSENT='__absent__';
 const goodPath=p=>typeof p==='string'&&p.length<=240&&/\.md$/i.test(p)&&!p.startsWith('/')&&!p.split('/').some(s=>!s||s==='.'||s==='..'||s.startsWith('.'))&&!p.includes('\\');
 async function noteHash(s){
   const d=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
   return Array.from(d,x=>x.toString(16).padStart(2,'0')).join('');
 }
 async function snapshotData(env,row){
   const obj=await env.BUCKET.get(row.object_key);
   if(!obj)throw Error('Neoma cloud snapshot missing');
   const data=await new Response(obj.body.pipeThrough(new DecompressionStream('gzip'))).json();
   if(data?.format!==1||!data.stores||!Array.isArray(data.stores.files)||!Array.isArray(data.stores.vaults))throw Error('Invalid stored Neoma snapshot');
   return data;
 }
 async function indexSnapshot(env,row,data){
   if(!row)return 0;
   const current=await env.DB.prepare('SELECT snapshot_revision FROM neoma_note_index_meta WHERE owner=?').bind(OWNER).first();
   if(current?.snapshot_revision===row.revision)return 0;
   const state=data||await snapshotData(env,row);
   const vaults=new Map(state.stores.vaults.filter(x=>x?.kind==='browser').map(v=>[v.id,v.name]));
   const observed=new Set(), all=[];
   for(const f of state.stores.files){
     const name=vaults.get(f.vaultId);
     if(!name||!goodPath(f.path)||f.isBinary||typeof f.text!=='string')continue;
     const id=name+'\u0000'+f.path;observed.add(id);
     all.push({vault_name:name,path:f.path,content:f.text,hash:await noteHash(f.text),modified_at:f.modifiedAt||Date.now()});
   }
   const dbRows=(await env.DB.prepare('SELECT vault_name,path,content_hash FROM neoma_note_index').all()).results||[];
   const old=new Map(dbRows.map(r=>[r.vault_name+'\u0000'+r.path,r.content_hash]));
   const changes=[];
   for(const n of all){
     if(old.get(n.vault_name+'\u0000'+n.path)===n.hash)continue;
     changes.push(env.DB.prepare('INSERT INTO neoma_note_index(vault_name,path,content,content_hash,modified_at,snapshot_revision) VALUES(?,?,?,?,?,?) ON CONFLICT(vault_name,path) DO UPDATE SET content=excluded.content,content_hash=excluded.content_hash,modified_at=excluded.modified_at,snapshot_revision=excluded.snapshot_revision').bind(n.vault_name,n.path,n.content,n.hash,n.modified_at,row.revision));
   }
   for(const oldRow of dbRows)if(!observed.has(oldRow.vault_name+'\u0000'+oldRow.path))changes.push(env.DB.prepare('DELETE FROM neoma_note_index WHERE vault_name=? AND path=?').bind(oldRow.vault_name,oldRow.path));
   changes.push(env.DB.prepare('INSERT INTO neoma_note_index_meta(owner,snapshot_revision,indexed_at) VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET snapshot_revision=excluded.snapshot_revision,indexed_at=excluded.indexed_at').bind(OWNER,row.revision,Date.now()));
   await env.DB.batch(changes);
   return all.length;
 }
 async function reconcileNotes(env){
   let state=await env.DB.prepare('SELECT revision,object_key,sha256,size FROM neoma_cloud_state WHERE owner=?').bind(OWNER).first();
   if(!state)return {processed:0,pending:0};
   await indexSnapshot(env,state);
   const jobs=(await env.DB.prepare("SELECT id,vault_name,path,action,content,expected_hash FROM neoma_note_jobs WHERE status='pending' ORDER BY id LIMIT 10").all()).results||[];
   let processed=0;
   for(const job of jobs){
     if(!goodPath(job.path)||typeof job.content!=='string'||job.content.length>200000||!['create','update'].includes(job.action)){
       await env.DB.prepare("UPDATE neoma_note_jobs SET status='rejected',detail='Invalid note request' WHERE id=?").bind(job.id).run();continue;
     }
     const live=await env.DB.prepare('SELECT content_hash FROM neoma_note_index WHERE vault_name=? AND path=?').bind(job.vault_name,job.path).first();
     const conflict=job.action==='create'?!!live||job.expected_hash!==NOTE_ABSENT:!live||live.content_hash!==job.expected_hash;
     if(conflict){
       await env.DB.prepare("UPDATE neoma_note_jobs SET status='conflict',detail=? WHERE id=?").bind('Note changed or precondition failed',job.id).run();continue;
     }
     const data=await snapshotData(env,state);
     const vault=data.stores.vaults.find(v=>v.kind==='browser'&&v.name===job.vault_name);
     if(!vault){
       await env.DB.prepare("UPDATE neoma_note_jobs SET status='rejected',detail='Vault not found' WHERE id=?").bind(job.id).run();continue;
     }
     const files=data.stores.files;
     const existing=files.findIndex(x=>x.vaultId===vault.id&&x.path===job.path);
     if(job.action==='create'&&existing>=0 || job.action==='update'&&existing<0){
       await env.DB.prepare("UPDATE neoma_note_jobs SET status='conflict',detail='Snapshot file state changed' WHERE id=?").bind(job.id).run();continue;
     }
     const now=Date.now();
     if(existing<0)files.push({vaultId:vault.id,path:job.path,isBinary:false,text:job.content,size:job.content.length,createdAt:now,modifiedAt:now});
     else files[existing]={...files[existing],isBinary:false,text:job.content,size:job.content.length,modifiedAt:now};
     const raw=new TextEncoder().encode(JSON.stringify(data));
     if(raw.byteLength>max){await env.DB.prepare("UPDATE neoma_note_jobs SET status='rejected',detail='Snapshot too large' WHERE id=?").bind(job.id).run();continue;}
     const hash=await noteHash(new TextDecoder().decode(raw));
     const gz=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
     const next=state.revision+1;
     const key='cloud/state/'+next+'-'+crypto.randomUUID()+'.json.gz';
     await env.BUCKET.put(key,gz,{httpMetadata:{contentType:'application/gzip'},customMetadata:{sha256:hash}});
     const saved=await env.DB.prepare('UPDATE neoma_cloud_state SET revision=?,object_key=?,sha256=?,size=?,updated_at=? WHERE owner=? AND revision=?').bind(next,key,hash,raw.length,now,OWNER,state.revision).run();
     if(!saved.meta.changes){await env.BUCKET.delete(key);break;}
     await env.DB.prepare('INSERT INTO neoma_cloud_versions(owner,revision,object_key,sha256,created_at) VALUES(?,?,?,?,?)').bind(OWNER,next,key,hash,now).run();
     await env.DB.prepare("UPDATE neoma_note_jobs SET status='applied',detail=NULL,applied_revision=? WHERE id=?").bind(next,job.id).run();
     state={revision:next,object_key:key,sha256:hash,size:raw.length};
     await indexSnapshot(env,state,data);
     processed++;
   }
   return {processed,pending:jobs.length-processed};
 }

 async function handler(req,env){
   const url=new URL(req.url),path=url.pathname;
   if(path.startsWith('/__cloud/')){
     if(!(await checkJwt(req)))return json({error:'Cloudflare Access authentication required'},401);
     if(path==='/__cloud/client.js'&&req.method==='GET')return new Response(clientJs,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
     if(path==='/__cloud/health'&&req.method==='GET')return json({ok:true,app:'karin-neoma-cloud',database:!!env.DB,bucket:!!env.BUCKET,upstream:!!env.UPSTREAM});
     if(path==='/__cloud/notes'&&req.method==='GET'){
       await reconcileNotes(env);
       const query=(url.searchParams.get('q')||'').trim();
       const results=(await env.DB.prepare('SELECT vault_name,path,content_hash,modified_at FROM neoma_note_index WHERE (? = ? OR vault_name=?) AND (? = ? OR path LIKE ? OR content LIKE ?) ORDER BY modified_at DESC LIMIT 300').bind(url.searchParams.get('vault')||'Karin-Lab','*',url.searchParams.get('vault')||'Karin-Lab',query,'', '%'+query+'%', '%'+query+'%').all()).results||[];
       return json({notes:results});
     }
     if(path==='/__cloud/note'&&req.method==='GET'){
       await reconcileNotes(env);
       const vault=url.searchParams.get('vault')||'Karin-Lab',name=url.searchParams.get('path');
       if(!goodPath(name))return json({error:'Invalid path'},400);
       const n=await env.DB.prepare('SELECT vault_name,path,content,content_hash,modified_at FROM neoma_note_index WHERE vault_name=? AND path=?').bind(vault,name).first();
       return n?json(n):json({error:'Note not found'},404);
     }
     if(path==='/__cloud/note'&&req.method==='POST'){
       if(req.headers.get('Origin')&&req.headers.get('Origin')!==url.origin)return json({error:'Origin mismatch'},403);
       const body=await req.json().catch(()=>null),vault=body?.vault||'Karin-Lab';
       if(!body||typeof vault!=='string'||vault.length>100||!goodPath(body.path)||!['create','update'].includes(body.action)||typeof body.content!=='string'||body.content.length>200000||typeof body.expected_hash!=='string')return json({error:'Invalid note request'},400);
       await reconcileNotes(env);
       const ins=await env.DB.prepare('INSERT INTO neoma_note_jobs(vault_name,path,action,content,expected_hash,created_at) VALUES(?,?,?,?,?,?)').bind(vault,body.path,body.action,body.content,body.expected_hash,Date.now()).run();
       await reconcileNotes(env);
       const result=await env.DB.prepare('SELECT id,status,detail,applied_revision FROM neoma_note_jobs WHERE id=?').bind(ins.meta.last_row_id).first();
       return json(result,result.status==='applied'?201:result.status==='conflict'?409:202);
     }
     if(path==='/__cloud/meta'&&req.method==='GET'){
       await reconcileNotes(env);
       const row=await env.DB.prepare('SELECT revision,size,updated_at FROM neoma_cloud_state WHERE owner=?').bind(OWNER).first();
       return json(row?{revision:row.revision,size:row.size,updatedAt:row.updated_at}:{revision:0,size:0});
     }
     if(path==='/__cloud/state'&&req.method==='GET'){
       const row=await env.DB.prepare('SELECT revision,object_key,sha256 FROM neoma_cloud_state WHERE owner=?').bind(OWNER).first();
       if(!row)return json({error:'No cloud vault yet'},404);
       const obj=await env.BUCKET.get(row.object_key);if(!obj)return json({error:'Snapshot missing'},503);
       const uncompressed=obj.body.pipeThrough(new DecompressionStream('gzip'));
       return new Response(uncompressed,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','ETag':'"'+row.revision+'"'}});
     }
     if(path==='/__cloud/state'&&req.method==='PUT'){
       if(req.headers.get('Origin')&&req.headers.get('Origin')!==url.origin)return json({error:'origin mismatch'},403);
       const expected=Number(req.headers.get('If-Match'));if(!req.headers.has('If-Match')||!Number.isSafeInteger(expected)||expected<0)return json({error:'If-Match revision required'},400);
       const bytes=new Uint8Array(await req.arrayBuffer());if(bytes.length>max)return json({error:'30 MiB maximum'},413);
       let state;try{state=JSON.parse(new TextDecoder().decode(bytes))}catch{return json({error:'Invalid JSON'},400)}
       if(state?.format!==1||typeof state?.stores!=='object'||!state.stores||typeof state?.prefs!=='object')return json({error:'Invalid cloud snapshot'},400);
       for(const s of ['vaults','files','folders','trash'])if(!Array.isArray(state.stores[s]||[]))return json({error:'Invalid store '+s},400);
       const prior=await env.DB.prepare('SELECT revision FROM neoma_cloud_state WHERE owner=?').bind(OWNER).first();
       if((prior?.revision||0)!==expected)return json({error:'conflict',revision:prior?.revision||0},409);
       const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
       const gzip=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
       const next=expected+1,now=Date.now(),key='cloud/state/'+next+'-'+crypto.randomUUID()+'.json.gz';
       await env.BUCKET.put(key,gzip,{httpMetadata:{contentType:'application/gzip'},customMetadata:{sha256:hash}});
       const stmt=expected===0?env.DB.prepare('INSERT INTO neoma_cloud_state (owner,revision,object_key,sha256,size,updated_at) VALUES (?,?,?,?,?,?) ON CO --- TRUNCATED --- 25,968 chars