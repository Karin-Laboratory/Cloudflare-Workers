
const CSS="\n:root{color-scheme:dark;font-family:Inter,system-ui,\"Noto Sans JP\",sans-serif;background:#080e1b;color:#dfe9ff}\n*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 80% -10%,#21456c88,transparent 50%),radial-gradient(ellipse at -10% 60%,#0b505544,transparent 50%),#080e1b}\nbody:before{content:\"\";position:fixed;inset:0;pointer-events:none;opacity:.32;background-image:linear-gradient(#ffffff09 1px,transparent 1px),linear-gradient(90deg,#ffffff09 1px,transparent 1px);background-size:42px 42px}\na{color:inherit;text-decoration:none}button{font:inherit;cursor:pointer}.wrap{position:relative;max-width:1400px;margin:auto;padding:32px 28px 70px}\nheader{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}\n.logo{display:flex;align-items:center;gap:14px}.orb{width:48px;height:48px;border-radius:13px;border:1px solid #46ddc87d;background:linear-gradient(130deg,#125861,#1a254d);box-shadow:0 0 36px #30d5b331;display:grid;place-items:center;font-size:25px}\n.micro,.host,.clock,.field,.foot{font:11px ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.065em;color:#819cbb}\n.brand{font-size:21px;font-weight:850;letter-spacing:.07em;margin-top:4px}.brand b{color:#6cead7}\n.tools{display:flex;align-items:center;gap:14px}.clock{white-space:nowrap}.btn{background:#6cead7;color:#062b33;border:0;border-radius:10px;padding:12px 17px;font-weight:800;box-shadow:0 7px 24px #55daba22}.btn:hover{background:#a0fff2}.btn:focus-visible,a:focus-visible{outline:2px solid #b2fff4;outline-offset:3px}\n.hero{padding:48px 0 15px}.pulse{display:inline-flex;align-items:center;gap:9px;padding:7px 11px;border-radius:30px;background:#0d3037;border:1px solid #2b6b72;color:#80ebd7;font:11px ui-monospace,monospace;letter-spacing:.05em;font-weight:800}.dot{width:7px;height:7px;background:currentColor;border-radius:50%;box-shadow:0 0 8px currentColor;display:inline-block;flex:none}\nh1{font-size:clamp(34px,5vw,62px);letter-spacing:-.065em;line-height:1.13;font-weight:800;margin:20px 0 12px;color:#eff8ff}\nh1 em{font-style:normal;background:linear-gradient(100deg,#62ecd0,#92b4ff);background-clip:text;color:transparent}.lead{color:#8da5c2;line-height:1.7;font-size:15px;margin:0;max-width:800px}\n.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin:29px 0 35px}.metric{background:#122037;border:1px solid #2a425c;border-radius:15px;padding:23px}.metric strong{display:block;font-size:38px;font-weight:800;color:#eaf6ff;margin:7px 0}.metric strong.green{color:#6dedca}.metric strong.violet{color:#b0b4ff}.metric strong.orange{color:#f3be75}.metric small{color:#7e96b1}\n.group-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:30px 0 14px}.group-head h2{font-size:13px;letter-spacing:.13em;margin:0;color:#cce0f8}.group-head span{color:#64819f;font:11px ui-monospace,monospace}\n.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.card{min-width:0;border:1px solid #27445e;border-radius:16px;background:linear-gradient(135deg,#15283e,#101b30);padding:20px;overflow:hidden;transition:.15s}.card:hover{border-color:#5b9a9d;transform:translateY(-2px)}\n.card-head{display:flex;gap:12px;align-items:center}.symbol{height:40px;width:40px;flex:none;display:grid;place-items:center;border-radius:10px;background:#24415b;border:1px solid #3b5671;font-size:22px}.identity{flex:1;min-width:0}.name{font-weight:800;font-size:16px;color:#eef7ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.host{letter-spacing:0;margin-top:5px;font-size:10px;word-break:break-all}.external{color:#8da8c1;font-size:21px}\n.mid{display:flex;justify-content:space-between;align-items:center;gap:7px;margin-top:22px}.chip{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border-radius:30px;font-size:11px;font-weight:750;white-space:nowrap}\n.chip.up{color:#6ff0cb;background:#103d38}.chip.gate{color:#c3c4ff;background:#282a51}.chip.warn{color:#f5c581;background:#42331f}.chip.down{color:#ffabb5;background:#512630}.chip.none{color:#9eacc4;background:#27384a}\n.ms{font-size:13px;font-weight:850;font-variant-numeric:tabular-nums}.ms small{color:#819ab4;font-size:11px}\n.graph{height:65px;width:100%;margin:12px 0 7px}.graph svg{width:100%;height:100%}.placeholder{color:#677f9d;font-size:12px;letter-spacing:.1em;margin:26px 0}\n.bars{display:flex;gap:3px;height:11px}.bar{height:100%;flex:1;min-width:1px;background:#27394c;border-radius:2px}.bar.up{background:#56deb1}.bar.gate{background:#9290ec}.bar.warn{background:#ebba73}.bar.down{background:#ee8191}\n.bottom{border-top:1px solid #30425a;padding-top:12px;margin-top:13px;display:flex;justify-content:space-between;gap:7px;color:#7f96b0;font-size:11px}.bottom b{color:#dbeaf8}\n.panels{display:grid;grid-template-columns:1.2fr 1fr;gap:15px;margin-top:25px}.panel{background:#111f32;border:1px solid #27445e;border-radius:16px;padding:23px}.panel h3{font-size:13px;letter-spacing:.12em;margin:0 0 18px}.note{font-size:12px;color:#8ba2bd;line-height:1.85}.line{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #293c56;font-size:12px}.line:last-child{border:0}.line .label{flex:1}.line time{color:#829fba;font:11px ui-monospace,monospace}\n.disclaimer{margin-top:30px;padding-top:17px;border-top:1px solid #304660;font-size:12px;color:#7793b1;line-height:1.85}.disclaimer strong{color:#b7c9de}.foot{margin-top:38px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}\n@media(max-width:960px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.panels{grid-template-columns:1fr}}\n@media(max-width:650px){.wrap{padding:17px 13px 48px}.tools{width:100%;justify-content:space-between}.brand{font-size:18px}.hero{padding:29px 0 7px}.lead{font-size:13px}.summary{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:18px 0}.metric{padding:15px}.metric strong{font-size:28px}.cards{grid-template-columns:1fr}.card{padding:17px}}\n";
const SERVICES=[
['mykeep','MyKeep','mykeep.karin-lab.com','CLOUDFLARE WORKERS','🗂️'],
['calendar','Karin Calendar','calendar.karin-lab.com','CLOUDFLARE WORKERS','🗓️'],
['upload','Nobody Uploader','upload.karin-lab.com','CLOUDFLARE WORKERS','📦'],
['gmail','Gmail Mirror','gmail.karin-lab.com','CLOUDFLARE WORKERS','✉️'],
['daily','Karin Daily','daily.karin-lab.com','PUBLIC SERVICES','📰'],
['chat','Karin Chat','chat.karin-lab.com','PUBLIC SERVICES','💬'],
['search','Karin Search','search.karin-lab.com','PUBLIC SERVICES','🔎'],
['memos','Memos','memos.karin-lab.com','HOMELAB TUNNELS','📝'],
['n8n','n8n','n8n.karin-lab.com','HOMELAB TUNNELS','⚙️'],
['mealie','Mealie','mealie.karin-lab.com','HOMELAB TUNNELS','🍽️']
];
const LABEL={up:'応答正常',gate:'認証入口が応答',warn:'要確認',down:'接続失敗',none:'未計測'};
const H={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>H[c]);
function jst(time){try{return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(time))}catch(e){return '--'}}
function dot(s){return '<span class="dot"></span>'+esc(LABEL[s]||LABEL.none)}
function spark(rows){
 const data=[...rows].reverse().slice(-30).filter(r=>Number.isFinite(r.duration_ms));
 if(data.length<2)return '<div class="graph"><div class="placeholder">AWAITING TELEMETRY ...</div></div>';
 const max=Math.max(100,...data.map(r=>r.duration_ms));
 const p=data.map((r,i)=>[8+i*244/(data.length-1),56-45*Math.min(1,r.duration_ms/max)]);
 const points=p.map(a=>a[0].toFixed(1)+','+a[1].toFixed(1)).join(' ');
 const last=p[p.length-1];
 return '<div class="graph"><svg viewBox="0 0 260 65" preserveAspectRatio="none"><path d="M0 55H260 M0 33H260 M0 11H260" fill="none" stroke="#2a445c" stroke-dasharray="3 5"/><polyline points="'+points+'" fill="none" stroke="#65e9d1" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="'+last[0].toFixed(1)+'" cy="'+last[1].toFixed(1)+'" r="4" fill="#b8fff0"/></svg></div>';
}
function bars(rows){
 const r=[...rows].reverse().slice(-36);let out='<div class="bars" aria-label="直近36回の履歴">';
 for(let i=0;i<36;i++)out+='<span class="bar '+esc(r[i]?.status||'')+'" title="'+(r[i]?esc(jst(r[i].checked_at)+' '+LABEL[r[i].status]):'未計測')+'"></span>';
 return out+'</div>';
}
function card(s,rows){
 const last=rows[0],state=last?.status||'none',last24=rows.filter(r=>Date.now()-new Date(r.checked_at).getTime()<=86400000);
 const good=last24.filter(r=>r.status==='up'||r.status==='gate').length;
 const ratio=last24.length?Math.round(100*good/last24.length)+'%':'--';
 const ms=last?.duration_ms!=null?Math.round(last.duration_ms):'--';
 const when=last?jst(last.checked_at)+' JST':'未計測';
 const code=last?.code||'--';
 return '<article class="card"><div class="card-head"><div class="symbol">'+s[4]+'</div><div class="identity"><div class="name">'+esc(s[1])+'</div><div class="host">'+esc(s[2])+'</div></div><a class="external" target="_blank" rel="noopener noreferrer" aria-label="'+esc(s[1])+'を開く" href="https://'+esc(s[2])+'/">↗</a></div><div class="mid"><span class="chip '+state+'">'+dot(state)+'</span><div class="ms">'+ms+' <small>ms</small></div></div>'+spark(rows)+bars(rows)+'<div class="bottom"><span>'+esc(when)+'</span><span>HTTP <b>'+esc(code)+'</b> · 24H <b>'+ratio+'</b></span></div></article>';
}
function layout(rows){
 const grouped={};for(const s of SERVICES)grouped[s[0]]=rows.filter(r=>r.service===s[0]).slice(0,100);
 const latest=SERVICES.map(s=>grouped[s[0]][0]).filter(Boolean);
 const up=latest.filter(r=>r.status==='up').length;
 const gate=latest.filter(r=>r.status==='gate').length;
 const check=SERVICES.length-up-gate;
 const changes=[];
 for(const s of SERVICES){const data=grouped[s[0]];for(let i=0;i<Math.min(50,data.length-1);i++)if(data[i].status!==data[i+1].status)changes.push({name:s[1],row:data[i]})}
 changes.sort((a,b)=>b.row.checked_at.localeCompare(a.row.checked_at));
 const newest=latest.length?latest.map(r=>r.checked_at).sort().at(-1):null;
 let out='<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#080e1b"><meta name="robots" content="noindex,nofollow"><title>Karin Radar | Mission Control</title><style>'+CSS+'</style></head><body><div class="wrap">';
 out+='<header><div class="logo"><div class="orb">◉</div><div><div class="micro">NOBODY LABORATORY / MISSION CONTROL</div><div class="brand">KARIN <b>RADAR</b></div></div></div><div class="tools"><span class="clock">JST · '+esc(jst(new Date().toISOString()))+'</span><form method="post" action="/check"><button class="btn">↻ 今すぐチェック</button></form></div></header>';
 out+='<section class="hero"><span class="pulse"><span class="dot"></span> CONTROL ROOM ONLINE</span><h1>Every service.<br><em>One heartbeat.</em></h1><p class="lead">Karin-LabのサービスをCloudflareから定点観測。稼働状況、応答時間、24時間の応答率を可視化する個人用管制盤。</p></section>';
 const stats=[['MONITORED NODES',SERVICES.length,'登録済みサービス',''],['APP RESPONSE',up,'アプリが直接応答','green'],['AUTH GATEWAYS',gate,'認証入口の応答','violet'],['NEEDS ATTENTION',check,'障害疑い・未計測','orange']];
 out+='<section class="summary">'+stats.map(s=>'<div class="metric"><div class="micro">'+s[0]+'</div><strong class="'+s[3]+'">'+s[1]+'</strong><small>'+s[2]+'</small></div>').join('')+'</section>';
 for(const name of ['CLOUDFLARE WORKERS','PUBLIC SERVICES','HOMELAB TUNNELS']){
 const ss=SERVICES.filter(s=>s[3]===name);
 out+='<div class="group-head"><h2>◈ '+name+'</h2><span>'+ss.length+' NODES</span></div><section class="cards">'+ss.map(s=>card(s,grouped[s[0]])).join('')+'</section>';
 }
 out+='<div class="panels"><section class="panel"><h3>◷ STATUS TRANSITIONS / 状態変化</h3>';
 if(!changes.length)out+='<p class="note">まだ状態変化の記録はありません。30分ごとの観測で履歴が蓄積されます。</p>';
 else for(const c of changes.slice(0,6))out+='<div class="line"><time>'+esc(jst(c.row.checked_at))+'</time><span class="label">'+esc(c.name)+'</span><span class="chip '+esc(c.row.status)+'">'+dot(c.row.status)+'</span></div>';
 out+='</section><section class="panel"><h3>◈ TELEMETRY / 監視情報</h3><p class="note">Cloudflare Workerから10サイトへHTTPSでアクセスし、HTTPステータスと応答時間を測定しています。定期チェックは30分間隔、履歴は30日保存です。</p><p class="note">最新計測: '+esc(newest?jst(newest)+' JST':'未計測')+'<br>手動チェックも実行できます。アプリへ移動するときは↗をクリックしてください。</p><p class="note">🟢 正常　🟣 認証　🟠 要確認　🔴 失敗</p></section></div>';
 out+='<div class="disclaimer"><strong>判定の注意:</strong> 「応答正常」はHTTP 2xxまたは通常の3xxを受け取った状態です。「認証入口が応答」はCloudflare Access等のログイン画面が応答した状態で、背後のアプリが正常とは限りません。24Hの値はこの両者を含めた<strong>公開URLの応答率</strong>です。内部処理・ログイン後の機能・稼働率SLAは保証しません。</div>';
 out+='<footer class="foot"><span>KARIN RADAR / EXPERIMENT 001</span><span>CLOUDFLARE WORKERS + D1 · NO VPS REQUIRED</span></footer></div></body></html>';
 return out;
}
const reply=(body,status=200,type='text/html; charset=utf-8')=>new Response(body,{status,headers:{'content-type':type,'cache-control':'no-store','x-content-type-options':'nosniff','x-robots-tag':'noindex,nofollow','referrer-policy':'no-referrer','content-security-policy':"default-src 'none';style-src 'unsafe-inline';base-uri 'none';form-action 'self';frame-ancestors 'none'"}});
async function measure(s){
 const t=Date.now();let state='down',code=null,info='';
 try{
  const resp=await fetch('https://'+s[2]+'/',{method:'GET',redirect:'manual',signal:AbortSignal.timeout(7000),headers:{accept:'text/html,application/xhtml+xml,*/*','user-agent':'KarinRadar/1.0'}});
  code=resp.status;
  const loc=resp.headers.get('location')||'';
  if(code>=200&&code<300)state='up';
  else if(code>=300&&code<400)state=/cloudflareaccess|\/cdn-cgi\/access|\/login|\/signin|oauth|auth/i.test(loc)?'gate':'up';
  else if(code===401||code===403)state='gate';
  else if([404,405,429].includes(code))state='warn';
  info=loc.slice(0,150);
  if(resp.body)try{await resp.body.cancel()}catch(e){}
 }catch(e){info=String(e?.name||'network').slice(0,100)}
 return {service:s[0],checked_at:new Date().toISOString(),status:state,code,duration_ms:Date.now()-t,info};
}
async function run(env){
 const results=await Promise.all(SERVICES.map(measure));
 const batch=results.map(r=>env.DB.prepare('INSERT INTO checks(service,checked_at,status,code,duration_ms,info) VALUES(?,?,?,?,?,?)').bind(r.service,r.checked_at,r.status,r.code,r.duration_ms,r.info));
 await env.DB.batch(batch);
 await env.DB.prepare("DELETE FROM checks WHERE checked_at < datetime('now','-30 days')").run();
 return results;
}
async function read(env){const r=await env.DB.prepare("SELECT service,checked_at,status,code,duration_ms,info FROM checks WHERE checked_at > datetime('now','-32 days') ORDER BY id DESC LIMIT 10000").all();return r.results||[]}
const karinOriginalWorker = {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==='GET'&&url.pathname==='/healthz')return reply(JSON.stringify({ok:true,service:'karin-radar'}),200,'application/json');
  if(request.method==='POST'&&url.pathname==='/check'){
   const origin=request.headers.get('origin'),site=request.headers.get('sec-fetch-site');
   if((origin&&origin!==url.origin)||(site&&site!=='same-origin'&&site!=='none'))return reply('Forbidden',403,'text/plain');
   try{await run(env)}catch(e){return reply('計測に失敗しました。再試行してください。',500,'text/plain')}
   return new Response(null,{status:303,headers:{location:'/' ,'cache-control':'no-store'}});
  }
  if(request.method!=='GET'||url.pathname!=='/')return reply('Not found',404,'text/plain');
  try{let rows=await read(env);if(!rows.length){await run(env);rows=await read(env)}return reply(layout(rows))}
  catch(e){return reply('<!doctype html><meta charset="utf-8"><title>Karin Radar</title><div style="background:#080e1b;color:white;padding:48px;font:16px sans-serif"><h1>Karin Radar</h1>監視画面の読み込みに失敗しました。<a style="color:#5df0cf" href="/">もう一度開く</a></div>',500)}
 },
 async scheduled(event,env,ctx){ctx.waitUntil(run(env))}
};

import { WorkerEntrypoint } from "cloudflare:workers";
export class CronRunner extends WorkerEntrypoint {
  ping() {return {ok:true,service:"karin-radar",rpc:"CronRunner"};}
  async runCron(){await run(this.env);return {ok:true,service:"karin-radar"};}
}

const KARIN_FAVICON_SVG="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"g\"><stop stop-color=\"#147669\"/><stop offset=\"1\" stop-color=\"#63eecf\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"15\" fill=\"url(#g)\"/><g stroke=\"#fff\" stroke-width=\"3.2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M51 32a19 19 0 1 1-38 0 19 19 0 0 1 38 0z M43 32a11 11 0 1 1-22 0 11 11 0 0 1 22 0z M32 32l13-15\"/></g></svg>";
export default {...karinOriginalWorker,async fetch(request,env,ctx){const pathname=new URL(request.url).pathname;if(pathname==='/favicon.svg')return new Response(KARIN_FAVICON_SVG,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public,max-age=86400','x-content-type-options':'nosniff'}});if(pathname==='/favicon.ico')return Response.redirect(new URL('/favicon.svg',request.url),302);const response=await karinOriginalWorker.fetch(request,env,ctx);if(response.status===200&&!response.webSocket&&(response.headers.get('content-type')||'').toLowerCase().includes('text/html'))return new HTMLRewriter().on('head',{element(el){el.append('<link rel="icon" href="/favicon.svg" type="image/svg+xml">',{html:true})}}).transform(response);return response;}};