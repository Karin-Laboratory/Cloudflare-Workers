import { page } from './page.mjs';
export const MAX_BYTES = 500_000_000;
export const CHUNK_BYTES = 20_000_000;
const encoder = new TextEncoder();
let jwksCache;
const baseHeaders = { 'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY' };
function json(body, status=200) { return Response.json(body, { status, headers:baseHeaders }); }
function decode(s) { if(!/^[A-Za-z0-9_-]+$/.test(s)) throw Error('jwt'); return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0)); }
export async function authenticate(request, env) {
  try {
    const token=request.headers.get('Cf-Access-Jwt-Assertion');
    if(!token || token.length>16384 || !env.ACCESS_TEAM || !env.ACCESS_AUD) return null;
    const parts=token.split('.'); if(parts.length!==3) return null;
    const header=JSON.parse(new TextDecoder().decode(decode(parts[0])));
    if(header.alg!=='RS256' || typeof header.kid!=='string') return null;
    const issuer=env.ACCESS_TEAM.replace(/\/$/,'');
    if(!jwksCache || jwksCache.issuer!==issuer || jwksCache.until<Date.now()) {
      const response=await fetch(issuer+'/cdn-cgi/access/certs');
      if(!response.ok) return null;
      const data=await response.json();
      jwksCache={issuer,keys:data.keys,until:Date.now()+300000};
    }
    const jwk=jwksCache.keys.find(k=>k.kid===header.kid && k.kty==='RSA');
    if(!jwk) return null;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),encoder.encode(parts[0]+'.'+parts[1]))) return null;
    const claims=JSON.parse(new TextDecoder().decode(decode(parts[1]))), now=Math.floor(Date.now()/1000);
    if(claims.iss!==issuer || !Array.isArray(claims.aud) || !claims.aud.includes(env.ACCESS_AUD) || !Number.isFinite(claims.exp) || claims.exp<=now || (claims.nbf!==undefined && (!Number.isFinite(claims.nbf)||claims.nbf>now)) || (claims.iat!==undefined && (!Number.isFinite(claims.iat)||claims.iat>now+30)) || claims.type!=='app' || typeof claims.email!=='string' || !claims.email.includes('@')) return null;
    return {email:claims.email.toLowerCase(),owner:claims.email.toLowerCase()===env.OWNER_EMAIL?.toLowerCase()};
  } catch { return null; }
}
function summary(o) { return {id:o.key.slice(6),name:o.customMetadata?.name||o.key,size:o.size,uploaded:o.uploaded.toISOString(),description:o.customMetadata?.description||'',sha256:o.customMetadata?.sha256||''}; }
const validID = id => /^\d{13}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
const karinOriginalWorker = {
  async fetch(request,env) {
    const user=await authenticate(request,env);
    if(!user) return json({error:'メールOTPでログインしてください。'},401);
    const url=new URL(request.url), path=url.pathname, method=request.method;
    if(!['GET','HEAD'].includes(method)) {
      if(!user.owner) return json({error:'アップロード・削除は管理者専用です。'},403);
      if(request.headers.get('Origin')!==url.origin) return json({error:'同じサイトから操作してください。'},403);
    }
    try {
      if(path==='/' && method==='GET') {
        const nonce=crypto.randomUUID();
        return new Response(page(nonce),{headers:{...baseHeaders,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`}});
      }
      if(path==='/api/me' && method==='GET') return json({email:user.owner?'nobody':user.email,owner:user.owner,maxBytes:MAX_BYTES});
      if(path==='/api/files' && method==='GET') {
        const cursor=url.searchParams.get('cursor')||undefined;
        if(cursor && cursor.length>4096) return json({error:'一覧の位置が不正です。'},400);
        const list=await env.FILES.list({prefix:'files/',limit:100,include:['customMetadata'],cursor});
        return json({files:list.objects.map(summary),cursor:list.truncated?list.cursor:null});
      }
      if(path==='/api/uploads' && method==='POST') {
        if(Number(request.headers.get('Content-Length'))>4096) return json({error:'入力が大きすぎます。'},400);
        const {name,description='',sha256,size}=await request.json();
        if(!Number.isSafeInteger(size)||size<1||size>MAX_BYTES) return json({error:'ファイルは1バイト以上500MB以下にしてください。'},413);
        if(typeof name!=='string'||!name||encoder.encode(name).length>240||/[\x00-\x1f\x7f/\\]/.test(name)||typeof description!=='string'||encoder.encode(description).length>1000||typeof sha256!=='string'||!/^[a-f0-9]{64}$/.test(sha256)) return json({error:'ファイル情報が不正です。'},400);
        const id=String(9999999999999-Date.now()).padStart(13,'0')+'-'+crypto.randomUUID();
        const pending=await env.FILES.createMultipartUpload('files/'+id,{httpMetadata:{contentType:'application/octet-stream'},customMetadata:{name,description,sha256}});
        try {await env.FILES.put('uploads/'+id+'/meta',new Uint8Array(),{customMetadata:{name,description,sha256,size:String(size),created:String(Date.now()),uploadId:pending.uploadId}});} catch(e){await pending.abort();throw e;}
        return json({id,chunkBytes:CHUNK_BYTES},201);
      }
      const upload=path.match(/^\/api\/uploads\/([^/]+)(?:\/(\d+|complete))?$/);
      if(upload && validID(upload[1]) && ['PUT','POST','DELETE'].includes(method)) {
        const id=upload[1],base='uploads/'+id+'/',meta=await env.FILES.head(base+'meta');
        if(!meta) return json({error:'転送がありません。'},404);
        const m=meta.customMetadata,size=Number(m.size),count=Math.ceil(size/CHUNK_BYTES);
        const cleanup=()=>env.FILES.delete([base+'meta',...Array.from({length:count},(_,i)=>base+i),...Array.from({length:count},(_,i)=>base+'temp-'+i)]);
        if(!m.uploadId){await cleanup();return json({error:'転送方式を更新しました。ページを再読み込みして再試行してください。'},409);}
        const pending=env.FILES.resumeMultipartUpload('files/'+id,m.uploadId);
        const abort=async()=>{await pending.abort().catch(()=>{});await cleanup();};
        if(method==='DELETE'&&!upload[2]) {await abort();return json({ok:true});}
        if(Date.now()-Number(m.created)>86400000) {await abort();return json({error:'転送期限が切れました。'},410);}
        if(method==='PUT' && /^\d+$/.test(upload[2]||'')) {
          const index=Number(upload[2]),expected=Math.min(CHUNK_BYTES,size-index*CHUNK_BYTES),sha256=request.headers.get('X-Chunk-SHA256')||'';
          if(index>=count||Number(request.headers.get('Content-Length'))!==expected||!request.body) return json({error:'分割サイズが一致しません。'},400);
          if(!/^[a-f0-9]{64}$/.test(sha256))return json({error:'ページを再読み込みして転送を再試行してください。'},400);
          const temp=base+'temp-'+index;
          try {
            const verified=await env.FILES.put(temp,request.body,{sha256});
            if(!verified||verified.size!==expected)throw Error('chunk size mismatch');
            const source=await env.FILES.get(temp);
            const part=await pending.uploadPart(index+1,source.body);
            if(part.etag.replaceAll('"','')!==source.etag)throw Error('multipart checksum mismatch');
            await env.FILES.put(base+index,new Uint8Array(),{customMetadata:{etag:part.etag,size:String(expected),sha256}});
            return json({ok:true});
          } finally {await env.FILES.delete(temp);}
        }
        if(method==='POST' && upload[2]==='complete') {
          const parts=[];
          for(let i=0;i<count;i++) {const part=await env.FILES.head(base+i);if(!part||Number(part.customMetadata?.size)!==Math.min(CHUNK_BYTES,size-i*CHUNK_BYTES)||!part.customMetadata?.etag) return json({error:'転送が未完了です。'},409);parts.push({partNumber:i+1,etag:part.customMetadata.etag});}
          const object=await pending.complete(parts);
          if(!object||object.size!==size){await env.FILES.delete('files/'+id);await abort();return json({error:'保存サイズが一致しません。'},400);}
          await cleanup();return json({file:summary(object)},201);
        }
      }
      if(path==='/api/files' && method==='PUT') {
        const length=request.headers.get('Content-Length');
        if(!length || !/^\d+$/.test(length)) return json({error:'ファイルサイズを確認できません。'},411);
        const size=Number(length);
        if(size>MAX_BYTES) return json({error:'ファイルは500MB以下にしてください。'},413);
        if(size<1) return json({error:'空のファイルはアップロードできません。'},400);
        const name=url.searchParams.get('name')||'', description=url.searchParams.get('description')||'', sha256=request.headers.get('X-File-SHA256')||'';
        if(!name || encoder.encode(name).length>240 || /[\x00-\x1f\x7f/\\]/.test(name) || encoder.encode(description).length>1000 || !/^[a-f0-9]{64}$/.test(sha256)) return json({error:'ファイル名・メモ・SHA-256を確認してください。'},400);
        if(!request.body) return json({error:'ファイルがありません。'},400);
        const id=String(9999999999999-Date.now()).padStart(13,'0')+'-'+crypto.randomUUID();
        const object=await env.FILES.put('files/'+id,request.body,{sha256,httpMetadata:{contentType:'application/octet-stream'},customMetadata:{name,description,sha256}});
        if(!object || object.size!==size) { await env.FILES.delete('files/'+id); return json({error:'転送サイズが一致しません。再試行してください。'},400); }
        return json({file:summary(object)},201);
      }
      const match=path.match(/^\/(api\/files|download)\/([^/]+)$/);
      if(match && validID(match[2])) {
        const key='files/'+match[2];
        if(match[1]==='api/files' && method==='DELETE') {
          const obj=await env.FILES.head(key); if(!obj) return json({error:'ファイルがありません。'},404);
          await env.FILES.delete(key);return json({ok:true});
        }
        if(match[1]==='download' && ['GET','HEAD'].includes(method)) {
          const obj=method==='HEAD'?await env.FILES.head(key):await env.FILES.get(key);
          if(!obj) return json({error:'ファイルがありません。'},404);
          const name=obj.customMetadata?.name||'download.bin';
          const encoded=encodeURIComponent(name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
          return new Response(method==='HEAD'?null:obj.body,{headers:{...baseHeaders,'Content-Type':'application/octet-stream','Content-Length':String(obj.size),'Content-Disposition':`attachment; filename="download.bin"; filename*=UTF-8''${encoded}`,'ETag':obj.httpEtag}});
        }
      }
      return json({error:'ページがありません。'},404);
    } catch(error) {
      console.error('storage operation failed', {path,method,message:error?.message});
      return json({error:'保存または取得に失敗しました。SHA-256と通信状態を確認して再試行してください。'},500);
    }
  }
};

const KARIN_FAVICON_SVG="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"g\"><stop stop-color=\"#5762a0\"/><stop offset=\"1\" stop-color=\"#b3baff\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"15\" fill=\"url(#g)\"/><g stroke=\"#fff\" stroke-width=\"3.2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 44h-2a9 9 0 0 1-3-17 16 16 0 0 1 31 4 7 7 0 0 1 0 14h-3 M32 51V29 M23 37l9-9 9 9\"/></g></svg>";
export default {...karinOriginalWorker,async fetch(request,env,ctx){const pathname=new URL(request.url).pathname;if(pathname==='/favicon.svg')return new Response(KARIN_FAVICON_SVG,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public,max-age=86400','x-content-type-options':'nosniff'}});if(pathname==='/favicon.ico')return Response.redirect(new URL('/favicon.svg',request.url),302);return karinOriginalWorker.fetch(request,env,ctx)}};