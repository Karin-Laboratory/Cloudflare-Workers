import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../src/index.js';

const html=readFileSync(new URL('../site.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const marker=';\nconst svg = ';
assert.equal(JSON.parse(js.slice('const PAGE = '.length,js.indexOf(marker))),html,'generated Worker matches editable HTML');
for(const id of ['about','mission','fields','projects','approach','journal','connect','contact'])assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('id="projectSearch"')&&html.includes('data-category="all"'));
assert.ok(html.includes('prefers-reduced-motion')&&html.includes('aria-label'));
assert.ok(html.includes('https://github.com/Karin-Laboratory/openwrt-terminal-6'));
assert.ok(html.includes('https://note.com/deft_llama956'));
assert.ok(html.includes('id="contactEmail" type="email"')&&!html.match(/id="contactEmail"[^>]*required/),'reply email optional');
assert.ok(html.includes('data-sitekey="0x4AAAAAAFl-l9CXccYUediF"'),'Turnstile public key');
assert.ok(html.includes('type="submit" disabled'),'fail closed before status check');
assert.ok(!/192\.168\.|100\.100\.|sbat6a_recovery|masataka88@gmail/.test(html),'no private addresses or secrets');
assert.ok(!/discord\.com\/api\/webhooks\/\d+/.test(js),'webhook URL not hardcoded');

const base='https://www.karin-lab.com';
const env={TURNSTILE_SECRET:'test-secret',DISCORD_WEBHOOK_URL:'https://discord.com/api/webhooks/1234567890/testtoken'};
function formRequest(payload={},origin=base) { return new Request(base+'/api/contact',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({name:'テスト送信者',topic:'question',subject:'技術について',message:'お問い合わせの送信テストです。',email:'',turnstileToken:'sample.turnstile.token',website:'',...payload})});}
async function run(req, e=env){return worker.fetch(req,e,{waitUntil() {}})}
let r=await run(new Request(base+'/api/contact/status'),{});
assert.equal(r.status,200);assert.deepEqual(await r.json(),{ready:false});
r=await run(formRequest(),{});assert.equal(r.status,503,'disabled without secret');
r=await run(new Request(base+'/api/contact/status'));assert.deepEqual(await r.json(),{ready:true});
r=await run(formRequest({},'https://evil.example'));assert.equal(r.status,403,'cross-site rejected');
r=await run(formRequest({message:'short'}));assert.equal(r.status,400,'message validated');
r=await run(formRequest({email:'not-an-email'}));assert.equal(r.status,400,'invalid optional email');
r=await run(formRequest({website:'spam-bot'}));assert.equal(r.status,400,'honeypot');
r=await run(formRequest({turnstileToken:''}));assert.equal(r.status,400,'Turnstile required');
r=await run(new Request(base+'/api/contact',{method:'GET'}));assert.equal(r.status,405);
r=await run(new Request(base+'/favicon.svg'));assert.equal(r.status,200);
r=await run(new Request(base+'/'));assert.equal(r.status,200);assert.ok((await r.text()).includes('id="contactForm"'));
const original=globalThis.fetch;
let discordPayload=null,turnstileBody=null,forceTurnstileFailure=false,forceDiscordFailure=false;
try{
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes('/siteverify')){
   turnstileBody=opts.body;
   return Response.json({success:!forceTurnstileFailure,hostname:'www.karin-lab.com',action:'contact'});
  }
  if(String(url).includes('discord.com/api/webhooks/')){
   discordPayload=JSON.parse(opts.body);
   return new Response(null,{status:forceDiscordFailure?500:204});
  }
  throw Error('unexpected external call');
 };
 r=await run(formRequest());assert.equal(r.status,200,'accepts contact without email');
 assert.equal((await r.json()).ok,true);
 assert.equal(discordPayload.username,'くろこちゃん｜KARIN LAB');
 assert.equal(discordPayload.allowed_mentions.parse.length,0);
 assert.equal(discordPayload.embeds[0].fields.find(x=>x.name.includes('メール')).value,'未記入');
 assert.ok(turnstileBody.get('secret')==='test-secret');
 discordPayload=null;
 r=await run(formRequest({email:'reply@example.test'}));assert.equal(r.status,200);
 assert.equal(discordPayload.embeds[0].fields.find(x=>x.name.includes('メール')).value,'reply@example.test');
 forceTurnstileFailure=true;discordPayload=null;
 r=await run(formRequest());assert.equal(r.status,403,'rejects failed challenge');assert.equal(discordPayload,null);
 forceTurnstileFailure=false;forceDiscordFailure=true;
 r=await run(formRequest());assert.equal(r.status,502,'no false success when Discord fails');
}finally{globalThis.fetch=original}
console.log('PASS: contact form, optional reply email, Turnstile, origin, honeypot, Discord, failure paths');
