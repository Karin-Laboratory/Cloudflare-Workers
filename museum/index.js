
const CATS = [
  ["すべて","all","✦"],["デザイン・創作","create","✳"],["便利ツール","tools","↗"],["開発者向け","dev","⌘"],["遊び・実験","play","◉"],["仕事・学習","work","▦"]
];
const REFRESH_HOURS = [0,12];
const BANNED = ["github.com","gist.github.com","youtube.com","youtu.be","twitter.com","x.com","reddit.com","news.ycombinator.com","medium.com","dev.to","linkedin.com","facebook.com","instagram.com","tiktok.com","play.google.com","apps.apple.com","localhost","www.npmjs.com","npmjs.com","chromewebstore.google.com","huggingface.co","pypi.org","softgit.pro","gitlab.com","chrome.google.com"];
const THEMES = {
 "デザイン・創作":{icon:"✳",tone:"rose"},
 "便利ツール":{icon:"↗",tone:"mint"},
 "開発者向け":{icon:"⌘",tone:"lavender"},
 "遊び・実験":{icon:"◉",tone:"yellow"},
 "仕事・学習":{icon:"▦",tone:"sky"},
 "その他":{icon:"✦",tone:"sky"}
};
function safeUrl(raw){
  try{
    const u=new URL(raw);
    const host=u.hostname.toLowerCase();
    if(u.protocol!=="https:"||u.username||u.password||!host.includes(".")||host==="localhost"||
       host.endsWith(".localhost")||host.endsWith(".local")||host.endsWith(".internal")||
       /^\d+(?:\.\d+){3}$/.test(host)||host.startsWith("[")||
       u.port&&u.port!=="443")return "";
    u.hash="";
    for(const p of ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","fbclid","gclid"]){u.searchParams.delete(p);}
    return u.toString();
  }catch{return ""}
}
const escapeHTML=(v)=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function category(text){
 const t=(text||"").toLowerCase();
 if(/draw|paint|design|svg|art|pixel|photo|image|visual|canvas|music|audio|editor|animation|video|sketch|illustrat|カラー|画像/.test(t))return "デザイン・創作";
 if(/game|play|puzzle|retro|simulat|fun|toy|3d|ゲーム|遊|experiment/.test(t))return "遊び・実験";
 if(/api|code|github|program|devtool|json|sql|terminal|debug|deploy|css|html|database|open.source|docker|oss/.test(t))return "開発者向け";
 if(/note|todo|task|calendar|study|learn|productiv|kanban|organize|bookmark|writing|学習|勉強/.test(t))return "仕事・学習";
 return "便利ツール";
}
function isBanned(url){
 try{const h=new URL(url).hostname.toLowerCase();return BANNED.some(b=>h===b||h.endsWith("."+b));}catch{return true}
}
function dateJST(s,withTime=false){
 if(!s)return "—";
 let d=new Date(String(s).includes("T")?s:String(s).replace(" ","T")+"Z");
 if(!Number.isFinite(d.getTime()))return "—";
 return new Intl.DateTimeFormat("ja-JP",{timeZone:"Asia/Tokyo",year:"numeric",month:"short",day:"numeric",...(withTime?{hour:"2-digit",minute:"2-digit"}:{})}).format(d);
}
function uniqueId(s){
 let n=2166136261;
 for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}
 return "a"+(n>>>0).toString(16);
}
async function queryJSON(url,headers){
 const response=await fetch(url,{headers:{"Accept":"application/json",...headers},signal:AbortSignal.timeout(9000)});
 if(!response.ok)throw Error("HTTP "+response.status);
 return response.json();
}

function describeHN(title){
 const t=String(title||"");
 const name=(t.split(/\s+[–—-]\s+|:\s+/)[0]||t).trim().slice(0,65);
 // Every sentence is based only on what the author states in the launch title.
 const ideas=[
 [/privacy|blur|personal data|pii|redact|sensitive/i,"画像やデータのプライバシー保護をテーマにしたツール。"],
 [/puzzle|trivia|quiz|word game|logic game/i,"パズルやクイズをブラウザで楽しむ作品。"],
 [/game|tower defense|platformer|arcade|play /i,"ブラウザで遊ぶゲームやインタラクティブな実験。"],
 [/3d.*museum|virtual museum|art history/i,"ブラウザ内の仮想展示空間を探検する体験。"],
 [/drawing|draw |paint|sketch|illustrat/i,"描いたり表現したりするためのクリエイティブなツール。"],
 [/music|drum|beat|sampler|midi|recording studio|audio/i,"音楽やサウンドを作ったり試したりする作品。"],
 [/video|camera|webcam|streaming|cartoon|tv show/i,"動画や映像を扱うためのアイデアを形にした作品。"],
 [/robot|servo|collision avoidance|robotic/i,"ロボットの動作や制御をテーマにした技術実験。"],
 [/3d|stl|modeling|mesh|webgl|graphics/i,"3Dモデルやグラフィックスを扱うためのツール。"],
 [/api request|http|webhook|api safety|url safety/i,"API通信やリクエスト管理に焦点を当てた開発者向けツール。"],
 [/agent|autonomous|assistant|mcp/i,"AIエージェントの活用や開発を考えるためのプロジェクト。"],
 [/local model|llm|ai model|open router|openrouter/i,"AIモデルを使う方法や新しい利用体験を試す作品。"],
 [/code|coding|typescript|ide|program|terminal|shell/i,"プログラミングや開発環境をより使いやすくするための取り組み。"],
 [/cloud|saas|hosting|deploy|back.?end|server/i,"Webサービスの構築・運用を手助けするためのツール。"],
 [/linux|posix|uefi|docker|container|database|storage/i,"OSやデータ基盤の仕組みを扱う技術寄りの作品。"],
 [/excel|spreadsheet|sheets|table|csv/i,"表データやスプレッドシートの活用に着目したWebツール。"],
 [/security|safe|secure|soc.?2|auth/i,"安全性やセキュリティに着目して作られたサービス。"],
 [/maps?|travel|town|drive|route|navigation|geolocation/i,"地図や場所、移動に関する情報を活用するサービス。"],
 [/calendar|todo|task|organize|plan|reminder/i,"予定や作業を整理するための実用アプリ。"],
 [/study|learn|student|school|practice|skills/i,"学習やスキルアップを支援するためのアイデア。"],
 [/photo|image|picture|compress|jpeg|png/i,"画像を加工・整理するためのクリエイティブツール。"],
 [/browser|extension|tab|bookmark/i,"ブラウザでの作業や情報管理を工夫する小さなツール。"],
 [/search|research|find|knowledge|paper/i,"検索や調査、情報発見を支援するためのツール。"],
 [/email|gmail|mail|inbox|letter/i,"メールやメッセージのやり取りを工夫するための作品。"],
 [/sign|display|screen|font|text|words/i,"文字や画面の見せ方にひと工夫を加える作品。"],
 [/social|community|friend|review/i,"人と人、またはエージェント同士の交流を考えるWebサービス。"],
 [/finance|debt|trading|stocks|money|payment/i,"お金や取引について学んだり管理したりするためのツール。"],
 [/open.source|oss|self.host/i,"オープンソースやセルフホストの可能性を広げるプロジェクト。"],
 [/converter|convert|calculator|format|pdf/i,"面倒な変換や計算を手軽にするための実用ツール。"],
 [/prototype|experiment|chaos|simulation|simulate/i,"思いつきをブラウザで試せる技術デモや実験。"]
 ];
 const match=ideas.find(([re])=>re.test(t));
 if(match)return "「"+name+"」は、"+match[1];
 const parts=t.split(/\s+[–—]\s+|:\s+/);
 if(parts.length>=2&&parts[1].length>10)
   return "「"+parts[0].slice(0,55)+"」は、「"+parts.slice(1).join(" — ").slice(0,115)+"」を掲げて公開された作品。どんな仕組みなのか、気になる一作。";
 return "「"+t.slice(0,110)+"」という着想を持つ新作プロジェクト。詳細は作者のサイトで紹介されています。";
}

async function showHN(){
 const now=Math.floor(Date.now()/1000);
 const params=new URLSearchParams({tags:"show_hn",hitsPerPage:"100",numericFilters:"created_at_i>"+(now-15*86400)});
 const j=await queryJSON("https://hn.algolia.com/api/v1/search_by_date?"+params);
 return (j.hits||[]).filter(x=>/^\s*show hn:/i.test(x.title||"")).map(x=>{
   let url=safeUrl(x.url||""); if(!url||isBanned(url))return null;
   const title=String(x.title||"").replace(/^\s*show hn:\s*/i,"").trim();
   if(title.length<6||title.length>180||/(?:native macos|for windows|for android|download the app|3d.printed robot|macos app|ios app|chrome extension|browser extension|stablecoin payments before)/i.test(title))return null;
   const summary=describeHN(title);
   const published=new Date(x.created_at||Date.now()).toISOString();
   return {id:"hn-"+x.objectID,url,title:title.slice(0,125),description:summary,category:category(title),source:"Show HN",source_url:"https://news.ycombinator.com/item?id="+x.objectID,creator:x.author||"",published_at:published,score:Math.max(0,Math.min(50,x.points||0))};
 }).filter(Boolean).slice(0,80);
}
async function githubApps(){
 const queries=[
  "topic:web-app stars:8..900 created:>2025-01-01",
  "topic:side-project stars:3..500 created:>2025-01-01"
 ];
 const collections=await Promise.allSettled(queries.map(q=>queryJSON("https://api.github.com/search/repositories?"+new URLSearchParams({q,sort:"updated",order:"desc",per_page:"50"}),{"User-Agent":"Karin-Indie-App-Museum","X-GitHub-Api-Version":"2022-11-28"})));
 const errors=[];const list=[];
 collections.forEach((v,i)=>{
   if(v.status==="rejected"){errors.push("GitHub "+(i+1)+": "+String(v.reason));return;}
   for(const x of v.value.items||[]){
    const url=safeUrl(x.homepage||"");
    if(!url||isBanned(url)||x.fork||x.archived||!x.description||!x.name)continue;
    if(/(?:chrome extension|browser extension|npm package|sdk only|cli tool|command.line|cheat.sheet|curated list|awesome.list|a collection of|list of|starter kit|boilerplate|landing.page|template for|mcp server|just a template|download portal|third.party|rights belong to original|scripts that|browser plugin|desktop app)/i.test(x.description+" "+x.name))continue;
    const title=x.name.replace(/[-_]/g," ").slice(0,100);
    const desc=String(x.description).slice(0,240);
    list.push({id:"gh-"+x.id,url,title,description:desc,category:category(title+" "+desc+" "+(x.topics||[]).join(" ")),source:"GitHub",source_url:safeUrl(x.html_url)||"",creator:x.owner?.login||"",published_at:x.created_at||null,score:Math.min(35,Math.round(Math.log2(1+(x.stargazers_count||0))*3))});
   }
 });
 return {list:list.slice(0,90),errors};
}
function metaContent(markup,key){
 for(const tag of markup.match(/<meta\b[^>]*>/gi)||[]){
  const keym=tag.match(/(?:property|name)\s*=\s*(["'])(.*?)\1/i);
  if(!keym||keym[2].toLowerCase()!==key)continue;
  const cm=tag.match(/content\s*=\s*(["'])([\s\S]*?)\1/i);
  if(cm)return cm[2].replace(/&amp;/g,"&").replace(/&quot;/g,'"');
 }return "";
}
async function discoverImage(url){
 try{
  const response=await fetch(url,{headers:{Accept:"text/html,application/xhtml+xml","User-Agent":"Mozilla/5.0 (compatible; KarinMuseumPreview/1.0)"},redirect:"follow",signal:AbortSignal.timeout(5700)});
  if(!response.ok||!(response.headers.get("content-type")||"").toLowerCase().includes("text/html"))return "";
  const html=(await response.text()).slice(0,170000);
  const og=metaContent(html,"og:image")||metaContent(html,"twitter:image");
  const img=og?safeUrl(new URL(og,response.url).toString()):"";
  return img;
 }catch{return ""}
}
async function refresh(env){
 const started=new Date().toISOString();let seen=0,inserted=0,images=0;const errors=[];
 const out=await Promise.allSettled([showHN(),githubApps()]);
 const candidates=[];
 if(out[0].status==="fulfilled")candidates.push(...out[0].value);
 else errors.push("Show HN: "+String(out[0].reason).slice(0,100));
 if(out[1].status==="fulfilled"){candidates.push(...out[1].value.list);errors.push(...out[1].value.errors)}
 else errors.push("GitHub: "+String(out[1].reason).slice(0,100));
 const visited=new Set();
 for(const a of candidates){
  if(visited.has(a.url))continue;visited.add(a.url);seen++;
  try{
   const r=await env.DB.prepare("INSERT OR IGNORE INTO apps (id,url,title,description,category,source,source_url,creator,published_at,featured,score) VALUES (?,?,?,?,?,?,?,?,?,0,?)").bind(a.id,a.url,a.title,a.description,a.category,a.source,a.source_url,a.creator,a.published_at,a.score).run();
   inserted+=r.meta?.changes||0;
  }catch(e){if(errors.length<12)errors.push("DB: "+String(e.message||e).slice(0,75))}
 }
 // Only a few cover requests per update: respects destination sites and keeps within the free tier.
 const coverRows=await env.DB.prepare("SELECT id,url FROM apps WHERE image_url='' ORDER BY featured DESC,discovered_at DESC LIMIT 7").all();
 const found=await Promise.allSettled((coverRows.results||[]).map(async a=>({id:a.id,image:await discoverImage(a.url)})));
 for(const f of found){
  if(f.status!=="fulfilled"||!f.value.image)continue;
  await env.DB.prepare("UPDATE apps SET image_url=? WHERE id=? AND image_url=''").bind(f.value.image,f.value.id).run();images++;
 }
 await env.DB.prepare("UPDATE ingestion SET last_run=?,total_seen=?,inserted=?,images=?,errors=? WHERE id=1").bind(started,seen,inserted,images,errors.join(" | ").slice(0,1000)).run();
 // Keep the front page fresh; preserve the permanent exhibition.
 await env.DB.prepare("DELETE FROM apps WHERE featured=0 AND discovered_at < datetime('now','-120 days')").run();
 return {started,seen,inserted,images,errors};
}
function cover(app,size){
 const theme=THEMES[app.category]||THEMES["その他"];
 const glyph=escapeHTML(theme.icon);
 const host=escapeHTML(new URL(app.url).hostname.replace(/^www\./,""));
 const image=app.image_url?'<img class="cover-image" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+escapeHTML(app.image_url)+'">':"";
 const top='<div class="fake-browser"><span class="dots"><i></i><i></i><i></i></span><span class="fake-url">'+host+'</span></div>';
 return '<div class="artwork tone-'+theme.tone+(size?" art-large":"")+'">'+top+'<div class="art-icon">'+glyph+'</div><div class="art-name">'+escapeHTML(app.title.slice(0,42))+'</div>'+image+'</div>';
}
function card(app,featured=false){
 const isPermanent=app.featured===1;
 const source=escapeHTML(app.source);
 const cardLabel=isPermanent?"常設展示":"新着作品";
 const srcLink=safeUrl(app.source_url)?'<a class="origin" target="_blank" rel="noopener noreferrer" href="'+escapeHTML(app.source_url)+'">出典 ↗</a>':"";
 return '<article class="app-card" data-category="'+escapeHTML(app.category)+'" data-search="'+escapeHTML((app.title+" "+app.description+" "+app.creator).toLowerCase())+'" data-url="'+escapeHTML(app.url)+'">'+
  '<a class="preview" target="_blank" rel="noopener noreferrer" href="'+escapeHTML(app.url)+'" aria-label="'+escapeHTML(app.title)+' を開く">'+cover(app,featured)+'</a>'+
  '<div class="info"><div class="chips"><span class="chip">'+escapeHTML(app.category)+'</span><span class="source">'+source+'</span></div>'+
  '<h3><a target="_blank" rel="noopener noreferrer" href="'+escapeHTML(app.url)+'">'+escapeHTML(app.title)+' <span class="small-arrow">↗</span></a></h3>'+
  '<p class="description">'+escapeHTML(app.description)+'</p><div class="card-footer"><span class="byline">'+(app.creator?"by "+escapeHTML(app.creator):cardLabel)+'</span><span class="card-links">'+srcLink+'<a class="visit" target="_blank" rel="noopener noreferrer" href="'+escapeHTML(app.url)+'">試してみる ↗</a></span></div></div></article>';
}
function render(newApps,curated,stat,total,pageNumber){
 const heroApp=curated[0]||newApps[0];
 const coverHero=heroApp?cover(heroApp,true):'<div class="artwork tone-mint">✦</div>';
 const updated=stat.last_run?dateJST(stat.last_run,true):"初回収集中";
 const pills=CATS.map((c,i)=>'<button type="button" class="filter'+(i===0?' selected':'')+'" data-filter="'+escapeHTML(c[0])+'">'+escapeHTML(c[2])+' '+escapeHTML(c[0])+'</button>').join("");
 const fresh=newApps.map(a=>card(a)).join("");
 const permanent=curated.map(a=>card(a)).join("");
 const hasNew=fresh?fresh:'<div class="empty"><strong>作品を探しに行っています。</strong><p>Show HN と GitHub を巡って、新しいWebアプリを収集中。いまは下の常設展示を楽しんでね。</p></div>';
 return '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta name="description" content="世界の個人開発Webアプリを見て、発見して、実際に試せる。新作アプリを自動発掘する小さなWebアプリ美術館。">'+
  '<meta property="og:title" content="INDIE APP MUSEUM | Karin Lab"><meta property="og:description" content="ブラウザの向こうには、まだ知らない名作がある。">'+
  '<title>INDIE APP MUSEUM | 世界の個人開発Webアプリ美術館</title><style>'+
  '*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f8f6f1;color:#192d30;font-family:system-ui,-apple-system,"Noto Sans JP",sans-serif}a{color:inherit;text-decoration:none}button,input{font:inherit}.wrap{max-width:1296px;padding:0 34px;margin:auto}.nav{height:84px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e3e0d7}.brand{font-size:17px;font-weight:900;letter-spacing:-.045em;display:flex;align-items:center;gap:12px}.seal{width:38px;height:38px;border-radius:12px;background:#192f32;color:#e8fded;display:grid;place-items:center;font-size:23px;transform:rotate(-7deg)}.nav-right{display:flex;align-items:center;gap:18px;font-size:12px;color:#687875}.nav-right a:hover{color:#e25b3a}.live{display:flex;align-items:center;gap:7px}.live:before{content:"";width:8px;height:8px;background:#45bd87;border-radius:50%;box-shadow:0 0 0 4px #dcf1e6}.intro{display:grid;grid-template-columns:1.04fr 1fr;gap:68px;align-items:center;padding:85px 0 86px}.eyebrow{font-weight:900;letter-spacing:.18em;font-size:12px;color:#d7553a}.intro h1{font-size:clamp(48px,6vw,86px);line-height:1.08;letter-spacing:-.095em;margin:20px 0 29px;font-weight:900}.intro h1 em{font-style:normal;color:#f26843}.lede{max-width:475px;font-size:16px;line-height:2.1;color:#61716b;margin:0}.badges{display:flex;flex-wrap:wrap;gap:13px;margin-top:35px;font-size:12px;color:#50645f}.badges span{border:1px solid #e0dfd6;border-radius:999px;padding:9px 13px;background:#fffdf8}.intro-right{position:relative}.intro-right .artwork{aspect-ratio:1.3;border-radius:20px;box-shadow:24px 26px 0 #e2dfd6}.hero-caption{display:flex;justify-content:space-between;padding-top:14px;font-size:12px;color:#77847d}.section{padding-top:24px;padding-bottom:74px}.section-head{display:flex;gap:20px;align-items:end;justify-content:space-between;margin-bottom:25px}.number{font-size:12px;color:#ed724a;font-weight:800;letter-spacing:.12em}.section-head h2{font-size:clamp(25px,3.8vw,38px);letter-spacing:-.065em;margin:8px 0 0}.section-desc{color:#76847d;font-size:12px;max-width:300px;text-align:right;line-height:1.8}.divider{height:1px;background:#dedcd3;margin-bottom:26px}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:23px}.app-card{min-width:0;border-radius:16px;background:white;border:1px solid #e6e3db;overflow:hidden;transition:transform .22s,box-shadow .22s}.app-card:hover{transform:translateY(-5px);box-shadow:0 16px 35px #20312a13}.preview{display:block;padding:13px 13px 0}.artwork{position:relative;aspect-ratio:1.45;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-direction:column;border:1px solid #0000000d}.tone-rose{background:radial-gradient(circle at 75% 72%,#f5ab9f,transparent 40%),linear-gradient(115deg,#fce3df,#d1cfed)}.tone-mint{background:radial-gradient(circle at 28% 68%,#8fe5c5,transparent 45%),linear-gradient(130deg,#d6f5e8,#d6e5df)}.tone-lavender{background:radial-gradient(circle at 75% 72%,#aabdfb,transparent 40%),linear-gradient(145deg,#e6e5fc,#dcd2f4)}.tone-yellow{background:radial-gradient(circle at 22% 68%,#fbc66e,transparent 45%),linear-gradient(135deg,#ffefd0,#f3deb5)}.tone-sky{background:radial-gradient(circle at 80% 70%,#b5dbee,transparent 40%),linear-gradient(120deg,#e5f2f7,#d5e8ed)}.fake-browser{position:absolute;z-index:1;left:14px;right:14px;top:13px;height:31px;border-radius:9px;background:#ffffffad;display:flex;align-items:center;gap:12px;padding:0 11px;box-shadow:0 3px 14px #2030260d}.fake-url{font-size:10px;color:#55706c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dots{display:flex;gap:4px}.dots i{width:5px;height:5px;background:#aaa9a1;border-radius:50%}.dots i:first-child{background:#f17f73}.dots i:nth-child(2){background:#f5bd72}.dots i:nth-child(3){background:#83c6a3}.art-icon{font-family:Georgia,serif;line-height:1;font-size:clamp(80px,9vw,130px);color:#17333629;transform:rotate(-13deg);font-weight:900}.art-name{position:absolute;bottom:17px;left:20px;right:20px;color:#1d393c9e;font-weight:900;letter-spacing:-.04em;font-size:clamp(19px,2.5vw,31px);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.cover-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;color:transparent}.info{padding:20px 21px 19px}.chips{display:flex;align-items:center;gap:9px;font-size:11px;color:#75847e}.chip{background:#eef5ee;color:#37695a;border-radius:5px;padding:5px 8px;font-weight:700}.app-card h3{font-size:20px;letter-spacing:-.04em;line-height:1.5;margin:14px 0 10px}.app-card h3 a:hover{color:#ea6844}.small-arrow{font-size:13px;color:#e97953}.description{font-size:13px;color:#708078;line-height:1.9;min-height:72px;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.card-footer{margin-top:17px;padding-top:13px;border-top:1px solid #e9ebe5;display:flex;align-items:center;justify-content:space-between;gap:9px}.byline{font-size:11px;color:#8a9991;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.card-links{display:flex;gap:12px;align-items:center;white-space:nowrap}.origin{font-size:11px;color:#84958c}.visit{font-weight:800;color:#dd5a3e;font-size:11px}.toolsbar{display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:25px}.filters{display:flex;gap:7px;flex-wrap:wrap}.filter{border:1px solid #dedbd1;background:#fffdf8;color:#65736c;border-radius:30px;padding:10px 13px;cursor:pointer;font-size:12px}.filter.selected{background:#263a38;border-color:#263a38;color:white}.search{border:1px solid #dddcd3;background:white;padding:11px 14px;border-radius:30px;width:214px;outline:none;font-size:12px}.search:focus{border-color:#ed8665}.empty{grid-column:1/-1;border:1px dashed #d2d0c7;border-radius:15px;padding:36px;color:#566c64;line-height:1.8;background:#fffdfa}.empty p{margin:7px 0 0;font-size:13px}.browse-more{display:flex;justify-content:center;padding:36px 0 0}.browse-more a{padding:12px 25px;border:1px solid #afbdb2;border-radius:30px;font-weight:700;font-size:13px}.permanent{background:#f0eee7;padding:55px 0 70px;margin-top:10px}.permanent .app-card{background:#fffcf6}.footer{padding:44px 0 55px;display:flex;align-items:start;justify-content:space-between;gap:22px;color:#687b73;font-size:12px;line-height:2}.footer strong{font-weight:900;color:#213832;font-size:16px}.footer small{display:block;max-width:730px}.actions{display:flex;gap:14px;flex-wrap:wrap;align-items:center}.random{border:0;background:#f26843;color:white;font-weight:800;padding:13px 17px;border-radius:999px;cursor:pointer}.random:hover{background:#d45234}.hidden{display:none!important}#filter-empty{display:none}@media(max-width:1000px){.intro{gap:30px}.gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.wrap{padding:0 19px}.nav{height:68px}.brand{font-size:15px}.nav-right .extra{display:none}.intro{grid-template-columns:1fr;padding:44px 0 56px;gap:34px}.intro h1{font-size:52px}.intro-right .artwork{aspect-ratio:1.7;box-shadow:12px 12px 0 #e2dfd6}.gallery{grid-template-columns:1fr;gap:15px}.section{padding-bottom:40px}.section-head{display:block}.section-desc{text-align:left;margin:10px 0 0}.search{width:100%}.toolsbar{align-items:stretch}.footer{display:block}.footer .actions{margin-top:15px}.art-icon{font-size:120px}.art-name{font-size:27px}}'+
  '</style></head><body><header class="wrap nav"><a class="brand" href="/"><span class="seal">✳</span><span>INDIE APP MUSEUM</span></a><div class="nav-right"><span class="live">自動発掘中</span><a class="extra" href="#latest">新着展示</a><a class="extra" href="#collection">常設展示</a></div></header>'+
  '<section class="wrap intro"><div><div class="eyebrow">THE INTERNET IS STILL WONDERFUL.</div><h1>インターネットは、<br>まだまだ<em>面白い。</em></h1><p class="lede">世界のどこかで、誰かがつくった小さなWebアプリ。名前も知らなかった作品に出会って、そのままブラウザで遊べる。ここは、個人開発の小さな美術館。</p><div class="badges"><span>✦ 見るだけで楽しい</span><span>⌘ 作品サイトへ直接アクセス</span><span>◷ 毎日 朝・夜に更新</span></div></div>'+
  '<div class="intro-right">'+coverHero+'<div class="hero-caption"><span>FEATURED FROM OUR PERMANENT COLLECTION</span><span>EST. 2026</span></div></div></section>'+
  '<section class="wrap section" id="latest"><div class="divider"></div><div class="section-head"><div><span class="number">01 / FRESH FINDS</span><h2>新しく見つけた作品たち。</h2></div><div class="section-desc">Show HNとGitHubから自動で収集。<br>最終更新：'+escapeHTML(updated)+'（日本時間）<br>自動発見 '+total+' 作品</div></div>'+
  '<div class="toolsbar"><div class="filters">'+pills+'</div><input class="search" id="search" type="search" placeholder="このページの作品を探す…" aria-label="作品を絞り込む"></div>'+
  '<div class="gallery" id="fresh-gallery">'+hasNew+'</div><div id="filter-empty" class="empty">この条件に合う作品は、このページにはありません。</div>'+
  (newApps.length===24?'<div class="browse-more"><a href="/?page='+(pageNumber+1)+'#latest">もっと作品を見る ↗</a></div>':"")+
  '</section><section class="permanent" id="collection"><div class="wrap"><div class="section-head"><div><span class="number">02 / PERMANENT COLLECTION</span><h2>何度でも遊びたい名作。</h2></div><div class="section-desc">まずはここから。長く愛されている、ブラウザで試せる7作品。</div></div><div class="gallery">'+permanent+'</div></div></section>'+
  '<footer class="wrap footer"><div><strong>✳ INDIE APP MUSEUM</strong><small>Made by Karin Lab · 作品名・説明・リンクを掲載。各作品の権利は開発者に帰属します。<br>紹介作品は外部サイトです。利用条件・プライバシー・料金は訪問先でご確認ください。<br>自動発見は「個人開発」を保証するものではありません。情報は公開ソースに基づきます。</small></div><div class="actions"><button class="random" id="random" type="button">✦ ランダムに1作品</button><a href="https://karin-lab.com/" rel="noopener noreferrer" target="_blank">Karin Lab ↗</a></div></footer>'+
  '<script>(function(){const filters=Array.from(document.querySelectorAll(".filter"));const cards=Array.from(document.querySelectorAll(".app-card"));const search=document.getElementById("search");const empty=document.getElementById("filter-empty");let active="すべて";function update(){const term=search.value.trim().toLowerCase();let visible=0;cards.forEach(x=>{const pass=(active==="すべて"||x.dataset.category===active)&&(!term||x.dataset.search.includes(term));x.classList.toggle("hidden",!pass);if(pass)visible++});empty.style.display=visible?"none":"block"}filters.forEach(btn=>btn.addEventListener("click",()=>{active=btn.dataset.filter;filters.forEach(x=>x.classList.toggle("selected",x===btn));update()}));search.addEventListener("input",update);document.getElementById("random").addEventListener("click",()=>{const pool=cards.filter(x=>!x.classList.contains("hidden"));if(!pool.length)return;const x=pool[Math.floor(Math.random()*pool.length)];window.open(x.dataset.url,"_blank","noopener,noreferrer")})})();</script></body></html>';
}
const karinOriginalWorker = {
 async fetch(request,env,ctx){
  const u=new URL(request.url);
  if(u.pathname==="/healthz"){
   const meta=await env.DB.prepare("SELECT * FROM ingestion WHERE id=1").first();
   const nums=await env.DB.prepare("SELECT count(*) AS all_apps,sum(CASE WHEN featured=0 THEN 1 ELSE 0 END) AS discovered FROM apps").first();
   return Response.json({ok:true,apps:nums.all_apps,discovered:nums.discovered,last_run:meta.last_run,last_inserted:meta.inserted,last_seen:meta.total_seen,images_added:meta.images,errors:meta.errors},{headers:{"Cache-Control":"no-store"}});
  }
  if(u.pathname==="/api/apps"){
   const list=await env.DB.prepare("SELECT url,title,description,category,source,source_url,image_url,creator,published_at,discovered_at,featured FROM apps ORDER BY featured ASC,COALESCE(published_at,discovered_at) DESC LIMIT 100").all();
   return Response.json({apps:list.results},{headers:{"Cache-Control":"public,max-age=300","Access-Control-Allow-Origin":"*"}});
  }
  if(u.pathname!=="/")return new Response("Not found",{status:404});
  const pageNumber=Math.max(0,Math.min(20,Number.parseInt(u.searchParams.get("page")||"0")||0));
  const [st,newRows,curated,count]=await Promise.all([
   env.DB.prepare("SELECT * FROM ingestion WHERE id=1").first(),
   env.DB.prepare("SELECT * FROM apps WHERE featured=0 ORDER BY COALESCE(published_at,discovered_at) DESC LIMIT 24 OFFSET ?").bind(pageNumber*24).all(),
   env.DB.prepare("SELECT * FROM apps WHERE featured=1 ORDER BY score DESC,title ASC").all(),
   env.DB.prepare("SELECT COUNT(*) as n FROM apps WHERE featured=0").first()
  ]);
  if(!st?.last_run)ctx.waitUntil(refresh(env));
  return new Response(render(newRows.results||[],curated.results||[],st||{},count.n||0,pageNumber),{
   headers:{"Content-Type":"text/html;charset=UTF-8","Cache-Control":"public,max-age=120","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","Content-Security-Policy":"default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}
  });
 },
 async scheduled(event,env,ctx){ctx.waitUntil(refresh(env))}
};

import { WorkerEntrypoint } from "cloudflare:workers";
export class CronRunner extends WorkerEntrypoint {
  ping() {return {ok:true,service:"karin-indie-app-museum",rpc:"CronRunner"};}
  async runCron(){await refresh(this.env);return {ok:true,service:"karin-indie-app-museum"};}
}

const KARIN_FAVICON_SVG="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"g\"><stop stop-color=\"#79529d\"/><stop offset=\"1\" stop-color=\"#dcb3fa\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"15\" fill=\"url(#g)\"/><g stroke=\"#fff\" stroke-width=\"3.2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M13 25l19-11 19 11 M17 25h30 M20 26v20 M29 26v20 M38 26v20 M47 26v20 M13 49h38\"/></g></svg>";
export default {...karinOriginalWorker,async fetch(request,env,ctx){const pathname=new URL(request.url).pathname;if(pathname==='/favicon.svg')return new Response(KARIN_FAVICON_SVG,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public,max-age=86400','x-content-type-options':'nosniff'}});if(pathname==='/favicon.ico')return Response.redirect(new URL('/favicon.svg',request.url),302);const response=await karinOriginalWorker.fetch(request,env,ctx);if(response.status===200&&!response.webSocket&&(response.headers.get('content-type')||'').toLowerCase().includes('text/html'))return new HTMLRewriter().on('head',{element(el){el.append('<link rel="icon" href="/favicon.svg" type="image/svg+xml">',{html:true})}}).transform(response);return response;}};