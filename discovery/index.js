
const FEEDS=[
["Zenn 新着","https://zenn.dev/feed"],
["Qiita Linux","https://qiita.com/tags/linux/feed"],
["Qiita Raspberry Pi","https://qiita.com/tags/raspberrypi/feed"],
["Qiita 自作","https://qiita.com/tags/自作/feed"],
["はてな IT","https://b.hatena.ne.jp/hotentry/it.rss"]
];
const TOPICS=[
["ハードウェア","raspberry|arduino|esp32|マイコン|電子工作|基板|チューナ|ファームウェア|シリアル|uart|usb|自作pc|ルーター|router|ハードウェア|ジャンク|改造|分解|中古|gpio|sdr|openwrt"],
["Linux・サーバ","linux|debian|ubuntu|proxmox|サーバ|nas|docker|仮想化|homelab|セルフホスト|セルフホスティング"],
["個人開発・OSS","個人開発|自作アプリ|作ってみた|開発してみた|オープンソース|github|oss|webアプリ|公開しました|作りました|リリース"],
["クラウド・AI","cloudflare|workers|無料枠|無料vps|oci|自宅サーバ|ローカルllm|llama.cpp|ollama|生成ai|llm"]
];
const entity=(s)=>String(s||"").replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&");
const clean=(s)=>entity(String(s||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim());
const tag=(xml,n)=>{const m=xml.match(new RegExp("<(?:[\\w.-]+:)?"+n+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?"+n+">","i"));return m?m[1]:""};
function parse(xml,source) {
 const atom=/<entry(?:\s[^>]*)?>/i.test(xml),re=atom?/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi:/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi;
 const found=xml.match(re)||[];
 return found.slice(0,55).map(item=>{
 let link=clean(tag(item,"link"));
 if(atom){const m=item.match(/<link\b[^>]*href=["']([^"']+)["']/i);link=m?entity(m[1]):link}
 const title=clean(tag(item,"title"));
 const summary=clean(tag(item,"description")||tag(item,"summary")||tag(item,"content"));
 const pub=clean(tag(item,"pubDate")||tag(item,"published")||tag(item,"updated")||tag(item,"date"));
 let published=new Date(pub);
 if(isNaN(published.getTime()))published=new Date();
 const content=(title+" "+summary).toLowerCase();
 const group=TOPICS.map(([label,re])=>({label,points:(content.match(new RegExp(re,"gi"))||[]).length})).sort((a,b)=>b.points-a.points)[0];
 const japan=(title.match(/[ぁ-んァ-ヶ一-龠]/g)||[]).length>=3;
 const age=(Date.now()-published.getTime())/86400000;
 let score=group.points*3+(title.match(/作っ|公開|改造|実験|自作|復活|できた|やってみ|検証|開発/g)||[]).length*2;
 if(!japan||!group.points||score<3||age>35||age< -1||!/^https:\/\//i.test(link))return null;
 return {title:title.slice(0,170),url:link,summary:summary.slice(0,230),source,category:group.label,published:published.toISOString(),score};
 }).filter(Boolean);
}
async function collect(env) {
 let total=0,inserted=0,errors=[];
 for(const [name,url] of FEEDS) {
  try{
   const response=await fetch(url,{headers:{"User-Agent":"KarinDiscovery/1.0 (RSS reader; public links only)","Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml"},signal:AbortSignal.timeout(9500)});
   if(!response.ok)throw Error("HTTP "+response.status);
   const xml=await response.text();
   const articles=parse(xml,name); total+=articles.length;
   for(const a of articles){
    const r=await env.DB.prepare("INSERT OR IGNORE INTO articles(url,title,summary,source,category,published,score) VALUES (?,?,?,?,?,?,?)").bind(a.url,a.title,a.summary,a.source,a.category,a.published,a.score).run();
    inserted+=(r.meta.changes||0);
   }
  }catch(e){errors.push(name+": "+String(e.message||e).slice(0,100))}
 }
 await env.DB.prepare("UPDATE status SET last_run=?,fetched=?,inserted=?,errors=? WHERE id=1").bind(new Date().toISOString(),total,inserted,errors.join("; ")).run();
 await env.DB.prepare("DELETE FROM articles WHERE published < ?").bind(new Date(Date.now()-45*86400000).toISOString()).run();
 return {total,inserted,errors};
}
const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function datejp(v){return new Intl.DateTimeFormat("ja-JP",{timeZone:"Asia/Tokyo",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v))}
function page(rows,status,selected,pageNum) {
const categories=["すべて",...TOPICS.map(x=>x[0])];
const count=rows.length;
const cards=rows.map((a,i)=>'<article class="story"><div class="meta"><span class="category">'+esc(a.category)+'</span><span>'+esc(a.source)+'</span><span>'+esc(datejp(a.published))+'</span></div><a href="'+esc(a.url)+'" target="_blank" rel="noopener noreferrer" class="headline">'+esc(a.title)+' <span class="out">↗</span></a><p>'+esc(a.summary.slice(0,145))+'</p></article>').join("");
return '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="日本語の個人開発、ハードウェア改造、Linux、OSS、無料クラウドの記事を毎日朝夕に自動収集。"><title>KARIN DISCOVERY | 個人開発と技術実験の発見</title><style>'+
':root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0b1118;color:#f2f5fa;font-family:system-ui,-apple-system,"Noto Sans JP",sans-serif}a{color:inherit;text-decoration:none}.shell{max-width:1160px;margin:auto;padding:0 25px}.top{border-bottom:1px solid #27333e;background:#0d151e}.nav{display:flex;align-items:center;justify-content:space-between;padding-top:23px;padding-bottom:23px;gap:12px}.brand{font-weight:850;letter-spacing:.09em;font-size:19px}.brand b{color:#54d6ac}.nav small{color:#95a7b8}.hero{padding-top:70px;padding-bottom:54px;background:radial-gradient(ellipse at 73% 38%,#0f3935 0%,transparent 44%)}.eyebrow{font-size:12px;letter-spacing:.2em;color:#62ddae;font-weight:700}.hero h1{font-size:clamp(32px,5vw,60px);line-height:1.32;letter-spacing:-.035em;margin:16px 0 18px}.hero p{font-size:16px;color:#afbac6;line-height:2;max-width:680px}.stats{display:flex;flex-wrap:wrap;gap:20px;color:#acbbc5;font-size:13px;margin-top:26px}.stats strong{color:#6ee7bc}.dot{display:inline-block;width:8px;height:8px;background:#5fe7b7;border-radius:50%;margin-right:7px}.content{padding-top:27px;padding-bottom:90px}.sectionhead{display:flex;align-items:end;justify-content:space-between;gap:10px}.sectionhead h2{font-size:22px;margin:0 0 15px}.sectionhead span{font-size:12px;color:#91a4b5}.tabs{display:flex;overflow:auto;gap:8px;padding:7px 0 25px}.tabs a{white-space:nowrap;border:1px solid #344451;background:#101a24;border-radius:20px;padding:9px 14px;font-size:13px;color:#adbac7}.tabs a.on{background:#36c995;color:#06221b;border-color:#36c995;font-weight:750}.stories{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.story{border:1px solid #293745;border-radius:16px;background:#111c27;padding:23px;min-height:220px;transition:background .15s,border-color .15s}.story:hover{border-color:#54cdaa;background:#162633}.meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:11px;color:#8fa3b4}.category{background:#19382f;color:#7be9bb;padding:5px 8px;border-radius:6px}.headline{display:block;font-weight:740;font-size:19px;line-height:1.55;margin:14px 0}.headline:hover{color:#83e5c3}.out{color:#5bd4aa;font-size:14px}.story p{color:#99aab9;line-height:1.8;font-size:13px;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.empty{border:1px solid #30414b;border-radius:14px;padding:40px;color:#a9b7c5;grid-column:1/-1}.more{text-align:center;margin:30px}.more a{display:inline-block;border:1px solid #435466;padding:12px 25px;border-radius:9px}footer{border-top:1px solid #293745;padding:35px 0;color:#7f93a4;font-size:12px;line-height:2}.notice{color:#91a4b5;font-size:12px;padding-bottom:14px}@media(max-width:700px){.stories{grid-template-columns:1fr}.hero{padding-top:40px;padding-bottom:30px}.story{min-height:unset}.shell{padding-left:18px;padding-right:18px}.nav small{display:none}}'+
'</style></head><body><header class="top"><div class="shell nav"><a class="brand" href="/"><b>◉</b> KARIN DISCOVERY</a><small>日本語の個人開発・技術実験を発見する</small></div></header><div class="hero"><div class="shell"><div class="eyebrow">EXPLORE THE UNEXPECTED</div><h1>誰かの「作ってみた」が、<br>今日の発見になる。</h1><p>世界を変えるのは、大企業の新製品だけじゃない。古い機械の復活、週末の個人開発、遊び心から生まれた技術実験。日本語の記事だけを集める、小さな発見のポータル。</p><div class="stats"><span><i class="dot"></i>毎日 9:00 / 21:00 更新（日本時間）</span><span>最終収集 <strong>'+esc(status?.last_run?datejp(status.last_run):"初回収集待ち")+'</strong></span></div></div></div><main class="shell content"><div class="sectionhead"><h2>新着の発見 <span> / Latest discoveries</span></h2><span>新着順 · '+count+'件を表示</span></div><nav class="tabs">'+categories.map(c=>'<a class="'+(selected===c?"on":"")+'" href="/?category='+encodeURIComponent(c)+'">'+esc(c)+'</a>').join("")+'</nav><div class="stories">'+(cards||'<div class="empty">現在、記事を収集しています。初回収集の後に新着記事が表示されます。少ししてから再読み込みしてください。</div>')+'</div>'+(count===30?'<div class="more"><a href="/?category='+encodeURIComponent(selected)+'&page='+(pageNum+1)+'">さらに読む →</a></div>':"")+'</main><footer><div class="shell">KARIN DISCOVERY · karin-lab.com<br>各記事の著作権は原著作者に帰属します。タイトル・短い抜粋を掲載し、全文はリンク先でお読みいただけます。<br>自動収集 / 日本語記事限定 / 最新記事順 / 1日2回更新</div></footer></body></html>';
}
const karinOriginalWorker = {
 async fetch(request,env,ctx){
  const u=new URL(request.url);
  if(u.pathname==="/healthz"){
   const st=await env.DB.prepare("SELECT * FROM status WHERE id=1").first();
   const n=await env.DB.prepare("SELECT COUNT(*) n FROM articles").first();
   return Response.json({ok:true,articles:n.n,last_run:st?.last_run,added_last_run:st?.inserted,errors:st?.errors});
  }
  if(u.pathname==="/api/articles"){
   const rows=await env.DB.prepare("SELECT title,url,summary,source,category,published FROM articles ORDER BY published DESC LIMIT 50").all();
   return Response.json(rows.results,{headers:{"Access-Control-Allow-Origin":"*","Cache-Control":"public,max-age=300"}});
  }
  if(u.pathname!=="/")return new Response("Not found",{status:404});
  const category=TOPICS.some(x=>x[0]===u.searchParams.get("category"))?u.searchParams.get("category"):"すべて";
  const pageNum=Math.min(30,Math.max(0,parseInt(u.searchParams.get("page")||"0")||0));
  const st=await env.DB.prepare("SELECT * FROM status WHERE id=1").first();
  if(!st?.last_run)ctx.waitUntil(collect(env));
  const query=category==="すべて"?"SELECT * FROM articles ORDER BY published DESC LIMIT 30 OFFSET ?":"SELECT * FROM articles WHERE category=? ORDER BY published DESC LIMIT 30 OFFSET ?";
  const stmt=env.DB.prepare(query),params=category==="すべて"?[pageNum*30]:[category,pageNum*30];
  const rows=await stmt.bind(...params).all();
  return new Response(page(rows.results,st,category,pageNum),{headers:{"Content-Type":"text/html;charset=UTF-8","Cache-Control":"public,max-age=120","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin"}});
 },
 async scheduled(event,env,ctx){ctx.waitUntil(collect(env))}
};

import { WorkerEntrypoint } from "cloudflare:workers";
export class CronRunner extends WorkerEntrypoint {
  ping() {return {ok:true,service:"karin-discovery",rpc:"CronRunner"};}
  async runCron(){await collect(this.env);return {ok:true,service:"karin-discovery"};}
}

const KARIN_FAVICON_SVG="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"g\"><stop stop-color=\"#186a63\"/><stop offset=\"1\" stop-color=\"#67e0bd\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"15\" fill=\"url(#g)\"/><g stroke=\"#fff\" stroke-width=\"3.2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M51 32a19 19 0 1 1-38 0 19 19 0 0 1 38 0z M38 26l-6 19-6-13z M32 10v5 M32 49v5\"/></g></svg>";
export default {...karinOriginalWorker,async fetch(request,env,ctx){const pathname=new URL(request.url).pathname;if(pathname==='/favicon.svg')return new Response(KARIN_FAVICON_SVG,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public,max-age=86400','x-content-type-options':'nosniff'}});if(pathname==='/favicon.ico')return Response.redirect(new URL('/favicon.svg',request.url),302);const response=await karinOriginalWorker.fetch(request,env,ctx);if(response.status===200&&!response.webSocket&&(response.headers.get('content-type')||'').toLowerCase().includes('text/html'))return new HTMLRewriter().on('head',{element(el){el.append('<link rel="icon" href="/favicon.svg" type="image/svg+xml">',{html:true})}}).transform(response);return response;}};