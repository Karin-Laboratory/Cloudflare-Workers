const CSS = "\n:root{font-family:system-ui,-apple-system,\"Noto Sans JP\",sans-serif;color:#202124;background:#fff;font-size:14px}\n*{box-sizing:border-box}body{margin:0}a{text-decoration:none;color:inherit}a:hover{text-decoration:none}\nheader{display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:14px 22px;border-bottom:1px solid #dadce0;position:sticky;top:0;background:white;z-index:2}\n.brand{font-size:21px;font-weight:600;margin-right:15px;white-space:nowrap}.brand span{color:#1a73e8}.nav{display:flex;gap:5px;align-items:center}.btn{padding:9px 14px;border:1px solid #dadce0;border-radius:8px;display:inline-flex;align-items:center;gap:5px;justify-content:center;background:white;font-weight:500}.btn:hover{background:#f1f3f4}.primary{background:#1a73e8;border-color:#1a73e8;color:white}.primary:hover{background:#1766ca}.red{color:#b3261e}.period{font-size:20px;font-weight:500;margin:0 9px;min-width:140px}.views{display:flex;gap:0;border:1px solid #dadce0;border-radius:9px;overflow:hidden;margin-left:auto}.views a{padding:9px 13px;border-right:1px solid #dadce0}.views a:last-child{border:0}.views .active{background:#e8f0fe;color:#174ea6;font-weight:700}\n.wrap{display:flex;min-height:calc(100vh - 73px)}aside{width:215px;flex:none;padding:22px;border-right:1px solid #e5e7eb}.side-note{color:#6b7280;font-size:12px;line-height:1.9;margin-top:32px}.content{flex:1;min-width:0;padding:12px 18px}.weekdays{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.weekdays div{font-size:12px;color:#5f6368;text-align:center;padding:12px 3px;border-bottom:1px solid #e5e7eb}.month{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-left:1px solid #e5e7eb;border-top:1px solid #e5e7eb}.cell{min-height:120px;min-width:0;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:6px;background:#fff}.cell.muted{background:#fafafa;color:#aaa}.num{display:inline-flex;justify-content:center;align-items:center;width:29px;height:29px;border-radius:100%;margin:0 0 5px 2px}.num:hover{background:#e8f0fe}.today .num{background:#1a73e8;color:#fff}.event{font-size:12px;border-radius:4px;border-left:4px solid #1a73e8;background:#e8f0fe;padding:5px 6px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:3px 0;color:#203048}.event:hover{filter:brightness(.94)}.more{color:#5f6368;font-size:11px;padding:3px}\n.columns{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));min-height:480px}.columns.one{grid-template-columns:1fr}.daycolumn{border:1px solid #e5e7eb;margin-left:-1px;min-width:0;padding:10px}.daycolumn h3{margin:0 0 12px;font-size:13px;color:#666}.daycolumn .event{white-space:normal}.agenda{max-width:780px;margin:auto}.agenda-day{border-bottom:1px solid #eee;padding:14px 8px}.agenda-day h3{font-size:16px;margin:0 0 8px}.empty{padding:40px;color:#666}\n.formcard{max-width:600px;margin:22px auto;padding:28px;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 4px 22px #00000008}.formcard h2{font-size:23px;margin:0 0 20px}.field{display:block;margin:17px 0;font-weight:500;color:#4b5563}.field input:not([type=checkbox]),.field textarea{display:block;width:100%;padding:12px;border:1px solid #d1d5db;border-radius:7px;margin-top:6px;color:#111827;background:white}.field input:focus,.field textarea:focus{outline:2px solid #93c5fd}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.formactions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding-top:12px}.error{background:#fce8e6;color:#9c2222;border-radius:8px;padding:12px;margin:12px 0}.hint{font-size:12px;color:#64748b}\n@media(max-width:750px){header{gap:7px;padding:10px}.brand{font-size:17px;margin-right:0}.period{min-width:0;font-size:17px;margin:0 5px}.views{order:3;margin-left:0;width:100%;justify-content:center}.views a{flex:1;text-align:center}.wrap{min-height:calc(100vh - 105px)}aside{display:none}.content{padding:6px}.cell{min-height:90px;padding:2px}.event{font-size:10px;padding:3px 2px}.num{width:24px;height:24px;font-size:12px}.formcard{margin:6px;padding:16px}.columns{min-width:600px}.columns.one{min-width:0}.content:has(.columns){overflow:auto}.grid2{grid-template-columns:1fr}}\n";
const HMAP = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const h = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => HMAP[c]);
const iso = d => d.toISOString().slice(0,10);
const dateAdd = (s,n) => { const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return iso(d); };
const thisDay = () => { const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(x=>x.type==='year'||x.type==='month'||x.type==='day').map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day; };
const validDay = s => typeof s==='string' && /^\d{4}-\d\d-\d\d$/.test(s) && !Number.isNaN(new Date(s+'T00:00:00Z').getTime()) && iso(new Date(s+'T00:00:00Z'))===s;
const validDateTime = s => typeof s==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(s) && validDay(s.slice(0,10)) && +s.slice(11,13)<24 && +s.slice(14,16)<60;
const monthDay=s=>s.slice(0,7);
const link=(view,day)=>'/?view='+encodeURIComponent(view)+'&date='+encodeURIComponent(day);
const dayLink=day=>'/new?date='+encodeURIComponent(day);
const html=(body,status=200)=>new Response('<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><title>Karin Calendar</title><style>'+CSS+'</style></head><body>'+body+'</body></html>',{status,headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none';style-src 'unsafe-inline';img-src 'self';base-uri 'none';frame-ancestors 'none';form-action 'self'" }});
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const nav=(v,day)=>{const year=+day.slice(0,4),month=+day.slice(5,7);let prev,next,label;
if(v==='month'){prev=year+'-'+String(month-1||12).padStart(2,'0')+'-01';next=year+'-'+String(month+1===13?1:month+1).padStart(2,'0')+'-01';if(month===1)prev=(year-1)+'-12-01';if(month===12)next=(year+1)+'-01-01';label=year+'年 '+month+'月'}
else if(v==='week'){let dt=new Date(day+'T00:00:00Z'),start=dateAdd(day,-dt.getUTCDay());prev=dateAdd(day,-7);next=dateAdd(day,7);label=start+' ～ '+dateAdd(start,6)}
else if(v==='day'){prev=dateAdd(day,-1);next=dateAdd(day,1);label=day}
else {prev=dateAdd(day,-30);next=dateAdd(day,30);label=day+' から30日';}
let views=['month','week','day','agenda'];let titles=['月','週','日','予定リスト'];return '<header><div class="brand"><span>▦</span> Karin Calendar</div><nav class="nav"><a class="btn" href="'+link(v,thisDay())+'">今日</a><a class="btn" aria-label="前へ" href="'+link(v,prev)+'">‹</a><a class="btn" aria-label="次へ" href="'+link(v,next)+'">›</a></nav><div class="period">'+h(label)+'</div><nav class="views">'+views.map((item,i)=>'<a class="'+(v===item?'active':'')+'" href="'+link(item,day)+'">'+titles[i]+'</a>').join('')+'</nav><a class="btn primary" href="'+dayLink(day)+'">＋ 予定を作成</a></header>'};
const layout=(body,v,day)=>nav(v,day)+'<div class="wrap"><aside><a class="btn primary" href="'+dayLink(day)+'">＋ 作成</a><div class="side-note">マイカレンダー<br>日本時間 (JST)<br>Cloudflare Workers + D1<br>個人用・アクセス制限あり</div></aside><main class="content">'+body+'</main></div>';
const active=(e,day)=>e.start_at.slice(0,10)<=day && e.end_at.slice(0,10)>=day;
const eventCard=e=>'<a class="event" style="border-left-color:'+(/^#[0-9a-f]{6}$/i.test(e.color)?e.color:'#1a73e8')+'" href="/edit?id='+encodeURIComponent(e.id)+'" title="'+h(e.title)+'">'+(e.all_day?'終日':h(e.start_at.slice(11,16)))+'　'+h(e.title)+'</a>';
function calendar(v,day,events,notice){
let start,end,body='';
if(v==='month'){
 const ym=day.slice(0,7),first=ym+'-01',dow=new Date(first+'T00:00:00Z').getUTCDay();start=dateAdd(first,-dow);
 body='<div class="weekdays">'+['日','月','火','水','木','金','土'].map(n=>'<div>'+n+'</div>').join('')+'</div><div class="month">';
 for(let i=0;i<42;i++){const d=dateAdd(start,i),evs=events.filter(e=>active(e,d));body+='<div class="cell '+(d.slice(0,7)!==ym?'muted ':'')+(d===thisDay()?'today':'')+'"><a class="num" href="'+dayLink(d)+'" title="予定を作成">'+Number(d.slice(8))+'</a>'+evs.slice(0,5).map(eventCard).join('')+(evs.length>5?'<div class="more">ほか'+(evs.length-5)+'件</div>':'')+'</div>';}
 body+='</div>';
}else if(v==='week'||v==='day'){
 start=v==='week'?dateAdd(day,-new Date(day+'T00:00:00Z').getUTCDay()):day;
 const n=v==='week'?7:1;body='<div class="columns '+(n===1?'one':'')+'">';
 for(let i=0;i<n;i++){const d=dateAdd(start,i);body+='<div class="daycolumn"><h3><a href="'+dayLink(d)+'">'+h(d)+' ('+['日','月','火','水','木','金','土'][new Date(d+'T00:00:00Z').getUTCDay()]+') ＋</a></h3>'+events.filter(e=>active(e,d)).map(eventCard).join('')+'</div>'}
 body+='</div>';
}else{
 for(let i=0;i<30;i++){let d=dateAdd(day,i),evs=events.filter(e=>active(e,d));if(evs.length)body+='<div class="agenda-day"><h3>'+h(d)+'</h3>'+evs.map(eventCard).join('')+'</div>';}
 if(!body)body='<p class="empty">予定はありません。「＋ 予定を作成」から登録できます。</p>';body='<div class="agenda">'+body+'</div>';
}
return (notice?'<div class="error">'+h(notice)+'</div>':'')+body;
}
function editForm(e,day){const base=validDay(day)?day:thisDay(),isEdit=!!e;
const start=e?e.start_at:base+'T09:00',end=e?e.end_at:base+'T10:00';
const field=(title,name,value,kind='text',required=false)=>'<label class="field">'+title+'<input name="'+name+'" type="'+kind+'" value="'+h(value)+'" '+(required?'required':'')+'></label>';
let b='<div class="formcard"><h2>'+(isEdit?'予定を編集':'新しい予定')+'</h2><form method="post" action="/save">';
if(isEdit)b+='<input type="hidden" name="id" value="'+h(e.id)+'">';
b+=field('タイトル','title',e?e.title:'','text',true);
b+='<div class="grid2">'+field('開始','start_at',start,'datetime-local',true)+field('終了','end_at',end,'datetime-local',true)+'</div>';
b+='<label class="field"><input type="checkbox" name="all_day" value="1" '+(e&&e.all_day?'checked':'')+'> 終日</label>';
b+=field('場所','location',e?e.location:'');
b+='<label class="field">説明<textarea name="description" rows="4">'+h(e?e.description:'')+'</textarea></label>';
b+=field('予定の色','color',e?e.color:'#1a73e8','color');
b+='<div class="formactions"><button class="btn primary" type="submit">保存する</button><a class="btn" href="'+link('month',base)+'">キャンセル</a></div></form>';
if(isEdit)b+='<form method="post" action="/delete" style="margin-top:20px"><input type="hidden" name="id" value="'+h(e.id)+'"><button class="btn red" type="submit">この予定を削除</button></form>';
return b+'</div>';
}
const invalid=(m)=>html('<div class="formcard"><h2>入力を確認してください</h2><div class="error">'+h(m)+'</div><a class="btn" href="/">カレンダーに戻る</a></div>',400);
const allowPost=req=>{const origin=req.headers.get('origin'),site=req.headers.get('sec-fetch-site');return (!origin||origin===new URL(req.url).origin)&&(!site||site==='same-origin'||site==='none')};
const extract=d=>({title:String(d.get('title')||'').trim(),start_at:String(d.get('start_at')||''),end_at:String(d.get('end_at')||''),all_day:d.get('all_day')==='1'?1:0,location:String(d.get('location')||''),description:String(d.get('description')||''),color:String(d.get('color')||'#1a73e8')});
const checked=e=>e.title.length>0&&e.title.length<=180&&validDateTime(e.start_at)&&validDateTime(e.end_at)&&e.end_at>e.start_at&&e.location.length<=300&&e.description.length<=10000&&/^#[0-9a-f]{6}$/i.test(e.color);
const redirect=date=>new Response(null,{status:303,headers:{location:link('month',date),'cache-control':'no-store'}});
async function api(req,env,url){
 const path=url.pathname,method=req.method,id=path.startsWith('/api/events/')?path.slice('/api/events/'.length):'';
 if(path==='/api/events'&&method==='GET'){let from=url.searchParams.get('from'),to=url.searchParams.get('to');if(!validDay(from)||!validDay(to))return json({error:'Invalid date range'},400);const r=await env.DB.prepare('SELECT * FROM events WHERE start_at < ? AND end_at >= ? ORDER BY start_at LIMIT 2000').bind(to+'T00:00',from+'T00:00').all();return json(r.results);}
 if((path==='/api/events'&&method==='POST'||id&&method==='PUT')&&allowPost(req)){
  let d=await req.json(),e={title:String(d.title||'').trim(),start_at:d.start_at,end_at:d.end_at,all_day:d.all_day?1:0,location:String(d.location||''),description:String(d.description||''),color:String(d.color||'#1a73e8')};
  if(!checked(e))return json({error:'Invalid event'},400);
  if(method==='PUT'){const r=await env.DB.prepare('UPDATE events SET title=?,start_at=?,end_at=?,all_day=?,location=?,description=?,color=? WHERE id=?').bind(e.title,e.start_at,e.end_at,e.all_day,e.location,e.description,e.color,id).run();return json({ok:r.meta.changes>0},r.meta.changes?200:404);}
  const newid=crypto.randomUUID();await env.DB.prepare('INSERT INTO events(id,title,start_at,end_at,all_day,location,description,color) VALUES (?,?,?,?,?,?,?,?)').bind(newid,e.title,e.start_at,e.end_at,e.all_day,e.location,e.description,e.color).run();return json({id:newid},201);
 }
 if(id&&method==='DELETE'&&allowPost(req)){const r=await env.DB.prepare('DELETE FROM events WHERE id=?').bind(id).run();return json({ok:r.meta.changes>0},r.meta.changes?200:404);}
 return json({error:'Not found or denied'},404);
}
const karinOriginalWorker = {async fetch(req,env){
 const url=new URL(req.url),path=url.pathname;
 try{
  if(path==='/healthz')return json({ok:true,version:'2026-10-08-server-render'});
  if(path.startsWith('/api/'))return await api(req,env,url);
  if(req.method==='GET'&&path==='/new')return html(layout(editForm(null,url.searchParams.get('date')),'month',thisDay()));
  if(req.method==='GET'&&path==='/edit'){const id=url.searchParams.get('id');if(!id)return invalid('予定IDがありません');const e=await env.DB.prepare('SELECT * FROM events WHERE id=?').bind(id).first();if(!e)return invalid('予定が見つかりません');return html(layout(editForm(e,e.start_at.slice(0,10)),'month',e.start_at.slice(0,10)));}
  if(req.method==='POST'&&path==='/save'){if(!allowPost(req))return invalid('リクエストを許可できません');const data=await req.formData(),e=extract(data),id=String(data.get('id')||'');if(!checked(e))return invalid('予定のタイトル・時刻・入力内容を確認してください');
   if(id){const r=await env.DB.prepare('UPDATE events SET title=?,start_at=?,end_at=?,all_day=?,location=?,description=?,color=? WHERE id=?').bind(e.title,e.start_at,e.end_at,e.all_day,e.location,e.description,e.color,id).run();if(!r.meta.changes)return invalid('更新する予定が見つかりません');}
   else{await env.DB.prepare('INSERT INTO events(id,title,start_at,end_at,all_day,location,description,color) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),e.title,e.start_at,e.end_at,e.all_day,e.location,e.description,e.color).run();}
   return redirect(e.start_at.slice(0,10));
  }
  if(req.method==='POST'&&path==='/delete'){if(!allowPost(req))return invalid('リクエストを許可できません');const data=await req.formData(),id=String(data.get('id')||'');if(!id)return invalid('予定IDがありません');await env.DB.prepare('DELETE FROM events WHERE id=?').bind(id).run();return redirect(thisDay());}
  if(req.method==='GET'&&path==='/'){
   let v=url.searchParams.get('view')||'month';if(!['month','week','day','agenda'].includes(v))v='month';
   let day=url.searchParams.get('date');if(!validDay(day))day=thisDay();
   let from,to;if(v==='month'){const first=monthDay(day)+'-01';from=dateAdd(first,-new Date(first+'T00:00:00Z').getUTCDay());to=dateAdd(from,42);}
   else if(v==='week'){from=dateAdd(day,-new Date(day+'T00:00:00Z').getUTCDay());to=dateAdd(from,7);}
   else if(v==='day'){from=day;to=dateAdd(day,1);}
   else{from=day;to=dateAdd(day,30);}
   let events=[],notice='';try{const res=await env.DB.prepare('SELECT * FROM events WHERE start_at < ? AND end_at >= ? ORDER BY start_at LIMIT 2000').bind(to+'T00:00',from+'T00:00').all();events=res.results||[];}catch(e){notice='予定の読み込みに失敗しました。日付枠は表示しています。';}
   return html(layout(calendar(v,day,events,notice),v,day));
  }
  return html('<div class="formcard"><h2>ページが見つかりません</h2><a class="btn" href="/">カレンダーへ</a></div>',404);
 }catch(err){return html('<div class="formcard"><h2>処理に失敗しました</h2><p>時間をおいて再度お試しください。</p><a class="btn" href="/">カレンダーへ</a></div>',500);}
}};

const KARIN_FAVICON_SVG="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"g\"><stop stop-color=\"#9f406b\"/><stop offset=\"1\" stop-color=\"#f6a2b7\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"15\" fill=\"url(#g)\"/><g stroke=\"#fff\" stroke-width=\"3.2\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 19h34v31H15z M23 14v10 M41 14v10 M15 29h34 M23 37h5 M34 37h5 M23 44h5\"/></g></svg>";
export default {...karinOriginalWorker,async fetch(request,env,ctx){const pathname=new URL(request.url).pathname;if(pathname==='/favicon.svg')return new Response(KARIN_FAVICON_SVG,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public,max-age=86400','x-content-type-options':'nosniff'}});if(pathname==='/favicon.ico')return Response.redirect(new URL('/favicon.svg',request.url),302);const response=await karinOriginalWorker.fetch(request,env,ctx);if(response.status===200&&!response.webSocket&&(response.headers.get('content-type')||'').toLowerCase().includes('text/html'))return new HTMLRewriter().on('head',{element(el){el.append('<link rel="icon" href="/favicon.svg" type="image/svg+xml">',{html:true})}}).transform(response);return response;}};