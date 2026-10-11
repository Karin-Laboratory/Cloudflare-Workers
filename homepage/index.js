
const INITIAL=[
{id:"ai",name:"AI Co-Pilots",icon:"✦",color:"#a58bcf",links:[
["ChatGPT","https://chatgpt.com","ちょっぴり先輩助手"],["Gemini","https://gemini.google.com","調査・比較"],["Microsoft Copilot","https://copilot.microsoft.com","Microsoft AI"],["Claude","https://claude.ai","長文・構成"]]},
{id:"lab",name:"Karin-Lab",icon:"⬡",color:"#dfa960",links:[
["MyKeep","https://mykeep.karin-lab.com","クラウドメモ"],["Notepad","https://notepad.karin-lab.com","クラウドメモ帳"],["Calendar","https://calendar.karin-lab.com","予定表"],["Karin Search","https://search.karin-lab.com","横断検索"],["Karin Daily","https://daily.karin-lab.com","ニュース"],["Karin Chat","https://chat.karin-lab.com","AIチャット"],["Discovery","https://discovery.karin-lab.com","日本語新着"],["INDIE APP MUSEUM","https://museum.karin-lab.com","個人開発ギャラリー"],["Karin Radar","https://radar.karin-lab.com","診断"],["Uploader","https://upload.karin-lab.com","ファイル配布"],["Portal","https://portal.karin-lab.com","ニュースポータル"]]},
{id:"create",name:"Creative & Logs",icon:"✎",color:"#84b6da",links:[
["Memos","https://memos.karin-lab.com","日記・メモ"],["linkding","https://linkding.link","リンク管理"],["Excalidraw","https://excalidraw.com","図解"],["Paperless","https://docs.paperless-ngx.com","文書整理"],["Recoll","https://www.recoll.org","全文検索"],["Cloud Commander","https://cloudcmd.io","Webファイラー"]]},
{id:"home",name:"Homelab & Fleet",icon:"▣",color:"#81c7b1",links:[
["Proxmox Cluster","https://www.proxmox.com","仮想環境"],["Proxmox esprimo","https://www.proxmox.com","予備ノード"],["Proxmox prodesk","https://www.proxmox.com","仮想環境"],["n8n","https://n8n.karin-lab.com","自動化"],["Uptime Kuma","https://github.com/louislam/uptime-kuma","稼働監視"],["Router / OpenWrt","https://openwrt.org","ネットワーク"]]},
{id:"storage",name:"Storage & Logistics",icon:"▤",color:"#c9a3db",links:[
["TS5200","http://192.168.0.23","NAS"],["Cloud Commander TS5200","http://192.168.0.23","ファイル管理"],["us-310ea Cockpit","#","NAS"],["us-310eb Cockpit","#","コンテナ"]]},
{id:"infra",name:"OCI & Communication",icon:"☁",color:"#e3a079",links:[
["Gmail","https://mail.google.com/","メール"],["Memos Public","https://memos.karin-lab.com","公開メモ"],["Guacamole","https://guacamole.apache.org","リモート接続"],["Tailscale Gateway","https://login.tailscale.com/admin","VPN"],["Cloudflare","https://dash.cloudflare.com","ネットワーク"],["OCI Console","https://cloud.oracle.com","Oracle Cloud"]]},
{id:"dev",name:"Development & Intelligence",icon:"⌘",color:"#7ebace",links:[
["GitHub","https://github.com/Karin-Laboratory","ソース管理"],["Qiita","https://qiita.com","技術記事"],["ヤフオク","https://auctions.yahoo.co.jp","オークション"],["OSS Watch","https://github.com","OSS動向"],["Hacker News","https://news.ycombinator.com","開発ニュース"],["Notion","https://www.notion.so","ノート"],["Microsoft To Do","https://to-do.office.com","タスク"]]},
{id:"life",name:"Life & Shopping",icon:"◇",color:"#dcac86",links:[
["YouTube","https://www.youtube.com/","動画"],["X","https://x.com/","SNS"],["Yahoo!ショッピング","https://shopping.yahoo.co.jp/","お買い物"],["Google マップ","https://maps.google.com","地図"],["Google フォト","https://photos.google.com","写真"],["食べログ","https://tabelog.com","グルメ"],["メルカリ","https://jp.mercari.com","フリマ"],["Amazon","https://www.amazon.co.jp","通販"],["アリさん急行","https://www.aliexpress.com","海外通販"],["はてなブログ","https://hatenablog.com","ブログ"]]}
].map((g)=>({...g,links:g.links.map((l,i)=>({id:g.id+"-"+i,title:l[0],url:l[1],description:l[2]}))}));
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",...extra}});
const headers={"content-type":"text/html;charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'"};
function valid(input){if(!Array.isArray(input)||input.length>40)return false;let count=0;for(const g of input){if(!g||typeof g.id!=="string"||typeof g.name!=="string"||g.name.length>80||g.id.length>100||!Array.isArray(g.links)||g.links.length>150||typeof g.color!=="string"||!/^(#[0-9a-fA-F]{6})$/.test(g.color))return false;for(const l of g.links){count++;if(!l||typeof l.id!=="string"||typeof l.title!=="string"||typeof l.url!=="string"||typeof l.description!=="string"||l.title.length>150||l.url.length>2048||l.description.length>500)return false;if(l.url==="#")continue;try{if(!["https:","http:"].includes(new URL(l.url).protocol))return false}catch{return false}}}return count<=1200}
function validTabs(tabs,groups){if(!Array.isArray(tabs)||tabs.length<1||tabs.length>20)return false;const ids=new Set();for(const t of tabs){if(!t||typeof t.id!=='string'||typeof t.name!=='string'||!t.id||t.id.length>100||!t.name.trim()||t.name.length>50||ids.has(t.id))return false;ids.add(t.id)}if(!ids.has('main'))return false;return groups.every(g=>!g.desktopId||ids.has(g.desktopId))}
const PAGE=String.raw`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Karin Homepage</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>
:root{color-scheme:dark;font-family:Inter,-apple-system,BlinkMacSystemFont,"Noto Sans JP",sans-serif;--bg:#151b28;--panel:#243145;--fg:#eff5ff;--muted:#98a8be;--line:#36465b}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-size:13px}button,input,textarea{font:inherit}button{cursor:pointer}header{position:sticky;top:0;z-index:4;background:#1d293c;box-shadow:0 5px 22px #0003;padding:15px 25px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}header strong{font-size:20px;letter-spacing:-.5px}header strong span{color:#efc66b}header .clock{color:#adbed5;margin-left:auto}input{background:#344156;border:1px solid #53647c;border-radius:7px;padding:10px;color:white;outline:none}input:focus{border-color:#a8cbf6}#search{width:min(330px,45vw)}button{background:#34445b;color:#edf4ff;border:1px solid #485b76;border-radius:7px;padding:9px 13px;font-weight:600}button:hover{background:#435875}.primary{background:#e9bd58;color:#182133;border-color:#e9bd58}.primary:hover{background:#ffcf64}main{padding:26px 23px 70px;max-width:1800px;margin:auto}.info{color:#96aac2;font-size:12px;margin:0 0 25px}.board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:24px 13px;align-items:start}.group{min-width:0;border-radius:12px;padding:6px 9px 9px;background:#1c2737;border:1px solid #2c3d52;transition:border-color .15s}.group.dragover{border:1px dashed #f3cc76;background:#26364a}.grouphead{display:flex;gap:9px;align-items:center;min-height:30px;padding:1px 6px 3px}.grouphead .mark{font-size:17px}.grouphead h2{margin:0;font-size:15px;font-weight:650;flex:1;overflow-wrap:anywhere}.grouphead .actions{display:flex;gap:3px}.mini{background:transparent;border:0;padding:4px;color:#9dafc7;font-size:16px}.mini:hover{background:#ffffff20}.cards{min-height:35px;display:grid;grid-template-columns:1fr;gap:7px}.link{background:#29374b;border:1px solid #34455d;min-width:0;display:flex;gap:11px;align-items:center;border-radius:7px;padding:12px 10px;cursor:grab;position:relative}.link:active,.grouphead:active{cursor:grabbing}.link.dragging{opacity:.35}.link.dropbefore{border-top:3px solid #e9bd58}.link:hover{background:#354860;border-color:#647a99}.favicon{width:27px;height:27px;flex:0 0 27px;border-radius:5px;object-fit:contain}.genericicon{height:27px;width:27px;display:grid;place-items:center;border-radius:7px;background:#40526d;color:#fff;font-size:18px}.details{min-width:0;flex:1}.name{font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f2f5fa}.desc{font-size:11px;color:#a1b0c5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px}.link a{color:inherit;text-decoration:none;min-width:0;flex:1}.link .editlink{opacity:.45}.link:hover .editlink{opacity:1}.empty{color:#7e91aa;padding:16px;text-align:center;border:1px dashed #40516b;border-radius:7px}.toast{position:fixed;bottom:20px;right:18px;padding:12px 18px;border:1px solid #435875;background:#2c435b;border-radius:9px;box-shadow:0 10px 30px #0006;display:none;z-index:10}dialog{border:1px solid #53647d;background:#253246;color:white;border-radius:12px;width:min(460px,calc(100vw - 30px));padding:22px;box-shadow:0 20px 70px #0009}dialog::backdrop{background:#0009}dialog h2{margin:0 0 16px;font-size:19px}dialog label{display:block;margin:12px 0 5px;color:#c6d2e4;font-size:12px}dialog input{width:100%}dialog menu{padding:0;margin:20px 0 0;display:flex;gap:8px;justify-content:flex-end}.hint{color:#9daec3;font-size:11px}#mobileSort{display:none}@media(max-width:1320px){.board{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:1020px){.board{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:780px){.board{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:570px){header{padding:13px}main{padding:18px 11px 60px}.board{grid-template-columns:1fr}.clock{display:none}#search{width:100%;order:4}header strong{font-size:18px}#mobileSort{display:inline}}
[hidden]{display:none!important}.fallbackicon{background:#3c5878;color:#ffffff;font-size:14px;font-weight:750}.addgroup-tile{min-height:150px;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#1e2a3b;border:2px dashed #536888;border-radius:12px;color:#aec5e1;transition:background .15s,border-color .15s}.addgroup-tile:hover,.addgroup-tile:focus-visible{background:#2c3f56;border-color:#e9bd58;color:#fff}.addgroup-symbol{font-size:34px;line-height:1;font-weight:400;color:#e9bd58}.addgroup-tile strong{font-size:15px}.addgroup-tile small{font-size:11px;color:#9ab0c8}.desktop-tabs{display:flex;gap:5px;padding:10px 23px 0;margin:0 auto;max-width:1800px;overflow-x:auto;white-space:nowrap;scrollbar-width:thin}.tab-wrap{display:flex;align-items:center;gap:0;flex-shrink:0;background:#233248;border:1px solid #394b63;border-radius:9px 9px 0 0;max-width:250px}.tab-wrap.active{background:#334660;border-bottom:3px solid #edc877}.desktop-tab{border:0;background:transparent;padding:10px 13px;max-width:175px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.tab-wrap.active .desktop-tab{color:#ffda94}.tab-control{border:0;background:transparent;padding:6px;color:#9cb0cb;font-size:14px}.tab-control:hover,.desktop-tab:hover{background:#ffffff15}.tab-add{width:42px;border:1px dashed #74859e;color:#efc877;background:#283b52;font-size:20px}.tab-wrap.tabdrag{outline:2px dashed #edc877;outline-offset:-2px}.board .grouphead h2{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;overflow-wrap:normal}.board .link{padding:7.5px 8px;gap:8px}.board .favicon{width:24px;height:24px;flex-basis:24px}.board .genericicon{width:24px;height:24px;font-size:14px}.board .name{font-size:12px;letter-spacing:-.12px}.board .editlink{padding:3px;font-size:14px}dialog select{width:100%;padding:10px;border:1px solid #53647c;border-radius:7px;background:#344156;color:white}@media(max-width:570px){.desktop-tabs{padding:10px 11px 0}.desktop-tab{max-width:140px}}
/* Slim trapezoid paper-file desktop tabs */
.desktop-tabs{display:flex;align-items:flex-end;gap:0;padding:10px 22px 0;min-height:47px;background:linear-gradient(180deg,#172131,#202c40);border-bottom:1px solid #5b718c;scrollbar-width:thin}
.tab-wrap{position:relative;isolation:isolate;display:flex;align-items:stretch;flex-shrink:0;min-height:33px;max-width:250px;padding:0 14px;margin-right:-7px;border:0;border-radius:0;background:none;cursor:grab;filter:drop-shadow(0 -2px 3px #0006);transition:transform .13s ease}
.tab-wrap::before,.tab-wrap::after{content:"";position:absolute;pointer-events:none;clip-path:polygon(15px 0,calc(100% - 15px) 0,100% 100%,0 100%)}
.tab-wrap::before{inset:0;background:#60718a;z-index:-2}
.tab-wrap::after{inset:1px 1px 0;background:linear-gradient(145deg,#35425a,#233047);z-index:-1}
.tab-wrap.active{background:none;border:0;filter:drop-shadow(0 -2px 5px #a2bbf13d)}
.tab-wrap.active::before{background:#c4d3eb}
.tab-wrap.active::after{background:linear-gradient(145deg,#496188,#30455f)}
.tab-wrap:hover::before{background:#a8bddd}
.tab-wrap:hover::after{background:linear-gradient(145deg,#445a77,#2b3d54)}
.tab-wrap .desktop-tab,.tab-wrap .tab-control{position:relative;z-index:1;border:0;background:transparent}
.tab-wrap .desktop-tab{display:flex;align-items:center;max-width:168px;padding:7px 5px;line-height:18px;font-size:12px;color:#c2d1e5;cursor:pointer}
.tab-wrap .desktop-tab::before{content:"▱";font-size:17px;margin-right:8px;color:#bacce0}
.tab-wrap.active .desktop-tab{color:#fff}
.tab-wrap.active .desktop-tab::before{color:#f4d48e}
.tab-wrap .tab-control{padding:7px 3px;line-height:18px;color:#cadaeb}
.tab-wrap .tab-control:last-child{margin-right:4px}
.tab-wrap.tabdrag::before,.tab-wrap.tab-before::before,.tab-wrap.tab-after::before{background:#ffdc81}
.tab-wrap.tabdrag::after{background:linear-gradient(145deg,#556e8a,#365570)}
.tab-wrap.tab-before{transform:translateX(-5px)}
.tab-wrap.tab-after{transform:translateX(5px)}
.tab-wrap.dragging-tab{opacity:.35}
.tab-add{margin:1px 0 0 12px;height:32px;min-height:32px;padding:0;line-height:30px;font-size:17px;border-radius:8px 8px 2px 2px}
@media(max-width:570px){.desktop-tabs{padding:9px 9px 0;min-height:45px}.tab-wrap{padding:0 12px;max-width:195px}.tab-wrap .desktop-tab{max-width:125px;font-size:12px}}

/* Compact top masthead; leave the group-creation tile at the end of the board */
header{padding:9px 18px;gap:10px}
header strong{font-size:17px}
header input{padding:7px 9px}
header button{padding:7px 10px}
#search{width:min(315px,43vw)}
main{padding-top:13px}
@media(max-width:570px){header{padding:9px 11px;gap:8px}main{padding-top:9px}}
</style></head><body><header><strong><span>✦</span> Karin Homepage</strong><span class="clock" id="clock"></span><input id="search" type="search" placeholder="リンクを検索 / URLをグループにドラッグ"><button id="addLink" class="primary">＋ リンク追加</button><button id="mobileSort" title="並び順">↕</button></header><nav id="desktopTabs" class="desktop-tabs" role="tablist" aria-label="デスクトップの切り替え"></nav>
<main><div class="board" id="board"></div></main><div class="toast" id="toast"></div>
<dialog id="dialog"><form id="editForm"><h2 id="dialogTitle"></h2><div id="fields"></div><p class="hint" id="formHint"></p><menu><button type="button" id="deleteItem">削除</button><button type="button" id="cancelDialog">キャンセル</button><button type="submit" class="primary">保存</button></menu></form></dialog>
<script>
let state=[],tabs=[{id:'main',name:'デスクトップ1'}],activeTab='main',revision=0,dirty=false,saving=false,mode='',target=null,dragged=null,timer=null;
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID(),toast=s=>{const e=$('toast');e.textContent=s;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',2800)};
function renderTabs(){$('desktopTabs').innerHTML=tabs.map(t=>{const on=t.id===activeTab;return '<div class="tab-wrap'+(on?' active':'')+'" draggable="true" data-tab="'+esc(t.id)+'"><button class="desktop-tab" role="tab" aria-selected="'+on+'" data-tab="'+esc(t.id)+'" title="'+esc(t.name)+'">'+esc(t.name)+'</button>'+(on?'<button class="tab-control" data-rename="'+esc(t.id)+'" title="名前を変更">✎</button>'+(t.id!=='main'?'<button class="tab-control" data-remove="'+esc(t.id)+'" title="削除">×</button>':''):'')+'</div>'}).join('')+'<button id="addDesktop" class="tab-add" title="デスクトップを追加" aria-label="デスクトップを追加">＋</button>'}
function selectTab(id){if(!tabs.some(t=>t.id===id))return;activeTab=id;try{localStorage.setItem('karin-homepage-active-tab',id)}catch{}render()}
function addDesktop(){if(tabs.length>=20)return toast('デスクトップは20個まで');let n=1;while(tabs.some(t=>t.name==='デスクトップ'+n))n++;const id=uid();tabs.push({id,name:'デスクトップ'+n});activeTab=id;changed();try{localStorage.setItem('karin-homepage-active-tab',id)}catch{}}
function renameDesktop(id){const t=tabs.find(t=>t.id===id);if(!t)return;const result=prompt('デスクトップ名',t.name);if(result===null)return;const val=result.trim();if(!val||val.length>50)return toast('1～50文字で入力してください');t.name=val;changed()}
function removeDesktop(id){if(id==='main')return;const t=tabs.find(t=>t.id===id);if(!t)return;const n=state.filter(g=>(g.desktopId||'main')===id).length;if(!confirm('「'+t.name+'」を削除しますか？'+(n?'\n'+n+'グループをデスクトップ1に移動します。':'')))return;state.forEach(g=>{if(g.desktopId===id)g.desktopId='main'});tabs=tabs.filter(t=>t.id!==id);activeTab='main';changed()}
$('desktopTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='addDesktop')return addDesktop();if(b.dataset.rename)return renameDesktop(b.dataset.rename);if(b.dataset.remove)return removeDesktop(b.dataset.remove);if(b.dataset.tab)return selectTab(b.dataset.tab)});

function reorderDesktopTab(sourceId,targetId,after){
  if(sourceId===targetId)return false;
  const from=tabs.findIndex(t=>t.id===sourceId);
  if(from<0||!tabs.some(t=>t.id===targetId))return false;
  const item=tabs.splice(from,1)[0];
  const dest=tabs.findIndex(t=>t.id===targetId);
  tabs.splice(dest+(after?1:0),0,item);
  return true;
}
function clearTabDrag(){
  $('desktopTabs').querySelectorAll('.tabdrag,.tab-before,.tab-after,.dragging-tab')
    .forEach(t=>t.classList.remove('tabdrag','tab-before','tab-after','dragging-tab'));
}
$('desktopTabs').addEventListener('dragstart',e=>{
  const tab=e.target.closest('.tab-wrap');
  if(!tab||e.target.closest('.tab-control')){e.preventDefault();return}
  dragged={type:'tab',id:tab.dataset.tab};
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain','homepage-tab:'+dragged.id);
  tab.classList.add('dragging-tab');
});
$('desktopTabs').addEventListener('dragover',e=>{
  const tab=e.target.closest('.tab-wrap');
  if(!tab||!dragged||!['tab','group'].includes(dragged.type))return;
  if(dragged.type==='tab'&&dragged.id===tab.dataset.tab)return;
  e.preventDefault();e.dataTransfer.dropEffect='move';clearTabDrag();
  if(dragged.type==='group')tab.classList.add('tabdrag');
  else{const r=tab.getBoundingClientRect();tab.classList.add(e.clientX<r.left+r.width/2?'tab-before':'tab-after')}
});
$('desktopTabs').addEventListener('dragleave',e=>{
  if(!$('desktopTabs').contains(e.relatedTarget))clearTabDrag();
});
$('desktopTabs').addEventListener('drop',e=>{
  const tab=e.target.closest('.tab-wrap');
  if(!tab||!dragged||!['tab','group'].includes(dragged.type))return;
  e.preventDefault();
  const moving=dragged;
  if(moving.type==='tab'){
    const r=tab.getBoundingClientRect();
    if(reorderDesktopTab(moving.id,tab.dataset.tab,e.clientX>=r.left+r.width/2))changed();
  }else{
    const group=findGroup(moving.id);
    if(group&&tabs.some(t=>t.id===tab.dataset.tab)){
      if((group.desktopId||'main')!==tab.dataset.tab){
        group.desktopId=tab.dataset.tab;
        activeTab=tab.dataset.tab;
        try{localStorage.setItem('karin-homepage-active-tab',activeTab)}catch{}
        changed();
      }else selectTab(tab.dataset.tab);
    }
  }
  dragged=null;clearTabDrag();
});
$('desktopTabs').addEventListener('dragend',()=>{dragged=null;clearTabDrag()});

function render(){renderTabs();const q=$('search').value.trim().toLowerCase();$('board').innerHTML=state.filter(g=>(g.desktopId||'main')===activeTab).map(g=>{const links=g.links.filter(l=>(l.title+' '+l.description+' '+l.url).toLowerCase().includes(q));if(q&&!links.length&&!g.name.toLowerCase().includes(q))return '';return '<section class="group" data-gid="'+esc(g.id)+'" draggable="'+(!q)+'"><div class="grouphead" draggable="'+(!q)+'"><span class="mark" style="color:'+esc(g.color)+'">'+esc(g.icon||'◆')+'</span><h2 title="'+esc(g.name)+'">'+esc(g.name)+'</h2><div class="actions"><button class="mini editgroup" title="ジャンル編集" data-gid="'+esc(g.id)+'">✎</button></div></div><div class="cards">'+(links.length?links.map(l=>{let host='';try{host=new URL(l.url).hostname}catch{}const slug=host.endsWith('.karin-lab.com')?host.slice(0,-'.karin-lab.com'.length):'';const privateHost=/^(?:localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\\d|3[01])\.)/i.test(host);const iconSrc=privateHost?'/app-icon/'+(/cockpit|server|container/i.test(l.title)?'server':'nas')+'.svg':'/app-icon/'+encodeURIComponent(slug)+'.svg';const ico=host?'<img class="favicon" src="'+(slug||privateHost?iconSrc:'/favicon?domain='+encodeURIComponent(host))+'" alt="" loading="lazy"><span class="genericicon fallbackicon" hidden>'+esc(l.title.slice(0,1).toUpperCase())+'</span>':'<img class="favicon" src="/app-icon/server.svg" alt="" loading="lazy">';return '<article class="link" draggable="'+(!q)+'" data-lid="'+esc(l.id)+'" data-gid="'+esc(g.id)+'">'+ico+'<a href="'+esc(l.url)+'" target="_blank" rel="noopener noreferrer"><div class="details"><div class="name">'+esc(l.title)+'</div><div class="desc">'+esc(l.description||host)+'</div></div></a><button class="mini editlink" data-lid="'+esc(l.id)+'" data-gid="'+esc(g.id)+'" title="編集">✎</button></article>'}).join(''):'<div class="empty">ここへドロップ</div>')+'</div></section>'}).join('')+'<button class="addgroup-tile" type="button" data-action="add-group"><span class="addgroup-symbol">＋</span><strong>グループを追加</strong><small>リンクを用途別にまとめる</small></button>';}
function desktopOptions(selected){return '<label for="f_desktop">デスクトップ</label><select id="f_desktop">'+tabs.map(t=>'<option value="'+esc(t.id)+'" '+(selected===t.id?'selected':'')+'>'+esc(t.name)+'</option>').join('')+'</select>'}
function findGroup(id){return state.find(g=>g.id===id)}function findLink(gid,lid){return findGroup(gid)?.links.find(l=>l.id===lid)}
function edit(kind,gid,lid){mode=kind;target={gid,lid};let obj=kind==='group'?findGroup(gid):kind==='link'?findLink(gid,lid):null;$('dialogTitle').textContent=kind==='group'?'グループを編集':kind==='newgroup'?'グループを追加':kind==='newlink'?'リンクを追加':'リンクを編集';$('deleteItem').style.display=obj?'inline':'none';const f=(name,value,label)=>'<label for="f_'+name+'">'+label+'</label><input id="f_'+name+'" name="'+name+'" value="'+esc(value)+'" required>';if(kind==='group'||kind==='newgroup')$('fields').innerHTML=f('title',obj?.name||'','ジャンル名')+f('icon',obj?.icon||'◆','アイコン（絵文字など）')+f('color',obj?.color||'#84b6da','見出し色（#RRGGBB）')+desktopOptions(obj ? (obj.desktopId||'main') : activeTab);else $('fields').innerHTML=f('title',obj?.title||'','タイトル')+f('url',obj?.url||'https://','リンク先URL')+f('description',obj?.description||'','説明（省略可）').replace('name="description"','name="description"')+'<label for="f_group">ジャンル</label><select id="f_group" style="width:100%;padding:9px;background:#344156;color:white;border-radius:6px">'+state.map(g=>'<option value="'+esc(g.id)+'" '+((gid===g.id)?'selected':'')+'>'+esc(g.name)+'</option>').join('')+'</select>';$('f_description')?.removeAttribute('required');$('formHint').textContent='保存すると他の端末でも同じ配置になります。';$('dialog').showModal();}
$('cancelDialog').onclick=()=>$('dialog').close();$('addLink').onclick=()=>{const g=state.find(g=>(g.desktopId||'main')===activeTab);if(!g){toast('最初にグループを追加してください');return edit('newgroup')}edit('newlink',g.id)};$('search').oninput=render;
$('editForm').onsubmit=e=>{e.preventDefault();const title=$('f_title').value.trim();if(!title)return; if(mode==='group'||mode==='newgroup'){const color=$('f_color').value.trim();if(!/^#[0-9a-fA-F]{6}$/.test(color))return toast('色は #RRGGBB 形式で指定してください');if(mode==='group')Object.assign(findGroup(target.gid),{name:title,icon:$('f_icon').value,color,desktopId:$('f_desktop').value});else state.push({id:uid(),name:title,icon:$('f_icon').value,color,desktopId:$('f_desktop').value,links:[]});}else{let url=$('f_url').value.trim();try{if(!['http:','https:'].includes(new URL(url).protocol))throw Error()}catch{return toast('http / https のURLを入力してください')}const group=$('f_group').value;const val={title,url,description:$('f_description').value};if(mode==='link'){const old=findGroup(target.gid);const i=old.links.findIndex(l=>l.id===target.lid);const link=old.links.splice(i,1)[0];Object.assign(link,val);findGroup(group).links.push(link)}else findGroup(group).links.push({id:uid(),...val});}$('dialog').close();changed()};
$('deleteItem').onclick=()=>{if(!confirm('削除しますか？'))return;if(mode==='group'){const g=findGroup(target.gid);if(g.links.length&&!confirm('中のリンクもすべて削除します。よろしいですか？'))return;state=state.filter(x=>x.id!==g.id)}else if(mode==='link'){const g=findGroup(target.gid);g.links=g.links.filter(x=>x.id!==target.lid)}$('dialog').close();changed()};
$('board').addEventListener('error',e=>{if(e.target.matches('img.favicon')){e.target.hidden=true;const f=e.target.nextElementSibling;if(f)f.hidden=false}},true);
$('board').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.action==='add-group'){edit('newgroup');return}if(b.classList.contains('editgroup'))edit('group',b.dataset.gid);if(b.classList.contains('editlink'))edit('link',b.dataset.gid,b.dataset.lid)};
// Chrome's address bar and bookmarks expose URL data as text/uri-list or text/plain.
function externalDrag(e){
 const types=Array.from(e.dataTransfer?.types||[]);
 return !dragged&&(types.includes('text/uri-list')||types.includes('text/x-moz-url')||types.includes('text/plain')||types.includes('text/html'));
}
function droppedURL(dt){
 if(!dt)return null;
 const values=[dt.getData('text/uri-list'),dt.getData('text/x-moz-url'),dt.getData('text/plain')];
 for(const value of values){
  const line=value.split(/\r?\n/).map(x=>x.trim()).find(x=>x&&!x.startsWith('#'));
  if(!line)continue;
  try{const u=new URL(line);if((u.protocol==='https:'||u.protocol==='http:')&&u.href.length<=2048)return u.href}catch{}
 }
 const html=dt.getData('text/html');
 if(html){try{const a=new DOMParser().parseFromString(html,'text/html').querySelector('a[href]');const u=new URL(a?.getAttribute('href'));if(['https:','http:'].includes(u.protocol)&&u.href.length<=2048)return u.href}catch{}}
 return null;
}
function importedTitle(url){
 const host=new URL(url).hostname.toLowerCase();
 const known={'www.youtube.com':'YouTube','youtube.com':'YouTube','x.com':'X','twitter.com':'X','mail.google.com':'Gmail','shopping.yahoo.co.jp':'Yahoo!ショッピング','to-do.office.com':'Microsoft To Do'};
 return known[host]||host.replace(/^www\./,'');
}
function addDroppedURL(e,groupEl){
 const url=droppedURL(e.dataTransfer);if(!url){toast('URLをドロップしてください');return}
 const group=findGroup(groupEl.dataset.gid);if(!group)return;
 if(group.links.some(l=>l.url.replace(/\/$/,'')===url.replace(/\/$/,''))){toast('このグループには登録済みです');return}
 const card=e.target.closest('.link');
 const index=card?group.links.findIndex(l=>l.id===card.dataset.lid):-1;
 const link={id:uid(),title:importedTitle(url),url,description:''};
 group.links.splice(index<0?group.links.length:index,0,link);
 toast('リンクを追加：'+link.title);
 changed();
}
$('board').addEventListener('dragstart',e=>{if($('search').value)return e.preventDefault();const card=e.target.closest('.link'),group=e.target.closest('.group');dragged=card?{type:'link',gid:card.dataset.gid,id:card.dataset.lid}:{type:'group',id:group?.dataset.gid};if(!dragged.id)return;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragged.id);if(card)card.classList.add('dragging')});
$('board').addEventListener('dragover',e=>{if(externalDrag(e)){const g=e.target.closest('.group');if(g){e.preventDefault();e.dataTransfer.dropEffect='copy';document.querySelectorAll('.dragover,.dropbefore').forEach(x=>x.classList.remove('dragover','dropbefore'));g.classList.add('dragover')}return}if(!dragged||dragged.type==='tab')return;e.preventDefault();document.querySelectorAll('.dragover,.dropbefore').forEach(x=>x.classList.remove('dragover','dropbefore'));if(dragged.type==='link'){const l=e.target.closest('.link');(l||e.target.closest('.group'))?.classList.add(l?'dropbefore':'dragover')}else e.target.closest('.group')?.classList.add('dragover')});
$('board').addEventListener('drop',e=>{if(externalDrag(e)){const g=e.target.closest('.group');if(g){e.preventDefault();addDroppedURL(e,g);document.querySelectorAll('.dragover,.dropbefore').forEach(x=>x.classList.remove('dragover','dropbefore'))}return}e.preventDefault();if(!dragged||dragged.type==='tab')return;const gEl=e.target.closest('.group');if(!gEl)return;const dest=findGroup(gEl.dataset.gid);if(dragged.type==='group'){const i=state.findIndex(x=>x.id===dragged.id),j=state.findIndex(x=>x.id===dest.id);if(i<0||j<0)return;const item=state.splice(i,1)[0];state.splice(j,0,item)}else{const from=findGroup(dragged.gid),i=from?.links.findIndex(x=>x.id===dragged.id);if(i<0)return;const item=from.links.splice(i,1)[0];const el=e.target.closest('.link');const j=el?dest.links.findIndex(x=>x.id===el.dataset.lid):-1;dest.links.splice(j<0?dest.links.length:j,0,item)}dragged=null;changed()});
$('board').addEventListener('dragend',()=>{dragged=null;document.querySelectorAll('.dragover,.dropbefore,.dragging,.tabdrag,.tab-before,.tab-after').forEach(x=>x.classList.remove('dragover','dropbefore','dragging'))});
function changed(){dirty=true;render();clearTimeout(timer);timer=setTimeout(save,550)}
async function save(){if(saving){dirty=true;return}if(!dirty)return;saving=true;dirty=false;const payload=structuredClone(state);try{const r=await fetch('/api/state',{method:'PUT',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({groups:payload,tabs:structuredClone(tabs),revision})});if(r.status===409){toast('別の端末で更新されています。再読み込みして確認してください');return}if(!r.ok){let detail='';try{detail=(await r.json()).error||''}catch{}throw Error('HTTP '+r.status+(detail?' '+detail:''))}if(!(r.headers.get('content-type')||'').includes('application/json'))throw Error('認証が必要です。画面を再読み込みしてください');const result=await r.json();if(!Number.isSafeInteger(result.revision))throw Error('保存応答が不正です');revision=result.revision;toast('保存しました')}catch(e){dirty=true;toast('保存エラー: '+String(e.message||e).slice(0,80));setTimeout(save,2500)}finally{saving=false;if(dirty)setTimeout(save,550)}}
const clock=()=>{$('clock').textContent=new Intl.DateTimeFormat('ja-JP',{dateStyle:'full',timeStyle:'short',timeZone:'Asia/Tokyo'}).format(new Date())};clock();setInterval(clock,30000);
fetch('/api/state').then(r=>{if(!r.ok)throw Error();return r.json()}).then(x=>{state=x.groups;tabs=x.tabs?.length?x.tabs:[{id:'main',name:'デスクトップ1'}];revision=x.revision;let saved='main';try{saved=localStorage.getItem('karin-homepage-active-tab')||'main'}catch{}activeTab=tabs.some(t=>t.id===saved)?saved:'main';render()}).catch(()=>{$('board').innerHTML='<p>読み込みできません。ページを再読み込みしてください。</p>'});
</script></body></html>`;
function iconFallback(domain){const char=(domain.replace(/^www\./,'').match(/[a-z0-9]/i)?.[0]||'?').toUpperCase();const svg='<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="13" fill="#365272"/><text x="32" y="43" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#ffffff">'+char+'</text></svg>';return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public,max-age=3600','x-content-type-options':'nosniff'}})}
async function getIcon(u){const domain=(u.searchParams.get('domain')||'').toLowerCase();if(!/^[a-z0-9.-]{3,180}$/.test(domain)||!domain.includes('.')||domain.includes('..'))return iconFallback(domain);try{const r=await fetch('https://www.google.com/s2/favicons?domain='+encodeURIComponent(domain)+'&sz=64',{headers:{accept:'image/png,image/x-icon,image/*'},signal:AbortSignal.timeout(3500)});const mime=(r.headers.get('content-type')||'').split(';')[0].toLowerCase();if(r.ok&&['image/png','image/x-icon','image/vnd.microsoft.icon','image/jpeg','image/webp'].includes(mime)){const bytes=await r.arrayBuffer();if(bytes.byteLength>0&&bytes.byteLength<65536)return new Response(bytes,{headers:{'content-type':mime,'cache-control':'public,max-age=86400','x-content-type-options':'nosniff'}})}}catch{}return iconFallback(domain)}
const KARIN_ICON_SET={"homepage":["#3649a1","#8197fa","M18 19h12v12H18z M34 19h12v12H34z M18 35h12v12H18z M34 35h12v12H34z"],"notepad":["#1c607d","#53d1c8","M21 14h17l7 7v27H21z M38 14v10h7 M25 31h15 M25 38h15 M25 45h10"],"calendar":["#9f406b","#f6a2b7","M15 19h34v31H15z M23 14v10 M41 14v10 M15 29h34 M23 37h5 M34 37h5 M23 44h5"],"search":["#2568a0","#65c9f4","M42 29a13 13 0 1 1-26 0 13 13 0 0 1 26 0z M39 39l12 12 M24 29h10 M29 24v10"],"daily":["#815d3b","#edc67d","M16 16h32v34H16z M23 24h18 M23 31h7 M34 31h7 M23 38h18 M23 45h18"],"chat":["#5055a5","#a7a7fb","M21 15h22q6 0 6 6v18q0 6-6 6H28l-11 8v-8q-3-1-3-6V21q0-6 7-6z M23 27h18 M23 34h13"],"discovery":["#186a63","#67e0bd","M51 32a19 19 0 1 1-38 0 19 19 0 0 1 38 0z M38 26l-6 19-6-13z M32 10v5 M32 49v5"],"museum":["#79529d","#dcb3fa","M13 25l19-11 19 11 M17 25h30 M20 26v20 M29 26v20 M38 26v20 M47 26v20 M13 49h38"],"radar":["#147669","#63eecf","M51 32a19 19 0 1 1-38 0 19 19 0 0 1 38 0z M43 32a11 11 0 1 1-22 0 11 11 0 0 1 22 0z M32 32l13-15"],"upload":["#5762a0","#b3baff","M20 44h-2a9 9 0 0 1-3-17 16 16 0 0 1 31 4 7 7 0 0 1 0 14h-3 M32 51V29 M23 37l9-9 9 9"],"portal":["#85634a","#eab980","M13 15h38v35H13z M13 26h38 M24 26v24 M24 38h27 M18 21h1 M24 21h1"],"mykeep":["#a87b1c","#f5d867","M19 14h20l8 8v27H19z M39 14v8h8 M25 31h14 M25 38h14 M25 45h9"],"gmail":["#ac4d5d","#f8abb1","M13 19h38v27H13z M14 22l18 13 18-13 M13 46l13-15 M51 46L38 31"],"memos":["#7b5893","#d9aff1","M17 17h29v30H17z M23 26h17 M23 33h17 M23 40h10"],"neoma":["#43768b","#86dfec","M32 14l19 11-19 11-19-11z M13 34l19 11 19-11 M13 43l19 11 19-11"],"n8n":["#a24166","#faa1bd","M22 19a5 5 0 1 1-10 0 5 5 0 0 1 10 0z M51 21a5 5 0 1 1-10 0 5 5 0 0 1 10 0z M36 45a6 6 0 1 1-12 0 6 6 0 0 1 12 0z M22 20l19 1 M20 24l8 15 M44 26L34 40"],"nas":["#367b84","#75e5e5","M16 14h32v17H16z M16 36h32v15H16z M21 23h1 M27 23h1 M21 44h1 M27 44h1 M35 23h8 M35 44h8"],"server":["#5d62a2","#b3b8f5","M15 17h34v13H15z M15 35h34v13H15z M22 24h1 M28 24h1 M34 24h9 M22 42h1 M28 42h1 M34 42h9"],"web":["#54708d","#a9d9fa","M15 20h34v28H15z M15 28h34 M21 24h1 M27 24h1 M25 38l5 5 10-12"],"folder":["#8d6a3a","#e7c580","M12 22h16l5 5h19v24H12z M12 22v-6h18l4 6"],"shopping":["#8d4874","#e6a6c8","M19 25h29l-4 25H22z M26 25v-5a8 8 0 0 1 16 0v5"]};
function karinIconSvg(slug){const a=KARIN_ICON_SET[slug]||KARIN_ICON_SET.web;return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop stop-color="'+a[0]+'"/><stop offset="1" stop-color="'+a[1]+'"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="'+a[2]+'"/></g></svg>'}
function karinIconResponse(slug){const svg=karinIconSvg(slug);return svg?new Response(svg,{headers:{'content-type':'image/svg+xml;charset=utf-8','cache-control':'public,max-age=86400','x-content-type-options':'nosniff'}}):new Response('Not found',{status:404})}

export default {async fetch(request,env){const u=new URL(request.url);if(u.pathname.startsWith('/app-icon/')&&u.pathname.endsWith('.svg'))return karinIconResponse(u.pathname.slice(10,-4));if(u.pathname==='/favicon.svg'||u.pathname==='/favicon.ico'){const name=u.hostname.split('.')[0];if(u.pathname==='/favicon.ico'&&name!=='homepage')return Response.redirect(new URL('/favicon.svg',request.url),302);return karinIconResponse(KARIN_ICON_SET[name]?name:'homepage');}if(u.pathname==='/favicon')return getIcon(u);if(u.pathname==='/healthz')return json({ok:true,service:'karin-homepage'});if(u.pathname==='/api/state'){if(request.method==='GET'){let row=await env.DB.prepare('SELECT data,tabs,revision FROM homepage_state WHERE id=1').first();if(!row){const init=INITIAL;await env.DB.prepare('INSERT OR IGNORE INTO homepage_state(id,data,revision) VALUES(1,?,1)').bind(JSON.stringify(init)).run();row=await env.DB.prepare('SELECT data,tabs,revision FROM homepage_state WHERE id=1').first()}return json({groups:JSON.parse(row.data),tabs:JSON.parse(row.tabs||'[{"id":"main","name":"デスクトップ1"}]'),revision:row.revision})}if(request.method==='PUT'){const contentLength=Number(request.headers.get('content-length')||0);if(contentLength>500000)return json({error:'too large'},413);let data;try{data=await request.json()}catch{return json({error:'invalid JSON'},400)}if(!valid(data?.groups)||!Number.isSafeInteger(data?.revision)|| (data.tabs!==undefined&&!validTabs(data.tabs,data.groups)))return json({error:'invalid data'},400);const r=await env.DB.prepare('UPDATE homepage_state SET data=?,tabs=COALESCE(?,tabs),revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?').bind(JSON.stringify(data.groups),data.tabs===undefined?null:JSON.stringify(data.tabs),data.revision).run();if(r.meta.changes!==1)return json({error:'conflict'},409);return json({ok:true,revision:data.revision+1})}return json({error:'method'},405)}if(u.pathname!=='/')return new Response('Not found',{status:404});return new Response(PAGE,{headers})}};
