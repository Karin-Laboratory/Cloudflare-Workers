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
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    if (url.pathname.endsWith(".wasm")) {
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
