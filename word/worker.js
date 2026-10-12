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
    if (isWasm) {
      const headers = {
        "Content-Type": "application/wasm",
        "Cache-Control": "public, max-age=31536000, immutable, no-transform",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer"
      };
      if (request.method === "HEAD") {
        return new Response(null, { status: 200, headers });
      }
      // Cloudflare Static Assets caps files at 25 MiB. Keep the exact original
      // uncompressed WASM bytes in four chunks and join them with backpressure.
      let partIndex = 0;
      let partReader = null;
      const stream = new ReadableStream({
        async pull(controller) {
          while (true) {
            if (partReader === null) {
              if (partIndex >= 4) { controller.close(); return; }
              const partURL = new URL(url.pathname + ".part" + partIndex, request.url);
              partIndex++;
              const part = await env.ASSETS.fetch(new Request(partURL, { method: "GET" }));
              if (!part.ok || !part.body) throw new Error("Missing WordCraft WASM part " + (partIndex - 1) + " HTTP " + part.status);
              partReader = part.body.getReader();
            }
            const result = await partReader.read();
            if (result.done) { partReader = null; continue; }
            controller.enqueue(result.value);
            return;
          }
        }
      });
      return new Response(stream, { status: 200, headers });
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    if (/wordcraft-web-[a-f0-9]+\.js$/.test(url.pathname)) {
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
