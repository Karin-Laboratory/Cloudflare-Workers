
const CSS="\n:root{color-scheme:dark;--bg:#111419;--panel:#191e26;--muted:#8994a5;--text:#dfe5ee;--accent:#c5a87a;--line:#2a313c;font-family:Inter,-apple-system,BlinkMacSystemFont,\"Noto Sans JP\",sans-serif;background:var(--bg);color:var(--text)}*{box-sizing:border-box}\nbody{margin:0;background:linear-gradient(180deg,#141920,#111419 360px);min-height:100vh;font-size:13px;line-height:1.55}\na{color:inherit;text-decoration:none}a:hover{color:#eccb96}button,input{font:inherit}button{cursor:pointer}\n.shell{max-width:1530px;margin:auto;padding:23px 26px 60px}\n.top{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line);padding-bottom:18px;flex-wrap:wrap}\n.logo{font-size:23px;font-weight:800;letter-spacing:-.055em}.logo span{color:var(--accent)}.subtitle{color:#6d798a;font-size:10px;letter-spacing:.17em;text-transform:uppercase;font-family:ui-monospace,Consolas,monospace;margin-left:10px}\n.topnav{display:flex;align-items:center;gap:21px;color:#9faaba;font-weight:700}.topnav a{padding:8px 1px}.topnav .on{color:#e7bf82;border-bottom:2px solid #d3b182}\n.hero{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;padding:28px 0}\n.hello{font-size:30px;font-weight:740;letter-spacing:-.035em}.hero p{margin:5px 0 0;color:#8b98a9}.date{color:#a9b6c5;font-size:13px;text-align:right}\n.searchform{display:flex;align-items:center;gap:0;max-width:410px;min-width:200px;width:100%;border:1px solid #39404b;background:#1b212a;border-radius:7px;overflow:hidden}\n.searchform input{min-width:0;width:100%;background:none;border:0;color:#eef3ff;padding:12px 15px;outline:0}\n.searchform button{background:#bfa176;border:0;color:#111419;padding:12px 17px;font-weight:800}\n.layout{display:grid;grid-template-columns:minmax(195px,.85fr) minmax(370px,2fr) minmax(220px,1fr);align-items:start;gap:24px}\n.col{min-width:0;display:flex;flex-direction:column;gap:24px}.widget{background:transparent;min-width:0}.widget-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:10px;border-bottom:1px solid #343c49;margin-bottom:10px}\n.widget-head h2{font-size:12px;letter-spacing:.13em;text-transform:uppercase;font-weight:750;color:#d3b486;margin:0}\n.widget-head .src{font-size:11px;color:#8995a7;font-weight:500}.widget-head .src:hover{color:#e4c18c}\n.list{margin:0;padding:0;list-style:none}.article{padding:11px 0;border-bottom:1px solid #232c35}.article:last-child{border:0}.article a{font-size:13px;display:block;font-weight:640;line-height:1.5;overflow-wrap:anywhere}.meta{display:flex;flex-wrap:wrap;gap:9px;font-size:10px;color:#8390a0;margin-top:6px}.tag{font-size:10px;color:#e1bd84;background:#50412b78;padding:1px 6px;border-radius:4px}.empty{padding:17px 8px;color:#7e8b9b;line-height:1.8;background:#1c222a;border-radius:5px}\n.links{display:grid;grid-template-columns:1fr 1fr;gap:8px}.links a{border:1px solid #303844;background:#1a2028;border-radius:7px;padding:10px;display:flex;align-items:center;gap:8px;font-weight:650;font-size:12px;min-width:0}.links a:hover{border-color:#a98e66}.links .icon{font-size:16px}\n.weather{padding:14px 13px 12px;border:1px solid #303844;background:#1a2029;border-radius:8px}.weather-top{display:flex;gap:10px;align-items:center;justify-content:space-between}.weather-temp{font-size:34px;font-weight:760;letter-spacing:-.06em}.weather-ico{font-size:35px}.weather-note{color:#a1adbd;margin-top:5px}.forecast{margin-top:13px;display:flex;justify-content:space-between;border-top:1px solid #303944;padding-top:10px;gap:8px;font-size:11px;color:#a3b0bf}\n.month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center}.month-grid span,.month-grid a{font-size:11px;display:grid;place-items:center;height:27px;border-radius:5px;color:#b6c3d2}.month-grid .weekday{color:#738397;font-size:10px}.month-grid .blank{opacity:.2}.month-grid .today{background:#c5a87a;color:#101820;font-weight:900}.month-title{font-size:13px;font-weight:700;margin-bottom:7px}\n.statrow{display:flex;gap:8px;justify-content:space-between;padding:9px 0;border-bottom:1px solid #26303a;font-size:12px}.statrow strong{font-weight:650}.statrow span{color:#9daabd}.statrow a{color:#dbc092}\n.feed-pill{font-size:11px;color:#aebcca;background:#212933;padding:4px 8px;border-radius:5px;border:1px solid #333c47;display:inline-block;margin:2px 4px 2px 0}\n.hnnumber{font:11px ui-monospace,Consolas,monospace;color:#8b94a2;width:17px;flex-shrink:0}\n.hnitem{display:flex;gap:9px;align-items:flex-start}.small-description{font-size:11px;color:#8a98a9}\n.footer{margin-top:43px;border-top:1px solid #313b46;padding-top:20px;display:flex;align-items:start;justify-content:space-between;gap:16px;flex-wrap:wrap;font-size:11px;color:#778697;line-height:1.8}\n.footer a{text-decoration:underline;text-decoration-color:#495262}\n.notice{padding:10px 12px;background:#28261e;border-left:3px solid #b79a61;color:#c4b69b;margin:0 0 23px;font-size:12px}\n@media(max-width:1070px){.layout{grid-template-columns:minmax(180px,.85fr) minmax(345px,2fr)}.layout .col.right{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}}\n@media(max-width:700px){.shell{padding:17px 15px 40px}.subtitle{display:none}.topnav{gap:14px}.hero{padding:21px 0}.hello{font-size:26px}.date{text-align:left}.searchform{max-width:none}.layout{display:flex;flex-direction:column;gap:25px}.col{width:100%;gap:23px}.col.right{display:flex!important}.links{grid-template-columns:repeat(2,1fr)}}\n";
const FEEDS=[
 {id:'publickey',label:'Publickey',url:'https://www.publickey1.jp/atom.xml',limit:8},
 {id:'gigazine',label:'GIGAZINE',url:'https://gigazine.net/news/rss_2.0/',limit:9},
 {id:'itmedia',label:'ITmedia NEWS',url:'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',limit:8}
];
const LAB=[
 ['🛰️','Karin Radar','https://radar.karin-lab.com/'],['🗓️','Calendar','https://calendar.karin-lab.com/'],['🗂️','MyKeep','https://mykeep.karin-lab.com/'],['📰','Karin Daily','https://daily.karin-lab.com/'],['🔍','Karin Search','https://search.karin-lab.com/'],['💬','Karin Chat','https://chat.karin-lab.com/'],['📦','Uploader','https://upload.karin-lab.com/'],['⚙️','n8n','https://n8n.karin-lab.com/']
];
const BOOKMARKS=[['💻','GitHub','https://github.com/'],['🔴','5ちゃんねる','https://5ch.net/'],['📰','note','https://note.com/'],['📡','Hacker News','https://news.ycombinator.com/'],['🐧','OpenWrt','https://openwrt.org/'],['☁️','Cloudflare','https://dash.cloudflare.com/']];
const HTML_ESCAPE={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const h=(v)=>String(v==null?'':v).replace(/[&<>"']/g,c=>HTML_ESCAPE[c]);
const safeUrl=(v)=>{try{let u=new URL(String(v).trim());return /^https?:$/.test(u.protocol)?u.href:'#'}catch{return '#'}};
const truncate=(v,n=145)=>{let a=String(v||'').trim();return a.length>n?a.slice(0,n)+'…':a};
const jis=(d,fmt)=>new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',...fmt}).format(new Date(d));
const timeAgo=(x)=>{let d=Date.now()-new Date(x).getTime();if(!Number.isFinite(d))return '';let m=Math.max(0,Math.floor(d/60000));return m<60?m+'分前':m<1440?Math.floor(m/60)+'時間前':Math.floor(m/1440)+'日前'};
const response=(content,status=200,type='text/html; charset=utf-8')=>new Response(content,{status,headers:{'content-type':type,'cache-control':'public, max-age=120','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':"default-src 'none';style-src 'unsafe-inline';form-action 'self';base-uri 'none';frame-ancestors 'none'"}});
const xmlText=(s)=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&(#x[0-9a-f]+|#[0-9]+|amp|quot|apos|lt|gt|nbsp);/gi,(all,k)=>{let l=k.toLowerCase();if(l[0]==='#'){let n=l[1]==='x'?parseInt(l.slice(2),16):parseInt(l.slice(1),10);try{return String.fromCodePoint(n)}catch{return ''}}return {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '}[l]||all}).trim();
function tag(block,field){let rx=new RegExp('<'+field+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+field+'>','i');return block.match(rx)?.[1]||''}
function parseFeed(text,label,limit){
 const blocks=text.match(/<(?:item|entry)\b[^>]*>[\s\S]*?<\/(?:item|entry)>/gi)||[];
 let items=[];
 for(const b of blocks.slice(0,limit*4)){
  const title=xmlText(tag(b,'title'));if(!title)continue;
  const href=b.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i)?.[1]||xmlText(tag(b,'link'));
  const link=safeUrl(xmlText(href));if(link==='#')continue;
  const rawDate=xmlText(tag(b,'pubDate')||tag(b,'published')||tag(b,'updated')||tag(b,'dc:date'));
  items.push({title:truncate(title,200),url:link,source:label,date:rawDate&&Number.isFinite(Date.parse(rawDate))?new Date(rawDate).toISOString():'',description:truncate(xmlText(tag(b,'description')||tag(b,'summary')),220)});
  if(items.length>=limit)break;
 }
 return items;
}
const JOBS=[
 ...FEEDS.map(f=>({id:f.id,type:'feed',url:f.url,feed:f})),
 {id:'hackernews',type:'hn',url:'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=12'},
 {id:'trending',type:'github',url:'https://api.github.com/search/repositories'},
 {id:'weather',type:'weather',url:'https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.76&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=3'}
];
async function getData(job){
 let url=job.url;
 if(job.type==='github'){let dt=new Date(Date.now()-8*86400000).toISOString().slice(0,10);url+='?q='+encodeURIComponent('created:>'+dt)+'&sort=stars&order=desc&per_page=8';}
 const r=await fetch(url,{headers:{'accept':job.type==='feed'?'application/rss+xml,application/atom+xml,application/xml,text/xml,*/*':'application/json','user-agent':'Karin-Lab-Portal/1.0 (+https://portal.karin-lab.com)'},signal:AbortSignal.timeout(6500)});
 if(!r.ok)throw Error('upstream HTTP '+r.status);
 if(job.type==='feed'){let text=await r.text();let items=parseFeed(text,job.feed.label,job.feed.limit);if(!items.length)throw Error('no feed items');return items;}
 const data=await r.json();
 if(job.type==='hn')return (data.hits||[]).map(x=>({title:truncate(x.title,170),url:safeUrl(x.url||('https://news.ycombinator.com/item?id='+x.objectID)),comments:'https://news.ycombinator.com/item?id='+encodeURIComponent(x.objectID),points:x.points||0,commentsCount:x.num_comments||0,date:x.created_at||''})).filter(x=>x.url!=='#').slice(0,9);
 if(job.type==='github')return (data.items||[]).slice(0,8).map(x=>({name:x.full_name||'',url:safeUrl(x.html_url),description:truncate(x.description,160),stars:x.stargazers_count||0,language:x.language||''})).filter(x=>x.url!=='#');
 if(job.type==='weather')return {current:data.current||{},daily:data.daily||{},timezone:data.timezone||''};
 return [];
}
async function refresh(env){
 let out=await Promise.all(JOBS.map(async j=>{try{return {id:j.id,ok:true,data:await getData(j)}}catch(e){return {id:j.id,ok:false,error:String(e?.message||e).slice(0,180)}}}));
 let stmts=[];
 for(const item of out){
 if(item.ok)stmts.push(env.DB.prepare("INSERT INTO widget_cache(id,payload,updated_at,error) VALUES(?,?,?, '') ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at,error=''").bind(item.id,JSON.stringify(item.data),new Date().toISOString()));
 else stmts.push(env.DB.prepare("INSERT INTO widget_cache(id,payload,updated_at,error) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET error=excluded.error").bind(item.id,'null',new Date().toISOString(),item.error));
 }
 await env.DB.batch(stmts);
 return out.map(x=>({id:x.id,ok:x.ok,error:x.error||''}));
}
async function load(env){
 let res=await env.DB.prepare('SELECT id,payload,updated_at,error FROM widget_cache').all();
 let obj={};
 for(const r of res.results||[])try{obj[r.id]={data:JSON.parse(r.payload),updatedAt:r.updated_at,error:r.error||''}}catch{}
 return obj;
}
function widget(title,body,url='',label=''){
 return '<section class="widget"><div class="widget-head"><h2>'+h(title)+'</h2>'+(url?'<a class="src" href="'+h(safeUrl(url))+'" target="_blank" rel="noopener noreferrer">'+h(label||'ソースを見る')+' ↗</a>':'')+'</div>'+body+'</section>';
}
const empty=(label)=>'<p class="empty">'+h(label||'取得待ちです。次の自動更新で再試行します。')+'</p>';
function news(cache,id,max){
 const rows=Array.isArray(cache[id]?.data)?cache[id].data.slice(0,max):[];
 if(!rows.length)return empty();
 return '<ul class="list">'+rows.map(x=>'<li class="article"><a target="_blank" rel="noopener noreferrer" href="'+h(safeUrl(x.url))+'">'+h(x.title)+'</a><div class="meta"><span>'+h(x.source)+'</span><span>'+h(x.date?timeAgo(x.date):'')+'</span></div></li>').join('')+'</ul>';
}
function combined(cache){
 let rows=[...(cache.publickey?.data||[]),...(cache.gigazine?.data||[]),...(cache.itmedia?.data||[])];
 rows.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 const seen=new Set();rows=rows.filter(r=>{if(seen.has(r.url))return false;seen.add(r.url);return true});
 return '<div>'+rows.slice(0,18).map(x=>'<div class="article"><a href="'+h(safeUrl(x.url))+'" target="_blank" rel="noopener noreferrer">'+h(x.title)+'</a><div class="meta"><span class="tag">'+h(x.source)+'</span><span>'+h(x.date?timeAgo(x.date):'')+'</span></div></div>').join('')+'</div>' || empty();
}
function hnWidget(cache,limit){
 const rows=Array.isArray(cache.hackernews?.data)?cache.hackernews.data.slice(0,limit):[];
 if(!rows.length)return empty();
 return '<ol class="list">'+rows.map((x,i)=>'<li class="article hnitem"><span class="hnnumber">'+(i+1)+'.</span><div><a href="'+h(safeUrl(x.url))+'" target="_blank" rel="noopener noreferrer">'+h(x.title)+'</a><div class="meta"><span>▲ '+h(x.points)+' points</span><a href="'+h(safeUrl(x.comments))+'" target="_blank" rel="noopener noreferrer">'+h(x.commentsCount)+' comments ↗</a></div></div></li>').join('')+'</ol>';
}
function github(cache,limit){
 const rows=Array.isArray(cache.trending?.data)?cache.trending.data.slice(0,limit):[];
 if(!rows.length)return empty();
 return '<ul class="list">'+rows.map(x=>'<li class="article"><a href="'+h(safeUrl(x.url))+'" target="_blank" rel="noopener noreferrer">'+h(x.name)+'</a><div class="small-description">'+h(x.description||'')+'</div><div class="meta"><span>★ '+h(x.stars)+'</span><span>'+h(x.language)+'</span><span class="tag">NEW</span></div></li>').join('')+'</ul>';
}
function weather(cache){
 const w=cache.weather?.data;
 if(!w?.current||w.current.temperature_2m==null)return empty('東京の天気データを取得しています。');
 const c=w.current,dd=w.daily||{},code=c.weather_code||0;
 const icon=code===0?'☀️':code<4?'⛅':code<50?'🌫️':code<70?'🌦️':code<80?'🌨️':'🌧️';
 const desc=code===0?'快晴':code<4?'晴れ・曇り':code<50?'霧':code<70?'雨':code<80?'雪':'にわか雨';
 const range=(dd.temperature_2m_min||[]).map((lo,i)=>'<div>'+(i===0?'今日':i===1?'明日':'明後日')+'<br><b>'+h(Math.round(dd.temperature_2m_max[i]))+'°</b> / '+h(Math.round(lo))+'°</div>').join('');
 return '<div class="weather"><div class="weather-top"><div><div class="weather-temp">'+h(Math.round(c.temperature_2m))+'°C</div><div class="weather-note">東京 · '+h(desc)+'</div></div><span class="weather-ico">'+icon+'</span></div><div class="forecast">'+range+'</div></div>';
}
function calendar(){
 const format=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const p=Object.fromEntries(format.filter(x=>['year','month','day'].includes(x.type)).map(x=>[x.type,x.value]));
 const year=+p.year,month=+p.month,today=+p.day;
 let first=new Date(Date.UTC(year,month-1,1)),offset=(first.getUTCDay()+6)%7,last=new Date(Date.UTC(year,month,0)).getUTCDate();
 let out='<div class="month-title">'+year+'年 '+month+'月</div><div class="month-grid">';
 for(const w of ['月','火','水','木','金','土','日'])out+='<span class="weekday">'+w+'</span>';
 for(let i=0;i<offset;i++)out+='<span class="blank"></span>';
 for(let i=1;i<=last;i++)out+='<a class="'+(i===today?'today':'')+'" href="https://calendar.karin-lab.com/?view=day&date='+year+'-'+String(month).padStart(2,'0')+'-'+String(i).padStart(2,'0')+'">'+i+'</a>';
 return out+'</div>';
}
function links(rows){return '<div class="links">'+rows.map(x=>'<a href="'+h(safeUrl(x[2]))+'" target="_blank" rel="noopener noreferrer"><span class="icon">'+x[0]+'</span>'+h(x[1])+'</a>').join('')+'</div>'}
function visiblePage(tab,cache){
 const sections={};
 const status=JOBS.filter(j=>cache[j.id]?.updatedAt).length;
 let left='',center='',right='';
 left+=widget('現在の東京',weather(cache),'https://open-meteo.com/','Open-Meteo');
 left+=widget('カレンダー',calendar());
 left+=widget('Karin-Lab サービス',links(LAB));
 left+=widget('よく使うサイト',links(BOOKMARKS));
 if(tab==='home'){
 center+=widget('最新ニュース',combined(cache));
 center+=widget('Hacker News',hnWidget(cache,7),'https://news.ycombinator.com/');
 right+=widget('GitHub 新着スター上位',github(cache,7),'https://github.com/trending');
 right+=widget('Publickey',news(cache,'publickey',6),'https://www.publickey1.jp/');
 }else if(tab==='tech'){
 center+=widget('国内技術ニュース / Publickey',news(cache,'publickey',8),'https://www.publickey1.jp/');
 center+=widget('Hacker News',hnWidget(cache,9),'https://news.ycombinator.com/');
 right+=widget('GitHub 新着スター上位',github(cache,8),'https://github.com/trending');
 right+=widget('ITmedia NEWS',news(cache,'itmedia',7),'https://www.itmedia.co.jp/news/');
 }else{
 center+=widget('Karin-Lab サービス',links(LAB));
 center+=widget('技術ニュース',news(cache,'publickey',8),'https://www.publickey1.jp/');
 right+=widget('GIGAZINE',news(cache,'gigazine',8),'https://gigazine.net/');
 right+=widget('GitHub 新着スター上位',github(cache,6),'https://github.com/trending');
 }
 const last=Object.values(cache).map(x=>x.updatedAt).filter(Boolean).sort().at(-1);
 let title=tab==='home'?'おかえりなさい。':tab==='tech'?'技術のいまを一望。':'Karin-Lab 管制室。';
 const nav=[['home','ホーム'],['tech','技術ニュース'],['lab','マイラボ']];
 let body='<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111419"><meta name="description" content="Karin-Lab Portal: 国内ニュース、技術動向、GitHub、天気を一画面に集約"><title>Portal | Karin-Lab</title><style>'+CSS+'</style></head><body><div class="shell">';
 body+='<header class="top"><div><a href="/"><span class="logo"><span>◉</span> Karin Portal</span></a><span class="subtitle">GLANCE-INSPIRED DASHBOARD</span></div><nav class="topnav">'+nav.map(n=>'<a '+(tab===n[0]?'class="on"':'')+' href="/?tab='+n[0]+'">'+n[1]+'</a>').join('')+'</nav></header>';
 body+='<div class="hero"><div><div class="hello">'+title+'</div><p>'+h(jis(new Date(),{year:'numeric',month:'long',day:'numeric',weekday:'long'}))+'　· 気になる情報を、ここにまとめて。</p></div><form class="searchform" method="get" action="/search" role="search"><input type="search" name="q" placeholder="ウェブを検索..." aria-label="検索キーワード" required maxlength="150"><button type="submit">検索 ↗</button></form></div>';
 if(!status)body+='<p class="notice">情報の初回取得中、または取得先の応答待ちです。ニュースが空の場合は後ほど再読み込みしてください。</p>';
 body+='<main class="layout"><div class="col left">'+left+'</div><div class="col center">'+center+'</div><div class="col right">'+right+'</div></main>';
 body+='<footer class="footer"><div>最終データ更新: '+(last?h(jis(last,{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}))+' JST':'準備中')+' · '+status+'/'+JOBS.length+' ソース取得済み<br>外部記事・天気などは各情報提供元のデータです。遅延や取得失敗があり得ます。</div><div>Glance の設計思想に着想を得た Workers 向け独立実装。<br>Original: <a href="https://github.com/glanceapp/glance" target="_blank" rel="noopener noreferrer">glanceapp/glance (AGPL-3.0)</a> · Built with Cloudflare Workers + D1</div></footer>';
 return body+'</div></body></html>';
}
const karinOriginalWorker = {
 async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==='/healthz')return response(JSON.stringify({ok:true,service:'karin-portal',version:'1.0',date:new Date().toISOString()}),200,'application/json; charset=utf-8');
  if(url.pathname==='/search'&&request.method==='GET'){
   let q=(url.searchParams.get('q')||'').trim().slice(0,150);
   if(!q)return new Response(null,{status:303,headers:{location:'/'}});
   return new Response(null,{status:302,headers:{location:'https://www.google.com/search?q='+encodeURIComponent(q),'referrer-policy':'no-referrer'}});
  }
  if(url.pathname!=='/'||request.method!=='GET')return response('Not found',404,'text/plain');
  let tab=url.searchParams.get('tab')||'home';if(!['home','tech','lab'].includes(tab))tab='home';
  try{
   let cache=await load(env);
   if(!Object.keys(cache).length){
    await refresh(env);
    cache=await load(env);
   }
   return response(visiblePage(tab,cache));
  }catch(e){
   return response('<!doctype html><meta charset="utf-8"><style>body{background:#111419;color:#ddd;font:16px system-ui;padding:40px}</style><h1>Karin Portal</h1><p>データを表示できませんでした。</p><a href="/" style="color:#d7b783">再読み込み</a>',500);
  }
 },
 async scheduled(event,env,ctx){ctx.waitUntil(refresh(env))}
};

import { WorkerEntrypoint } from "cloudflare:workers";
export class CronRunner extends WorkerEntrypoint {
  ping() {return {ok:true,service:"karin-portal",rpc:"CronRunner"};}
  async runCron(){await refresh(this.env);return {ok:true,service:"karin-portal"};}
}

const KARIN_FAVICON_SVG="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"g\"><stop stop-color=\"#85634a\"/><stop offset=\"1\" stop-color=\"#eab980\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"15\" fill=\"url(#g)\"/><g stroke=\"#fff\" stroke-width=\"3.2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M13 15h38v35H13z M13 26h38 M24 26v24 M24 38h27 M18 21h1 M24 21h1\"/></g></svg>";
export default {...karinOriginalWorker,async fetch(request,env,ctx){const pathname=new URL(request.url).pathname;if(pathname==='/favicon.svg')return new Response(KARIN_FAVICON_SVG,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public,max-age=86400','x-content-type-options':'nosniff'}});if(pathname==='/favicon.ico')return Response.redirect(new URL('/favicon.svg',request.url),302);const response=await karinOriginalWorker.fetch(request,env,ctx);if(response.status===200&&!response.webSocket&&(response.headers.get('content-type')||'').toLowerCase().includes('text/html'))return new HTMLRewriter().on('head',{element(el){el.append('<link rel="icon" href="/favicon.svg" type="image/svg+xml">',{html:true})}}).transform(response);return response;}};