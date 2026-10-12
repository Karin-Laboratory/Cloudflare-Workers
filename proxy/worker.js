const HOST = "proxy.karin-lab.com";
const COMMON = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
const BLOCKED_SUFFIXES = [".localhost",".local",".internal",".test",".invalid",".onion",".nip.io",".sslip.io",".localtest.me",".lvh.me",".karin-lab.com",".cloudflareaccess.com"];
export function checkTarget(raw) {
  if (!raw || typeof raw !== "string" || raw.length > 4096) throw new Error("URLを確認してください。");
  const input=raw.trim();
  if (/[\u0000-\u001f\u007f\\]/.test(input)) throw new Error("無効なURLです。");
  const normalized=/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input)?input:"https://"+input;
  let url;
  try {url=new URL(normalized)} catch {throw new Error("URLの形式が正しくありません。")}
  if(url.protocol!=="https:"||url.username||url.password||(url.port&&url.port!=="443"))throw new Error("HTTPS（標準ポート）の公開サイトのみ利用できます。");
  const host=url.hostname.toLowerCase().replace(/\.$/,"");
  if(!host.includes(".")||host===HOST||host.endsWith(".karin-lab.com")||BLOCKED_SUFFIXES.some(s=>host.endsWith(s))||/^\d+(?:\.\d+){3}$/.test(host)||host.includes(":")||/(^|\.)(localhost|local|internal|metadata)$/.test(host))throw new Error("安全のため、この宛先への接続はできません。");
  url.hash="";
  return url;
}

/**
 * HTMLRewriter requires UTF-8 input. Many Japanese sites, including some
 * responses from Google, still serve Shift_JIS or another legacy encoding.
 * Detect the upstream charset before handing markup to HTMLRewriter.
 */
export function detectCharset(bytes, contentType="") {
  const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  if(data.length>=3&&data[0]===0xef&&data[1]===0xbb&&data[2]===0xbf)return "utf-8";
  if(data.length>=2&&data[0]===0xff&&data[1]===0xfe)return "utf-16le";
  if(data.length>=2&&data[0]===0xfe&&data[1]===0xff)return "utf-16be";
  const header=/\bcharset\s*=\s*["']?\s*([a-z0-9._-]+)/i.exec(contentType)?.[1];
  if(header)return header;
  const prefix=new TextDecoder("windows-1252").decode(data.subarray(0,8192));
  const meta=/<meta\b[^>]{0,500}charset\s*=\s*["']?\s*([a-z0-9._-]+)/i.exec(prefix)?.[1];
  if(meta)return meta;
  const xml=/<\?xml\b[^>]{0,300}encoding\s*=\s*["']([^"']+)/i.exec(prefix)?.[1];
  return xml||"utf-8";
}
export function decodeResponseBody(bytes, contentType="") {
  const charset=detectCharset(bytes,contentType);
  try{return new TextDecoder(charset).decode(bytes)}
  catch{return new TextDecoder("utf-8").decode(bytes)}
}
// Some HTMLRewriter upstream attributes contain literal &amp; (and can
// occasionally be double-escaped). Decode URL ampersands before resolving.
export function decodeUrlEntities(value) {
  let current=String(value);
  for(let i=0;i<2;i++){
    const next=current.replace(/&(?:amp|#0*38|#x0*26);/gi,"&");
    if(next===current)break;
    current=next;
  }
  return current;
}

function linkFor(url,kind="view"){return "/"+kind+"?url="+encodeURIComponent(url.toString())}
function resolveRemote(value,base){
  if(!value||/^(?:#|data:|javascript:|mailto:|tel:|blob:)/i.test(value.trim()))return null;
  try{return checkTarget(new URL(decodeUrlEntities(value),base).toString())}catch{return null}
}
function safeUrl(value,base,kind){
  const remote=resolveRemote(value,base);
  return remote?linkFor(remote,kind):(value?.startsWith("#")?value:"about:blank");
}
function rewriteSrcset(value,base){
  return value.split(",").map(part=>{
    const m=part.trim().match(/^(\S+)([\s\S]*)$/);
    return m?safeUrl(m[1],base,"asset")+m[2]:"";
  }).join(", ");
}
function rewriteCss(css,base){
  return css.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi,(_,q,addr)=>"url("+q+safeUrl(addr,base,"asset")+q+")")
    .replace(/@import\s+(['"])([^'"]+)\1/gi,(_,q,addr)=>"@import "+q+safeUrl(addr,base,"asset")+q);
}
const HTML_SELECTORS={
  a:{href:"view"},area:{href:"view"},link:{href:"asset"},img:{src:"asset"},
  script:{src:"asset"},source:{src:"asset"},video:{src:"asset",poster:"asset"},
  audio:{src:"asset"},iframe:{src:"view"},frame:{src:"view"},embed:{src:"asset"},
  object:{data:"asset"},form:{action:"view"},button:{formaction:"view"},
  input:{src:"asset",formaction:"view"},track:{src:"asset"}
};
function bootstrap(remoteURL){
  const remoteJSON=JSON.stringify(remoteURL).replace(/</g,"\\u003c");
  return `<script>
  (() => {
    const remote=${remoteJSON};
    const make=(url,kind='asset')=>{
      try{const target=new URL(String(url),remote);if(target.protocol!=='https:')return String(url);
        return '/'+kind+'?url='+encodeURIComponent(target.href)}catch{return String(url)}
    };
    try{parent.postMessage({kind:'karin-proxy-navigation',url:remote},'*')}catch{}
    const oldFetch=window.fetch;
    if(oldFetch)window.fetch=function(resource,opts){
      try{const u=typeof resource==='string'?resource:resource.url;
        return oldFetch.call(this,make(u),opts)}catch{return oldFetch.call(this,resource,opts)}
    };
    if(window.XMLHttpRequest){
      const open=XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open=function(method,url,...rest){return open.call(this,method,make(url),...rest)}
    }
    addEventListener('submit',event=>{
      const form=event.target;
      if(!(form instanceof HTMLFormElement)||form.method.toLowerCase()!=='get')return;
      const action=new URL(form.action);
      if(action.pathname!=='/view'||!action.searchParams.has('url'))return;
      event.preventDefault();
      try{
        const target=new URL(action.searchParams.get('url'));
        const fields=new FormData(form,event.submitter);
        for(const [key,value] of fields.entries())if(typeof value==='string')target.searchParams.append(key,value);
        location.href='/view?url='+encodeURIComponent(target.href);
      }catch{}
    },true);
  })();
  </script>`;
}
function rewriterFor(target){
  const base=target.toString(),rw=new HTMLRewriter();
  for(const [tag,attrs] of Object.entries(HTML_SELECTORS)){
    rw.on(tag,{element(el){
      for(const [name,kind] of Object.entries(attrs)){
        const val=el.getAttribute(name);
        if(val!==null)el.setAttribute(name,safeUrl(val,base,kind));
      }
      if(el.hasAttribute("srcset"))el.setAttribute("srcset",rewriteSrcset(el.getAttribute("srcset"),base));
      if(el.hasAttribute("data-src"))el.setAttribute("data-src",safeUrl(el.getAttribute("data-src"),base,"asset"));
      if(el.hasAttribute("integrity"))el.removeAttribute("integrity");
      if((tag==="a"||tag==="area"||tag==="form")&&el.hasAttribute("target"))el.setAttribute("target","_self");
      if(tag==="form"&&!el.hasAttribute("action"))el.setAttribute("action",linkFor(target));
    }});
  }
  rw.on("base",{element(el){el.remove()}});
  rw.on("meta[charset]",{element(el){el.setAttribute("charset","utf-8")}});
  rw.on('meta[http-equiv="Content-Type"]',{element(el){
    el.setAttribute("content","text/html; charset=utf-8");
  }});
  rw.on('meta[http-equiv="Content-Security-Policy"]',{element(el){el.remove()}});
  rw.on('meta[http-equiv="refresh"]',{element(el){
    const v=el.getAttribute("content")||"",m=v.match(/^(\s*\d+(?:\.\d+)?\s*;\s*url\s*=\s*)(.*)$/i);
    if(m)el.setAttribute("content",m[1]+safeUrl(m[2].replace(/^['"]|['"]$/g,""),base,"view"));
  }});
  rw.on("[style]",{element(el){el.setAttribute("style",rewriteCss(el.getAttribute("style"),base))}});
  rw.on("style",{text(t){t.replace(rewriteCss(t.text,base))}});
  rw.on("head",{element(el){el.prepend(bootstrap(base),{html:true})}});
  return rw;
}
function shell(){
  const html=`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Karin Proxy</title><style>
:root{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#202b38;background:#f8fafc}
*{box-sizing:border-box}body{margin:0;height:100dvh;display:flex;flex-direction:column}
header{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#fff;border-bottom:1px solid #dce5ef;min-height:60px}
.brand{display:flex;align-items:center;gap:7px;font-weight:750;color:#2873bb;white-space:nowrap;margin-right:10px}
.brand svg{width:23px;height:23px}.nav{border:1px solid #d9e2ec;background:#f7f9fc;border-radius:9px;height:36px;min-width:36px;font-size:18px;color:#40546c;cursor:pointer}
.nav:hover{background:#e8f2ff}.nav:disabled{color:#bfc8d3;cursor:default}
form{display:flex;flex:1;min-width:0;gap:7px}input{min-width:0;flex:1;border:1px solid #cbd7e3;border-radius:9px;padding:8px 12px;font-size:14px;background:#f8fafc;outline:none}
input:focus{border-color:#4295e6;box-shadow:0 0 0 3px #e1f0ff}
.go{border:0;background:#267de0;color:#fff;font-size:14px;font-weight:650;padding:0 20px;border-radius:9px;cursor:pointer}
main{position:relative;flex:1;min-height:0;background:#fff}
iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:white;display:none}
#welcome{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;color:#7a8ba0;padding:24px}
#status{position:absolute;bottom:10px;left:12px;background:#fffde9cc;border:1px solid #eadfb2;border-radius:7px;padding:5px 10px;font-size:12px;max-width:calc(100% - 24px);display:none}
@media(max-width:620px){header{flex-wrap:wrap;padding:7px}.brand{flex:1}.nav{height:34px}.brand span{font-size:13px}form{width:100%;flex-basis:100%;order:2}.go{padding:0 12px}}
</style></head><body><header>
<div class="brand"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/><path d="M2.6 12h18.8M12 2.5c5 5.1 5 13.9 0 19M12 2.5c-5 5.1-5 13.9 0 19"/></svg><span>Karin Proxy</span></div>
<button class="nav" id="back" title="戻る" aria-label="戻る" disabled>‹</button>
<button class="nav" id="forward" title="進む" aria-label="進む" disabled>›</button>
<button class="nav" id="reload" title="再読み込み" aria-label="再読み込み">↻</button>
<form id="addressForm"><input id="address" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://example.com" aria-label="URLを入力" required><button class="go" type="submit">開く</button></form>
</header><main><div id="welcome"><div><div style="font-size:38px;margin-bottom:10px">🌐</div><div style="font-size:19px;color:#465e76;font-weight:650">URLを入力してブラウジング</div><p>公開HTTPSサイトをプロクシ経由で表示します。<br>ログインが必要なサイトや高度なWebアプリは正常に動かない場合があります。</p></div></div>
<iframe id="viewer" title="プロクシ閲覧画面" referrerpolicy="no-referrer" sandbox="allow-scripts allow-forms allow-downloads allow-popups"></iframe>
<div id="status" role="status"></div></main><script>
const address=document.getElementById('address'),viewer=document.getElementById('viewer'),
back=document.getElementById('back'),forward=document.getElementById('forward'),reload=document.getElementById('reload'),
status=document.getElementById('status');
let entries=[],position=-1;
function normalized(raw){
  const value=raw.trim();if(!value)return null;
  const withProtocol=/^[a-zA-Z][a-zA-Z\\d+.-]*:/.test(value)?value:'https://'+value;
  try{const url=new URL(withProtocol);if(url.protocol!=='https:')return null;return url.href}catch{return null}
}
function buttons(){back.disabled=position<=0;forward.disabled=position>=entries.length-1}
function notice(message){status.textContent=message;status.style.display=message?'block':'none'}
function show(url,record=true){
  if(!url)return;
  try{const u=new URL(url);if(u.protocol!=='https:')throw Error('HTTPSのみ対応');url=u.href}
  catch{notice('HTTPSのURLを入力してください。');return}
  if(record&&entries[position]!==url){entries=entries.slice(0,position+1);entries.push(url);position=entries.length-1}
  buttons();address.value=url;notice('読み込み中…');
  document.getElementById('welcome').style.display='none';viewer.style.display='block';
  viewer.src='/view?url='+encodeURIComponent(url);
}
document.getElementById('addressForm').addEventListener('submit',e=>{e.preventDefault();show(normalized(address.value))});
back.addEventListener('click',()=>{if(position>0){position--;show(entries[position],false)}});
forward.addEventListener('click',()=>{if(position<entries.length-1){position++;show(entries[position],false)}});
reload.addEventListener('click',()=>{if(position>=0)show(entries[position],false)});
viewer.addEventListener('load',()=>notice(''));
addEventListener('message',event=>{
  if(event.source!==viewer.contentWindow||!event.data||event.data.kind!=='karin-proxy-navigation')return;
  const url=normalized(event.data.url);if(!url)return;
  if(entries[position]!==url){entries=entries.slice(0,position+1);entries.push(url);position=entries.length-1}
  address.value=url;buttons();
});
const initial=new URL(location.href).searchParams.get('url')||'https://www.google.com/?hl=ja';show(normalized(initial));
</script></body></html>`;
  return new Response(html,{headers:{...COMMON,"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; frame-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:"}});
}
function escapeHtml(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function fail(message,status=400){
  return new Response("<!doctype html><meta charset=utf-8><style>body{font:16px system-ui;padding:32px;color:#334155}a{color:#1d70c9}</style><h2>ページを表示できません</h2><p>"+escapeHtml(message)+"</p><p><a href='/'>Karin Proxyに戻る</a></p>",{status,headers:{...COMMON,"Content-Type":"text/html; charset=utf-8"}});
}
async function proxyRequest(request,kind){
  const input=new URL(request.url).searchParams.get("url");
  let target;
  try{target=checkTarget(input)}catch(e){return fail(e.message)}
  if(!["GET","HEAD","POST"].includes(request.method))return fail("このHTTPメソッドは使えません。",405);
  if(request.method==="POST"&&Number(request.headers.get("content-length")||0)>2000000)return fail("送信データは2MBまでです。",413);
  const headers=new Headers();
  for(const name of ["accept","accept-language","content-type"])if(request.headers.has(name))headers.set(name,request.headers.get(name));
  const method=request.method;
  let body;
  if(method==="POST"){
    const bytes=await request.arrayBuffer();
    if(bytes.byteLength>2000000)return fail("送信データは2MBまでです。",413);
    body=bytes;
  }
  let upstream;
  try{upstream=await fetch(target.toString(),{method,headers,body,redirect:"manual",signal:AbortSignal.timeout(15000)})}
  catch{return fail("接続先から応答がありません。",502)}
  const redirect=upstream.headers.get("location");
  if(redirect&&[301,302,303,307,308].includes(upstream.status)){
    const next=resolveRemote(redirect,target);
    return next?Response.redirect(linkFor(next,kind),302):fail("安全ではないリダイレクト先をブロックしました。",403);
  }
  const responseHeaders=new Headers(COMMON);
  const contentType=upstream.headers.get("content-type")||"application/octet-stream";
  responseHeaders.set("Content-Type",contentType);
  responseHeaders.set("Access-Control-Allow-Origin","null");
  responseHeaders.set("Access-Control-Allow-Credentials","true");
  if(upstream.headers.has("content-disposition"))responseHeaders.set("Content-Disposition","attachment");
  if(method==="HEAD")return new Response(null,{status:upstream.status,headers:responseHeaders});
  if(/\btext\/html\b/i.test(contentType)){
    responseHeaders.set("Content-Type","text/html; charset=utf-8");
    responseHeaders.set("Content-Security-Policy","sandbox allow-scripts allow-forms allow-downloads allow-popups");
    // A string Response re-encodes the decoded source as UTF-8, as required
    // by HTMLRewriter and by the UTF-8 Content-Type sent to the browser.
    const bytes=await upstream.arrayBuffer();
    if(bytes.byteLength>10_000_000)return fail("HTMLが10MBを超えるため表示できません。",413);
    const html=decodeResponseBody(bytes,contentType);
    return rewriterFor(target).transform(new Response(html,{status:upstream.status,headers:responseHeaders}));
  }
  if(/text\/css/i.test(contentType)){
    const bytes=await upstream.arrayBuffer();
    if(bytes.byteLength>10_000_000)return fail("CSSが10MBを超えるため表示できません。",413);
    const css=decodeResponseBody(bytes,contentType);
    responseHeaders.set("Content-Type","text/css; charset=utf-8");
    return new Response(rewriteCss(css,target),{status:upstream.status,headers:responseHeaders});
  }
  return new Response(upstream.body,{status:upstream.status,headers:responseHeaders});
}
export default {async fetch(request){
  const url=new URL(request.url);
  if(url.pathname==="/"&&request.method==="GET")return shell();
  if(url.pathname==="/healthz")return new Response("ok",{headers:{...COMMON,"Content-Type":"text/plain"}});
  if(url.pathname==="/view"||url.pathname==="/asset")return proxyRequest(request,url.pathname.slice(1));
  return fail("このURLはKarin Proxyの機能ではありません。",404);
}};