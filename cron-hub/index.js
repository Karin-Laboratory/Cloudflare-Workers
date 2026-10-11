
const HALF_HOUR='*/30 * * * *';
const TWICE_DAILY='5 0,12 * * *';
const TASKS=[
  {id:'karin-portal',binding:'PORTAL',schedule:'half-hour'},
  {id:'karin-radar',binding:'RADAR',schedule:'half-hour'},
  {id:'karin-discovery',binding:'DISCOVERY',schedule:'twice-daily'},
  {id:'karin-indie-app-museum',binding:'MUSEUM',schedule:'twice-daily'},
  {id:'mykeep',binding:'MYKEEP_DB+MYKEEP_IMAGES',schedule:'twice-daily'}
];
async function inspectBindings(env){
 const entries=[['karin-portal','PORTAL'],['karin-radar','RADAR'],['karin-discovery','DISCOVERY'],['karin-indie-app-museum','MUSEUM']];
 const vals=await Promise.all(entries.map(async([name,key])=>{try{return {name,...await env[key].ping()}}catch(e){return {name,ok:false,error:String(e).slice(0,180)}}}));
 try{const db=await env.MYKEEP_DB.prepare('SELECT COUNT(*) AS n FROM notes WHERE deleted_at IS NOT NULL').first();vals.push({name:'mykeep',ok:typeof db?.n==='number',trashed:db.n,r2Bound:!!env.MYKEEP_IMAGES})}
 catch(e){vals.push({name:'mykeep',ok:false,error:String(e).slice(0,180)})}
 return vals;
}
async function purgeMyKeep(env){
 const cutoff=new Date(Date.now()-7*24*60*60*1000).toISOString();
 let lastId='',deleted=0,failed=0,scanned=0;
 while(true){
  const r=await env.MYKEEP_DB.prepare('SELECT id FROM notes WHERE deleted_at IS NOT NULL AND deleted_at <= ? AND id > ? ORDER BY id LIMIT 50').bind(cutoff,lastId).all();
  const rows=r.results||[];
  for(const row of rows){
   lastId=row.id;scanned++;
   try{
    const attachments=await env.MYKEEP_DB.prepare('SELECT r2_key FROM attachments WHERE note_id=?').bind(row.id).all();
    const keys=(attachments.results||[]).map(a=>a.r2_key);
    for(let j=0;j<keys.length;j+=1000)await env.MYKEEP_IMAGES.delete(keys.slice(j,j+1000));
    const result=await env.MYKEEP_DB.prepare('DELETE FROM notes WHERE id=? AND deleted_at IS NOT NULL AND deleted_at <= ?').bind(row.id,cutoff).run();
    deleted+=result.meta.changes||0;
   }catch(e){failed++;console.error('mykeep_purge_item_failed',row.id,String(e))}
  }
  if(rows.length<50)break;
 }
 if(failed)throw Error('mykeep_purge_failed:'+failed);
 return {ok:true,scanned,deleted};
}
async function runJobs(env,jobs){
 const results=await Promise.all(jobs.map(async(name)=>{
  try{
   if(name==='MYKEEP')return {job:'mykeep',...await purgeMyKeep(env)};
   const ans=await env[name].runCron();
   return {job:name,...ans,ok:ans?.ok===true};
  }catch(e){console.error('cron_hub_job_error',name,e);return {job:name,ok:false,error:String(e).slice(0,240)}}
 }));
 console.log('cron_hub_results',JSON.stringify(results));
 if(results.some(x=>!x.ok))throw new Error('cron_hub_partial_failure '+results.filter(x=>!x.ok).map(x=>x.job).join(','));
 return results;
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==='GET'&&url.pathname==='/healthz'){
   const results=await inspectBindings(env);
   return Response.json({hub:'karin-cron-hub',ok:results.every(x=>x.ok),tasks:TASKS,cron:[HALF_HOUR,TWICE_DAILY],bindings:results,time:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}});
  }
  return new Response('Not found',{status:404});
 },
 async scheduled(controller,env,ctx){
  if(controller.cron===HALF_HOUR)await runJobs(env,['PORTAL','RADAR']);
  else if(controller.cron===TWICE_DAILY)await runJobs(env,['DISCOVERY','MUSEUM','MYKEEP']);
  else throw Error('unknown_cron_expression:'+controller.cron);
 }
};
