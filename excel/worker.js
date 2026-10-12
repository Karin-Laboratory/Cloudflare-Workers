// Official GridCraft 0.5.0 WASM hosting. Old D1 data remains intact.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") {
      return Response.json({ok:true, app:"karin-excel", upstream:"GridCraft", version:"0.5.0"}, {
        headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}
      });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed",{status:405,headers:{Allow:"GET, HEAD"}});
    }
    const isWasm = url.pathname.endsWith(".wasm");
    const assetRequest = isWasm
      ? new Request(new URL(url.pathname + ".gz", url.origin),request)
      : request;
    const response = await env.ASSETS.fetch(assetRequest);
    const headers = new Headers(response.headers);
    let body = request.method === "HEAD" ? null : response.body;
    if (isWasm && response.ok && body) {
      body = body.pipeThrough(new DecompressionStream("gzip"));
      headers.delete("Content-Encoding");
      headers.delete("Content-Length");
      headers.delete("ETag");
    }
    headers.set("X-Content-Type-Options","nosniff");
    headers.set("Referrer-Policy","no-referrer");
    if (isWasm) {
      headers.set("Content-Type","application/wasm");
      headers.set("Cache-Control","public, max-age=31536000, immutable");
    } else if (/gridcraft-web-[a-f0-9]+\.js$/.test(url.pathname)) {
      headers.set("Content-Type","text/javascript; charset=utf-8");
      headers.set("Cache-Control","public, max-age=31536000, immutable");
    } else if (url.pathname === "/" || url.pathname === "/index.html") {
      headers.set("Cache-Control","no-cache");
    }
    return new Response(body,{status:response.status,statusText:response.statusText,headers});
  }
};
