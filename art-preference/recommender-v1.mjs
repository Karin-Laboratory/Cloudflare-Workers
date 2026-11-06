/**
 * v1 deterministic pairwise painting recommender.
 * Dataset is immutable. No per-user or cross-user online learning.
 * Timing correction remains an explicitly testable hypothesis.
 */
export const MODEL_VERSION="art-1024-pairwise-v1-candidate";
export const QUESTION_COUNT=8;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const delta=(a,b)=>a.map((x,i)=>x-b[i]);
const norm=(a)=>Math.sqrt(dot(a,a));
const cosine=(a,b)=>dot(a,b)/Math.max(1e-9,norm(a)*norm(b));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function validateCatalog(items,required=1024){
 if(!Array.isArray(items)||items.length!==required)throw new Error("Expected exactly "+required+" artworks");
 const dims=items[0]?.features?.length;
 if(!Number.isInteger(dims)||dims<4||dims>256)throw new Error("Missing or invalid image features");
 const unique=new Set();
 for(const item of items){
  if(!item?.id||unique.has(item.id)||!Array.isArray(item.features)||item.features.length!==dims||!item.features.every(Number.isFinite))throw new Error("Invalid catalog item: "+item?.id);
  unique.add(item.id);
 }
 return dims;
}
export function timingWeights(records,{enable=true}={}){
 if(!enable||records.length<4)return records.map(()=>1);
 const logs=records.map(r=>Math.log(clamp(r.ms/1000,.15,60)));
 const mean=logs.reduce((a,b)=>a+b,0)/logs.length;
 const variance=logs.reduce((a,b)=>a+(b-mean)**2,0)/Math.max(1,logs.length-1);
 const scale=Math.sqrt(variance+0.04);
 return logs.map(t=>(t-mean)/scale>0?0.75:1);
}
export function preference(records,byId,{timeCorrection=true}={}){
 if(!records.length)return Array(byId.values().next().value.features.length).fill(0);
 const dims=byId.values().next().value.features.length;
 const weights=timingWeights(records,{enable:timeCorrection});
 const u=Array(dims).fill(0);
 records.forEach((r,i)=>{
  const a=byId.get(r.pair[0]),b=byId.get(r.pair[1]);
  if(!a||!b||![0,1].includes(r.choice))throw Error("Invalid answered pair");
  const d=r.choice===0?delta(a.features,b.features):delta(b.features,a.features);
  for(let j=0;j<dims;j++)u[j]+=d[j]*weights[i];
 });
 const scale=Math.max(1,norm(u));
 return u.map(x=>x/scale);
}
function hashState(records,round){
 let h=(2166136261^round)>>>0;
 for(const r of records){for(const id of r.pair){for(let i=0;i<id.length;i++){h^=id.charCodeAt(i);h=Math.imul(h,16777619)>>>0}}h^=(r.choice+1)*65599;h=Math.imul(h,16777619)>>>0;h^=Math.round(r.ms/100);h=Math.imul(h,16777619)>>>0}return h>>>0;
}
export function nextPair(items,records){
 const byId=new Map(items.map(x=>[x.id,x]));
 const exposed=new Set(records.flatMap(x=>x.pair));
 const available=items.filter(x=>!exposed.has(x.id));
 if(available.length<2)return [];
 const u=preference(records,byId,{timeCorrection:false});
 // Bounded candidate sample: O(80^2 x dimensions), not O(1024^2) per question.
 const seed=hashState(records,records.length),indices=new Set();
 for(let k=0;k<Math.min(80,available.length);k++)indices.add((seed+k*131+Math.imul(k,k)*17) % available.length);
 const sample=[...indices].map(i=>available[i]);
 let best=null,bestScore=-Infinity;
 for(let i=0;i<sample.length;i++)for(let j=i+1;j<sample.length;j++){
  const a=sample[i],b=sample[j],d=delta(a.features,b.features);
  const spread=1-cosine(a.features,b.features);
  const uncertainty=1/(1+Math.abs(dot(u,d))*2);
  const score=(records.length<2?spread:0.55*spread+0.45*uncertainty);
  if(score>bestScore+1e-10||(Math.abs(score-bestScore)<1e-10&&[a.id,b.id].join("|")<((best||[]).map(x=>x.id).join("|")))){best=[a,b];bestScore=score}
 }
 if(!best)return [];
 // Seeded, repeatable position assignment; never infer bias from 8 clicks alone.
 return seed%2===0?best:[best[1],best[0]];
}
export function recommend(items,records,{timeCorrection=true,count=3}={}){
 const byId=new Map(items.map(x=>[x.id,x]));
 const exposed=new Set(records.flatMap(x=>x.pair));
 const u=preference(records,byId,{timeCorrection});
 const base=items.filter(x=>!exposed.has(x.id)).map(x=>({...x,score:dot(u,x.features)/Math.max(1e-6,norm(x.features))}));
 base.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const chosen=[],usedArtists=new Set();
 for(let k=0;k<count;k++){
  const options=base.slice(0,Math.min(100,base.length)).filter(x=>!chosen.some(y=>x.id===y.id));
  options.sort((a,b)=>{
   const value=x=>{
    const diversity=chosen.length?Math.min(...chosen.map(y=>1-cosine(x.features,y.features))):0;
    const artistPenalty=usedArtists.has(x.artist)?0.08:0;
    return x.score+0.10*diversity-artistPenalty;
   };
   return value(b)-value(a)||a.id.localeCompare(b.id);
  });
  if(!options.length)break;
  chosen.push(options[0]);usedArtists.add(options[0].artist);
 }
 return {version:MODEL_VERSION,questionCount:records.length,timingMode:timeCorrection?"two-step-unvalidated":"none",sideBiasMode:"none: position counterbalanced",preference:u,recommendations:chosen};
}
export function auditResult(items,records,options){
 const result=recommend(items,records,options);
 const used=new Set(records.flatMap(x=>x.pair));
 if(result.recommendations.some(x=>used.has(x.id)))throw Error("Recommendation includes a displayed artwork");
 return result;
}
