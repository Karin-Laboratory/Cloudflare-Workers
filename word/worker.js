// WordCraft upstream v0.5.0 self-hosted static distribution.
// Files are built from the SHA256-pinned release, never from an untrusted runtime CDN.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") {
      return Response.json({ ok: true, app: "karin-word", upstream: "WordCraft", version: "0.5.0" }, {
        headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
      });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const isWasm = url.pathname.endsWith(".wasm");
    const assetRequest = isWasm
      ? new Request(new URL(url.pathname + ".gz", request.url).toString(), request)
      : request;
    const response = await env.ASSETS.fetch(assetRequest);
    const headers = new Headers(response.headers);
    // The stored asset is a .wasm.gz file (36 MB raw, 15 MB gzip).
    // Decompress the stream here, not in the browser: a mismatched
    // Content-Encoding / Content-Length can leave the Trunk app stuck loading.
    let responseBody = responseBody;
    if (isWasm && response.ok && responseBody) {
      responseBody = responseBody.pipeThrough(new DecompressionStream("gzip"));
      headers.delete("Content-Encoding");
      headers.delete("Content-Length");
      headers.delete("ETag");
    }
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    if (isWasm) {
      headers.set("Content-Type", "application/wasm");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (/wordcraft-web-[a-f0-9]+\.js$/.test(url.pathname)) {
      headers.set("Content-Type", "text/javascript; charset=utf-8");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (url.pathname === "/" || url.pathname === "/index.html") {
      headers.set("Cache-Control", "no-cache");
    }
    return new Response(request.method === "HEAD" ? null : response.body, {
      status: response.status, statusText: response.statusText, headers
    });
  }
};
