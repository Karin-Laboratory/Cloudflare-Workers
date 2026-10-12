import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import wordWorker from "../worker.js";
const dir = new URL("../public/", import.meta.url);
const assets = await readdir(dir);
const index = await readFile(new URL("index.html", dir), "utf8");
assert.match(index, /WordCraft/i);
assert(assets.some(x => /^wordcraft-web-.*\.js$/.test(x)), "Missing compiled JS");
const chunks = assets.filter(x => /^wordcraft-web-.*\.wasm\.part[0-3]$/.test(x)).sort();
assert.equal(chunks.length, 4, "Missing compiled WASM chunks");
const first = await readFile(new URL(chunks[0], dir));
assert.equal(first.subarray(0, 4).toString("hex"), "0061736d", "WASM magic does not match");
const bytes = await Promise.all(chunks.map(async p => (await readFile(new URL(p, dir))).byteLength));
assert.equal(bytes.reduce((a, b) => a + b, 0), 36_329_933, "Reassembled WASM size differs from pinned release");
assert(!/(?:src|href)="\/[a-z]/i.test(index), "Index has root-absolute asset references");
console.log("WordCraft release smoke test passed:", assets.length, "top-level entries");

 
// Node integration smoke: reconstruct the same WASM bytes a browser receives.
// Compare against Trunk's signed SHA384 preload integrity, not merely file size.
const wasmName = chunks[0].replace(/\\.part0$/, "");
const preloadTag = index.match(/<link[^>]+href="[^"]+\\.wasm(?:\\?[^"]*)?"[^>]*>/i)?.[0];
assert(preloadTag, "Missing Trunk WASM preload tag");
const integrity = preloadTag.match(/integrity="sha384-([^"]+)"/)?.[1];
assert(integrity, "Missing Trunk WASM SHA384 integrity");
const testEnv = {
  ASSETS: {
    async fetch(request) {
      const path = new URL(request.url).pathname.slice(1);
      if (!chunks.includes(path)) return new Response("Not Found", { status: 404 });
      return new Response(await readFile(new URL(path, dir)), {
        status: 200,
        headers: { "Content-Type": "application/octet-stream" }
      });
    }
  }
};
const served = await wordWorker.fetch(new Request("https://word.karin-lab.com/" + wasmName + "?karin=parts3"), testEnv);
assert.equal(served.status, 200);
assert.equal(served.headers.get("content-type"), "application/wasm");
const delivered = Buffer.from(await served.arrayBuffer());
assert.equal(delivered.byteLength, 36_329_933);
assert.equal(createHash("sha384").update(delivered).digest("base64"), integrity);
console.log("WordCraft Worker WASM response matches upstream SHA384 SRI (36,329,933 bytes)");
