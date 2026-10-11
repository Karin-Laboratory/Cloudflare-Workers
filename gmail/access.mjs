const encoder = new TextEncoder();
let jwksCache;
const baseHeaders = { 'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY' };
function json(body, status=200) { return Response.json(body, { status, headers:baseHeaders }); }
function decode(s) { if(!/^[A-Za-z0-9_-]+$/.test(s)) throw Error('jwt'); return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0)); }
export async function authenticate(request, env) {
  try {
    const token=request.headers.get('Cf-Access-Jwt-Assertion');
    if(!token || token.length>16384 || !env.ACCESS_TEAM || !env.ACCESS_AUD) return null;
    const parts=token.split('.'); if(parts.length!==3) return null;
    const header=JSON.parse(new TextDecoder().decode(decode(parts[0])));
    if(header.alg!=='RS256' || typeof header.kid!=='string') return null;
    const issuer=env.ACCESS_TEAM.replace(/\/$/,'');
    if(!jwksCache || jwksCache.issuer!==issuer || jwksCache.until<Date.now()) {
      const response=await fetch(issuer+'/cdn-cgi/access/certs');
      if(!response.ok) return null;
      const data=await response.json();
      jwksCache={issuer,keys:data.keys,until:Date.now()+300000};
    }
    const jwk=jwksCache.keys.find(k=>k.kid===header.kid && k.kty==='RSA');
    if(!jwk) return null;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),encoder.encode(parts[0]+'.'+parts[1]))) return null;
    const claims=JSON.parse(new TextDecoder().decode(decode(parts[1]))), now=Math.floor(Date.now()/1000);
    if(claims.iss!==issuer || !Array.isArray(claims.aud) || !claims.aud.includes(env.ACCESS_AUD) || !Number.isFinite(claims.exp) || claims.exp<=now || (claims.nbf!==undefined && (!Number.isFinite(claims.nbf)||claims.nbf>now)) || (claims.iat!==undefined && (!Number.isFinite(claims.iat)||claims.iat>now+30)) || claims.type!=='app' || typeof claims.email!=='string' || !claims.email.includes('@')) return null;
    return {email:claims.email.toLowerCase(),owner:claims.email.toLowerCase()===env.OWNER_EMAIL?.toLowerCase()};
  } catch { return null; }
}
