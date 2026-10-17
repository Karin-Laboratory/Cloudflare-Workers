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


 async function applyGraphPlan(env){
   const id='karin-constellation-20261017-v1';
   const job=await env.DB.prepare("SELECT id,plan_json,expected_revision,status FROM neoma_graph_plans WHERE id=? AND status='pending'").bind(id).first();
   if(!job)return {status:'none'};
   const p=JSON.parse(job.plan_json);
   const row=await env.DB.prepare('SELECT revision,object_key FROM neoma_cloud_state WHERE owner=?').bind(OWNER).first();
   if(!row||row.revision!==job.expected_revision){
     await env.DB.prepare("UPDATE neoma_graph_plans SET status='conflict',detail=? WHERE id=? AND status='pending'").bind('Cloud state changed since the graph plan was prepared',id).run();
     return {status:'conflict'};
   }
   const data=await snapshotData(env,row);
   const vault=data.stores.vaults.find(v=>v.kind==='browser'&&v.name===p.vault);
   if(!vault)throw Error('Target vault missing');
   const files=data.stores.files;
   const existing=files.filter(f=>f.vaultId===vault.id&&typeof f.path==='string'&&f.path.endsWith('.md')&&typeof f.text==='string');
   const names=new Map(existing.map(f=>[f.path.slice(0,-3),f]));
   const removals=Object.keys(p.merge);
   const hubSet=new Set(p.hubs);
   const roles=new Map();
   for(const n of p.hubs){if(!names.has(n))throw Error('Missing hub '+n);roles.set(n,'hub');}
   for(const [hub,members] of Object.entries(p.clusters)){
     if(!hubSet.has(hub))throw Error('Bad hub '+hub);
     for(const n of members){if(roles.has(n)||!names.has(n))throw Error('Bad assignment '+n);roles.set(n,hub);}
   }
   for(const [old,target] of Object.entries(p.merge)){
     if(roles.has(old)||!names.has(old)||!names.has(target)||p.merge[target])throw Error('Bad merge '+old+' -> '+target);
     roles.set(old,'merged');
   }
   if(roles.size!==names.size)throw Error('Incomplete topology: '+roles.size+' versus '+names.size);
   const cleanLinks=t=>t.replace(/!?\[\[([^\]\n]+)\]\]/g,(_,inner)=>{
     const splits=inner.split('|');return splits.length>1?splits.slice(1).join('|'):splits[0];
   });
   function clean(t){
     return cleanLinks(t.replace(/\n## 関連する考え[\s\S]*?(?=\n## |$)/g,'').replace(/\n## 関連ノート[\s\S]*?(?=\n## |$)/g,'').trimEnd());
   }
   function essence(s){
     return cleanLinks(s.replace(/^---[\s\S]*?\n---\s*\n/,'').replace(/^# [^\n]+\n/,'').split(/\n## /)[0].trim());
   }
   const mergedBy=new Map();
   for(const [removed,target] of Object.entries(p.merge)){
     const f=names.get(removed);
     const url=f.text.match(/^source_url:\s*"([^"]+)"/m)?.[1]||f.text.match(/\[(?:元記事|公開記事を読む)\]\((https?:\/\/[^)]+)\)/)?.[1];
     const item={removed,body:essence(f.text),url};
     if(!mergedBy.has(target))mergedBy.set(target,[]);
     mergedBy.get(target).push(item);
   }
   const hubLinks=new Map(p.hubs.map(h=>[h,new Set()]));
   for(const [a,targets] of Object.entries(p.hubEdges)){
     if(!hubSet.has(a))throw Error('Unrecognised core '+a);
     for(const b of targets){
       if(!hubSet.has(b)||a===b)throw Error('Bad core connection');
       hubLinks.get(a).add(b);hubLinks.get(b).add(a);
     }
   }
   const children=new Map(p.hubs.map(h=>[h,[]]));
   for(const [name,role] of roles)if(role!=='hub'&&role!=='merged')children.get(role).push(name);
   function wiki(name){return '[['+name+']]';}
   for(const [name,f] of names){
     if(p.merge[name])continue;
     let main=clean(f.text);
     if(name==='Karin-Lab 思想マップ'){
       main='# Karin-Lab 思想マップ\n\n14個の主要思想を結ぶ中核ネットワークと、各主要思想を周回する個別ノートからなる星図。思想同士のつながりは中心ノードに集め、実験、日記、作品、発見のノートは最も関係の深い一つの中心思想につなぐ。内容が類似する15ノートは出典・固有の視点を統合し、元の全文はR2バックアップに保存している。\n\n## 使い方\n\n主要ノードを開くと周囲のノートを一覧できる。個別ノートからは「中心となる思想」で主要ノードに戻れる。現在の星図は主要14、周辺55ノード。\n\n**バックアップ**: クラウド保存の改訂 '+row.revision+' に再編前の84ノートを保持。\n';
     }
     const absorbed=mergedBy.get(name)||[];
     if(absorbed.length){
       main+='\n\n## 統合した視点（元ノートの記録）\n';
       for(const a of absorbed)main+='\n- **'+a.removed+'**：'+a.body+(a.url?' [出典]('+a.url+')':'')+'\n';
     }
     if(hubSet.has(name)){
       const peers=[...hubLinks.get(name)].sort((a,b)=>a.localeCompare(b,'ja'));
       const sats=children.get(name).sort((a,b)=>a.localeCompare(b,'ja'));
       main+='\n\n## 主要思想どうしのつながり\n\n'+peers.map(wiki).join(' · ');
       if(sats.length)main+='\n\n## この思想を周回するノート\n\n'+sats.map(x=>'- '+wiki(x)).join('\n');
     }else{
       const core=roles.get(name);
       main+='\n\n## 中心となる思想\n\n'+wiki(core);
     }
     f.text=main.trimEnd()+'\n';
     f.size=f.text.length;f.modifiedAt=Date.now();
   }
   const removePaths=new Set(removals.map(x=>x+'.md'));
   data.stores.files=files.filter(f=>f.vaultId!==vault.id||!removePaths.has(f.path));
   const active=data.stores.files.filter(f=>f.vaultId===vault.id&&f.path.endsWith('.md')&&typeof f.text==='string');
   if(active.length!==names.size-removals.length)throw Error('Unexpected final node count');
   const kept=new Set(active.map(f=>f.path.slice(0,-3)));
   let edgeCount=0,satelliteEdges=0;
   for(const f of active){
     const name=f.path.slice(0,-3);
     const linked=[...f.text.matchAll(/\[\[([^\]]+)\]\]/g)].map(m=>m[1].split('|')[0]);
     for(const l of linked)if(!kept.has(l))throw Error('Broken link from '+name+' to '+l);
     edgeCount+=linked.length;
     if(!hubSet.has(name)){
       if(linked.length!==1||!hubSet.has(linked[0]))throw Error('Satellite must have exactly one hub: '+name);
       satelliteEdges++;
     }
   }
   const raw=new TextEncoder().encode(JSON.stringify(data));
   if(raw.length>max)throw Error('Result exceeds 30MiB limit');
   const oldObj=await env.BUCKET.get(row.object_key);
   if(!oldObj)throw Error('Backup source missing');
   const backupKey='cloud/graph-backups/pre-constellation-revision-'+row.revision+'.json.gz';
   await env.BUCKET.put(backupKey,await oldObj.arrayBuffer(),{httpMetadata:{contentType:'application/gzip'}});
   const hash=await noteHash(new TextDecoder().decode(raw));
   const gz=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
   const newRev=row.revision+1,now=Date.now(),key='cloud/state/'+newRev+'-'+crypto.randomUUID()+'.json.gz';
   await env.BUCKET.put(key,gz,{httpMetadata:{contentType:'application/gzip'},customMetadata:{sha256:hash}});
   const done=await env.DB.prepare('UPDATE neoma_cloud_state SET revision=?,object_key=?,sha256=?,size=?,updated_at=? WHERE owner=? AND revision=?').bind(newRev,key,hash,raw.length,now,OWNER,row.revision).run();
   if(!done.meta.changes){await env.BUCKET.delete(key);await env.DB.prepare("UPDATE neoma_graph_plans SET status='conflict',detail='Concurrent cloud save' WHERE id=? AND status='pending'").bind(id).run();return {status:'conflict'};}
   await env.DB.prepare('INSERT INTO neoma_cloud_versions(owner,revision,object_key,sha256,created_at) VALUES(?,?,?,?,?)').bind(OWNER,newRev,key,hash,now).run();
   const description=JSON.stringify({from:row.revision,to:newRev,core:p.hubs.length,planets:satelliteEdges,merged:removals.length,total:active.length,directedLinks:edgeCount,backup:backupKey});
   await env.DB.prepare("UPDATE neoma_graph_plans SET status='applied',detail=?,applied_revision=? WHERE id=?").bind(description,newRev,id).run();
   await indexSnapshot(env,{revision:newRev,object_key:key},data);
   return {status:'applied',revision:newRev,count:active.length};
 }


 async function applyCoreRanking(env){
   const planId='karin-rank-core-20261017-v1';
   const planRow=await env.DB.prepare("SELECT plan_json,status FROM neoma_core_rank_plans WHERE id=? AND status='pending'").bind(planId).first();
   if(!planRow)return {status:'none'};
   const plan=JSON.parse(planRow.plan_json);
   const entry=await env.DB.prepare('SELECT revision,object_key FROM neoma_cloud_state WHERE owner=?').bind(OWNER).first();
   if(!entry)throw Error('No active cloud vault');
   const waiting=await env.DB.prepare("SELECT COUNT(*) AS n FROM neoma_note_jobs WHERE status='pending'").first();
   if(waiting?.n)return {status:'deferred',reason:'queued edits'};
   const data=await snapshotData(env,entry);
   const vault=data.stores.vaults.find(v=>v.kind==='browser'&&v.name===plan.vault);
   if(!vault)throw Error('Karin-Lab browser vault not found');
   const notes=data.stores.files.filter(f=>f.vaultId===vault.id&&f.path?.endsWith('.md')&&typeof f.text==='string');
   const paths=new Set(notes.map(f=>f.path));
   if(notes.length!==69)throw Error('Unexpected core topology node count '+notes.length);
   const mapping=new Map();
   for(const item of plan.ranked){
     if(typeof item.old!=='string'||typeof item.updated!=='string'||!paths.has(item.old+'.md')||paths.has(item.updated+'.md'))throw Error('Invalid rename plan '+item.old);
     if(mapping.has(item.old))throw Error('Duplicate core '+item.old);
     mapping.set(item.old,item.updated);
   }
   if(mapping.size!==13)throw Error('Expected 13 ranked philosophy hubs');
   function transformLink(content){
     return content.replace(/(!?)\[\[([^\]\n]+)\]\]/g, (full,embed,body)=>{
       const bar=body.indexOf('|'),left=bar>=0?body.slice(0,bar):body,alias=bar>=0?body.slice(bar):'';
       const hash=left.indexOf('#'),rawName=hash<0?left:left.slice(0,hash),heading=hash<0?'':left.slice(hash);
       const ext=rawName.toLowerCase().endsWith('.md'),stem=ext?rawName.slice(0,-3):rawName;
       const newName=mapping.get(stem);
       return newName?embed+'[['+newName+(ext?'.md':'')+heading+alias+']]':full;
     });
   }
   for(const file of notes){
     const old=file.path.slice(0,-3),replacement=mapping.get(old);
     let updated=transformLink(file.text);
     if(replacement){
       file.path=replacement+'.md';
       // YAML frontmatter title is the user's visible title as well as the path label.
       updated=updated.replace(/^(---\r?\n[\s\S]*?\n)title:\s*[^\r\n]+/m,(_,start)=>start+'title: '+JSON.stringify(replacement));
       updated=updated.replace(/^# [^\r\n]+/m,'# '+replacement);
     }
     if(old==='Karin-Lab 思想マップ'){
       const ordered=plan.ranked.map(item=>'- [['+item.updated+']]');
       const block='\n## 思想の重要度順\n\n'+ordered.join('\n')+'\n';
       if(/\n## 主要思想どうしのつながり\s*\n[^\n]*/.test(updated))updated=updated.replace(/\n## 主要思想どうしのつながり\s*\n[^\n]*/,block);
       else updated=updated.trimEnd()+'\n'+block;
     }
     file.text=updated;
     file.size=updated.length;
     file.modifiedAt=Date.now();
   }
   // Keep already open editor tabs pointed at the renamed files.
   for(const [key,value] of Object.entries(data.prefs||{})){
     if(!key.startsWith('neoma.tabs.')||typeof value!=='string')continue;
     try{
       const item=JSON.parse(value);
       if(Array.isArray(item.tabs)){
         for(const tab of item.tabs){
           if(tab?.type!=='note'||typeof tab.path!=='string')continue;
           const original=tab.path.endsWith('.md')?tab.path.slice(0,-3):tab.path;
           if(mapping.has(original))tab.path=mapping.get(original)+'.md';
         }
         data.prefs[key]=JSON.stringify(item);
       }
     }catch{}
   }
   const newNames=new Set(notes.map(f=>f.path.slice(0,-3)));
   if(newNames.size!==69)throw Error('Duplicate title after renaming');
   const cores=new Set([...mapping.values()]);
   let planets=0,directedLinks=0,broken=0;
   const rooted=new Set([...cores,'Karin-Lab 思想マップ']);
   for(const f of notes){
     const name=f.path.slice(0,-3);
     const links=[...f.text.matchAll(/\[\[([^\]\n]+)\]\]/g)].map(m=>m[1].split('|')[0].split('#')[0].replace(/\.md$/i,''));
     for(const link of links)if(!newNames.has(link))broken++;
     directedLinks+=links.length;
     if(!rooted.has(name)){
       if(links.length!==1||!cores.has(links[0]))throw Error('Satellite topology invalid: '+name);
       planets++;
     }
   }
   if(broken||planets!==55)throw Error('Graph validation failed: '+broken+' broken, '+planets+' satellites');
   const raw=new TextEncoder().encode(JSON.stringify(data));
   if(raw.length>max)throw Error('Vault larger than snapshot limit');
   const original=await env.BUCKET.get(entry.object_key);
   if(!original)throw Error('R2 source snapshot not found');
   const backup='cloud/graph-backups/pre-core-ranking-revision-'+entry.revision+'.json.gz';
   await env.BUCKET.put(backup,await original.arrayBuffer(),{httpMetadata:{contentType:'application/gzip'}});
   const hash=await noteHash(new TextDecoder().decode(raw));
   const compressed=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
   const newRev=entry.revision+1,now=Date.now(),objectKey='cloud/state/'+newRev+'-'+crypto.randomUUID()+'.json.gz';
   await env.BUCKET.put(objectKey,compressed,{httpMetadata:{contentType:'application/gzip'},customMetadata:{sha256:hash}});
   const updated=await env.DB.prepare('UPDATE neoma_cloud_state SET revision=?,object_key=?,sha256=?,size=?,updated_at=? WHERE owner=? AND revision=?').bind(newRev,objectKey,hash,raw.length,now,OWNER,entry.revision).run();
   if(!updated.meta.changes){
     await env.BUCKET.delete(objectKey);
     return {status:'retry',reason:'concurrent save'};
   }
   await env.DB.prepare('INSERT INTO neoma_cloud_versions(owner,revision,object_key,sha256,created_at) VALUES(?,?,?,?,?)').bind(OWNER,newRev,objectKey,hash,now).run();
   await env.DB.prepare("UPDATE neoma_core_rank_plans SET status='applied',detail=?,applied_revision=? WHERE id=? AND status='pending'").bind(JSON.stringify({before:entry.revision,after:newRev,core:13,planets,directedLinks,backup}),newRev,planId).run();
   await indexSnapshot(env,{revision:newRev,object_key:objectKey},data);
   return {status:'applied',revision:newRev,planets,directedLinks};
 }


 async function applySatelliteRanking(env){
   const id='karin-satellite-rank-20261017-v1';
   const queued=await env.DB.prepare("SELECT plan_json FROM neoma_satellite_rank_plans WHERE id=? AND status='pending'").bind(id).first();
   if(!queued)return {status:'none'};
   const plan=JSON.parse(queued.plan_json);
   if(!Array.isArray(plan.ranking)||plan.ranking.length!==55)throw Error('Satellite rank plan must contain exactly 55 notes');
   const wait=await env.DB.prepare("SELECT COUNT(*) AS n FROM neoma_note_jobs WHERE status='pending'").first();
   if(wait?.n)return {status:'deferred',reason:'pending independent note edits'};
   const current=await env.DB.prepare('SELECT revision,object_key FROM neoma_cloud_state WHERE owner=?').bind(OWNER).first();
   if(!current)throw Error('Karin-Lab cloud state unavailable');
   const data=await snapshotData(env,current);
   const vault=data.stores.vaults.find(v=>v?.kind==='browser'&&v.name===plan.vault);
   if(!vault)throw Error('Karin-Lab vault unavailable');
   const notes=data.stores.files.filter(f=>f.vaultId===vault.id&&typeof f.path==='string'&&f.path.endsWith('.md')&&typeof f.text==='string');
   if(notes.length!==69)throw Error('Unexpected note count: '+notes.length);
   const names=new Set(notes.map(x=>x.path.slice(0,-3)));
   const coreNames=new Set([...names].filter(n=>/^思想[０-９]{1,2}：/.test(n)));
   if(coreNames.size!==13||!names.has('Karin-Lab 思想マップ'))throw Error('Expected 13 main cores and central index');
   const renames=new Map(),ranks=new Map(),paths=new Set();
   const fullwidth=n=>String(n).replace(/[0-9]/g,d=>String.fromCharCode(d.charCodeAt(0)+65248));
   for(let i=0;i<plan.ranking.length;i++){
     const old=plan.ranking[i];
     if(typeof old!=='string'||!names.has(old)||coreNames.has(old)||old==='Karin-Lab 思想マップ'||renames.has(old))throw Error('Invalid satellite in ranking: '+old);
     const slash=old.lastIndexOf('/');
     const dir=slash>=0?old.slice(0,slash+1):'';
     const short=slash>=0?old.slice(slash+1):old;
     const numbered='思想'+fullwidth(101+i)+'：'+short;
     const replacement=dir+numbered;
     if(names.has(replacement)||paths.has(replacement))throw Error('Rank path collision '+replacement);
     const info={newPath:replacement,title:numbered,rank:101+i};
     renames.set(old,info);
     ranks.set(replacement,101+i);
     paths.add(replacement);
   }
   if(renames.size!==55)throw Error('Satellite coverage mismatch');
   function renameLinks(content){
     return content.replace(/(!?)\[\[([^\]\n]+)\]\]/g,(whole,emb,body)=>{
       const bar=body.indexOf('|');
       const left=bar>=0?body.slice(0,bar):body;
       const alias=bar>=0?body.slice(bar):'';
       const hash=left.indexOf('#');
       const path=hash>=0?left.slice(0,hash):left;
       const heading=hash>=0?left.slice(hash):'';
       const hasMd=/\.md$/i.test(path);
       const old=hasMd?path.slice(0,-3):path;
       const next=renames.get(old);
       return next?emb+'[['+next.newPath+(hasMd?'.md':'')+heading+alias+']]':whole;
     });
   }
   function titleInFrontmatter(content,newTitle){
     if(!content.startsWith('---\n')&&!content.startsWith('---\r\n'))
       return '---\ntitle: '+JSON.stringify(newTitle)+'\n---\n\n'+content;
     const closing=/^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/.exec(content);
     if(!closing)throw Error('Malformed frontmatter');
     const whole=closing[0],inner=closing[1];
     const newBlock=/^title:\s*[^\r\n]*/m.test(inner)
       ?whole.replace(/^title:\s*[^\r\n]*/m,'title: '+JSON.stringify(newTitle))
       :whole.replace(/^---\r?\n/,'---\ntitle: '+JSON.stringify(newTitle)+'\n');
     return newBlock+content.slice(whole.length);
   }
   let touched=0;
   for(const file of notes){
     const old=file.path.slice(0,-3);
     const next=renames.get(old);
     let text=renameLinks(file.text);
     if(next){
       file.path=next.newPath+'.md';
       text=titleInFrontmatter(text,next.title);
       if(/^# [^\r\n]+/m.test(text))text=text.replace(/^# [^\r\n]+/m,'# '+next.title);
       else text+='\n# '+next.title+'\n';
       touched++;
     }
     if(/^思想[０-９]{1,2}：/.test(old)){
       const section=/(\n## この思想を周回するノート\s*\n)([\s\S]*?)(?=\n## |$)/;
       const m=section.exec(text);
       if(!m)throw Error('Hub missing its satellite list: '+old);
       const body=m[2],items=body.split('\n').map(x=>x.trim()).filter(Boolean);
       if(items.some(x=>!/^-\s+\[\[[^\]]+\]\]$/.test(x)))throw Error('Unexpected satellite list structure: '+old);
       const sorted=items.map(x=>({line:x,target:x.match(/\[\[([^\]]+)\]\]/)[1]})).sort((a,b)=>(ranks.get(a.target)||999)-(ranks.get(b.target)||999));
       if(sorted.some(x=>!ranks.has(x.target)))throw Error('Unranked satellite reference: '+old);
       text=text.replace(section,(_match,head)=>head+'\n'+sorted.map(x=>x.line).join('\n')+'\n');
     }
     file.text=text;
     file.size=text.length;
     if(next)file.modifiedAt=Date.now();
   }
   if(touched!==55)throw Error('Only '+touched+' of 55 satellites renamed');
   // Preserve the user's open editor tabs across the file moves.
   for(const [k,v] of Object.entries(data.prefs||{})){
     if(!k.startsWith('neoma.tabs.')||typeof v!=='string')continue;
     try{
       const state=JSON.parse(v);
       if(!Array.isArray(state.tabs))continue;
       for(const tab of state.tabs){
         if(tab?.type!=='note'||typeof tab.path!=='string')continue;
         const old=tab.path.replace(/\.md$/i,'');
         const target=renames.get(old);
         if(target)tab.path=target.newPath+'.md';
       }
       data.prefs[k]=JSON.stringify(state);
     }catch{}
   }
   const after=new Set(notes.map(x=>x.path.slice(0,-3)));
   if(after.size!==69)throw Error('Renaming produced path collision');
   let edgeCount=0,satellites=0,hubLinks=0;
   for(const f of notes){
     const name=f.path.slice(0,-3);
     const links=[...f.text.matchAll(/\[\[([^\]\n]+)\]\]/g)].map(x=>x[1].split('|')[0].split('#')[0].replace(/\.md$/i,''));
     for(const target of links)if(!after.has(target))throw Error('Broken link '+name+' -> '+target);
     edgeCount+=links.length;
     if(!coreNames.has(name)&&name!=='Karin-Lab 思想マップ'){
       if(links.length!==1||!coreNames.has(links[0]))throw Error('Satellite degree is not 1: '+name);
       satellites++;
     }else if(coreNames.has(name)){
       hubLinks+=links.filter(x=>coreNames.has(x)).length;
     }
   }
   if(satellites!==55||hubLinks!==48)throw Error('Unexpected constellation topology '+satellites+'/'+hubLinks);
   const raw=new TextEncoder().encode(JSON.stringify(data));
   if(raw.length>max)throw Error('Vault snapshot too large');
   const backupSource=await env.BUCKET.get(current.object_key);
   if(!backupSource)throw Error('Current source object missing');
   const backup='cloud/graph-backups/pre-satellite-ranking-revision-'+current.revision+'.json.gz';
   await env.BUCKET.put(backup,await backupSource.arrayBuffer(),{httpMetadata:{contentType:'application/gzip'}});
   const sha=await noteHash(new TextDecoder().decode(raw));
   const gz=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
   const revision=current.revision+1,now=Date.now(),key='cloud/state/'+revision+'-'+crypto.randomUUID()+'.json.gz';
   await env.BUCKET.put(key,gz,{httpMetadata:{contentType:'application/gzip'},customMetadata:{sha256:sha}});
   const saved=await env.DB.prepare('UPDATE neoma_cloud_state SET revision=?,object_key=?,sha256=?,size=?,updated_at=? WHERE owner=? AND revision=?').bind(revision,key,sha,raw.length,now,OWNER,current.revision).run();
   if(!saved.meta.changes){
     await env.BUCKET.delete(key);
     return {status:'retry',reason:'Concurrent cloud revision'};
   }
   await env.DB.prepare('INSERT INTO neoma_cloud_versions(owner,revision,object_key,sha256,created_at) VALUES(?,?,?,?,?)').bind(OWNER,revision,key,sha,now).run();
   const details={before:current.revision,after:revision,renamed:touched,planets:satellites,directedLinks:edgeCount,backup};
   await env.DB.prepare("UPDATE neoma_satellite_rank_plans SET status='applied',detail=?,applied_revision=? WHERE id=? AND status='pending'").bind(JSON.stringify(details),revision,id).run();
   await indexSnapshot(env,{revision,object_key:key},data);
   return {status:'applied',...details};
 }

 async function handler(req,env){
   const url=new URL(req.url),path=url.pathname;
   if(path.startsWith('/__cloud/')){
     if(!(await checkJwt(req)))return json({error:'Cloudflare Access authentication required'},401);
     if(path==='/__cloud/client.js'&&req.method==='GET')return new Response(clientJs,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
     if(path==='/__cloud/edit-ctrl-click.js'&&req.method==='GET'){
       const addon=await env.BUCKET.get('cloud/assets/edit-ctrl-click.js');
       if(!addon)return json({error:'Client enhancement not installed'},404);
       return new Response(addon.body,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
     }
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
       const stmt=expected===0?env.DB.prepare('INSERT INTO neoma_cloud_state (owner,revision,object_key,sha256,size,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(owner) DO NOTHING').bind(OWNER,next,key,hash,bytes.length,now):env.DB.prepare('UPDATE neoma_cloud_state SET revision=?,object_key=?,sha256=?,size=?,updated_at=? WHERE owner=? AND revision=?').bind(next,key,hash,bytes.length,now,OWNER,expected);
       const change=await stmt.run();if(!change.meta.changes){await env.BUCKET.delete(key);return json({error:'conflict'},409)}
       await env.DB.prepare('INSERT INTO neoma_cloud_versions(owner,revision,object_key,sha256,created_at) VALUES (?,?,?,?,?)').bind(OWNER,next,key,hash,now).run();
       return json({revision:next,hash,size:bytes.length});
     }
     return json({error:'Not found'},404);
   }
   // Preserve the existing Neoma application, legacy synchronization API, and static assets.
   const res=await env.UPSTREAM.fetch(req);
   if(req.method==='GET'&&path==='/Karin-Lab-Qiita-Hatena-31.zip'&&res.ok){
     const headers=new Headers(res.headers);
     headers.set('Content-Disposition','attachment; filename="Karin-Lab-Qiita-Hatena-31.zip"');
     headers.set('Content-Type','application/zip');
     headers.set('Cache-Control','private, no-store');
     return new Response(res.body,{status:res.status,headers});
   }
   if(req.method==='GET'&&(path==='/'||path==='/index.html')&&res.ok){
     const h=new Headers(res.headers);h.delete('content-encoding');h.delete('content-length');h.set('Cache-Control','no-store');
     let html=await res.text();
     html=html.replace(/<script\b[^>]*type=["']module["'][^>]*>\s*<\/script>/gi,m=>m);
     let count=0;
     html=html.replace(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/gi,(tag,src)=>{count++;return '<script type="module">await window.__karinCloudReady; await import('+JSON.stringify(src)+');<\/script>'});
     if(count===0)return json({error:'Could not identify Neoma module for cloud bootstrap'},503);
     html=html.replace(/<\/head>/i,'<script src="/__cloud/client.js"><\/script><script src="/__cloud/edit-ctrl-click.js" defer><\/script><\/head>');
     return new Response(html,{status:res.status,headers:h});
   }
   return res;
 }
 return {async fetch(req,env){try{return await handler(req,env)}catch(e){console.error('karin-neoma-cloud',e);return json({error:'Cloud service error'},500)}},async scheduled(event,env,ctx){ctx.waitUntil((async()=>{await applyGraphPlan(env);await applyCoreRanking(env);await applySatelliteRanking(env);await reconcileNotes(env)})().catch(e=>console.error('neoma maintenance',e)))}};
})();