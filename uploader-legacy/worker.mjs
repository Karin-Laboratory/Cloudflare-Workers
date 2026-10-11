import { page } from './page.mjs';
export const MAX_BYTES = 100_000_000;
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
export default {
  async fetch(request,env) {
    const user=await authenticate(request,env);
    if(!user) return json({error:'メールOTPでログインしてください。'},401);
    const url=new URL(request.url), path=url.pathname, method=request.method;
    if(!['GET','HEAD'].includes(method)) {
      if(!user.owner) return json({error:'アップロード・削除はカリンちゃん専用です。'},403);
      if(request.headers.get('Origin')!==url.origin) return json({error:'同じサイトから操作してください。'},403);
    }
    try {
      if(path==='/' && method==='GET') {
        const nonce=crypto.randomUUID();
        return new Response(page(nonce),{headers:{...baseHeaders,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`}});
      }
      if(path==='/api/me' && method==='GET') return json({...user,maxBytes:MAX_BYTES});
      if(path==='/api/files' && method==='GET') {
        const cursor=url.searchParams.get('cursor')||undefined;
        if(cursor && cursor.length>4096) return json({error:'一覧の位置が不正です。'},400);
        const list=await env.FILES.list({prefix:'files/',limit:100,include:['customMetadata'],cursor});
        return json({files:list.objects.map(summary),cursor:list.truncated?list.cursor:null});
      }
      if(path==='/api/files' && method==='PUT') {
        const length=request.headers.get('Content-Length');
        if(!length || !/^\d+$/.test(length)) return json({error:'ファイルサイズを確認できません。'},411);
        const size=Number(length);
        if(size>MAX_BYTES) return json({error:'ファイルは100MB以下にしてください。'},413);
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
