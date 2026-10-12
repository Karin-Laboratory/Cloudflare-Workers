import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { resolve, dirname, relative, sep } from "node:path";
import { unzipSync } from "fflate";

const VERSION = "0.5.0";
const EXPECTED_SHA256 = "196d0070fec6572238298e211ac4a3ea0510b7a0ac8d6096a5ee59f2ff69f85d";
const URL = `https://github.com/storytold/wordcraft/releases/download/v${VERSION}/wordcraft-web-${VERSION}.zip`;
const PREFIX = `wordcraft-web-${VERSION}/`;
const destination = resolve("public");
console.log("Fetching pinned WordCraft Web release", VERSION);
const response = await fetch(URL, { signal: AbortSignal.timeout(120000), headers: { "User-Agent": "Karin-Word-Cloudflare-Build/1.0" } });
if (!response.ok) throw new Error(`Release download HTTP ${response.status}: ${URL}`);
const archive = new Uint8Array(await response.arrayBuffer());
if (archive.byteLength > 30_000_000) throw new Error("Unexpected oversized release archive");
const digest = createHash("sha256").update(archive).digest("hex");
if (digest !== EXPECTED_SHA256) throw new Error(`Release SHA256 mismatch: ${digest}`);
const entries = unzipSync(archive);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
const manifest = [];
const wasmFilename = Object.keys(entries).find(name => name.startsWith(PREFIX) && name.endsWith(".wasm"))?.slice(PREFIX.length);
if (!wasmFilename) throw new Error("Release archive has no WASM module");
for (const [name, bytes] of Object.entries(entries)) {
  if (!name.startsWith(PREFIX) || name.endsWith("/")) continue;
  const suffix = name.slice(PREFIX.length);
  const storedName = suffix.endsWith(".wasm") ? suffix + ".gz" : suffix;
  let data = suffix.endsWith(".wasm") ? gzipSync(bytes, { level: 9 }) : bytes;
  if (suffix === "index.html") {
    let html = Buffer.from(data).toString("utf8");
    if (!/<\\/head>/i.test(html)) throw new Error("Unexpected upstream HTML layout");
    html = html.replace(/<\\/head>/i, '<script defer src="./startup-guard.js"></script></head>');
    // Bust any previously cached broken WASM and JS response when updating this integration.
    html = html.replace(/(wordcraft-web-[0-9a-f]+(?:_bg)?\\.(?:js|wasm))(?=["'])/g, "$1?karin=fix2");
    data = Buffer.from(html);
  }
  const out = resolve(destination, storedName);
  if (!suffix || suffix.startsWith("/") || suffix.includes("\\") || out === destination || !out.startsWith(destination + sep)) {
    throw new Error("Unsafe archive path: " + name);
  }
  // Do not serve upstream deployment docs, hidden server settings or licenses as app assets.
  if (suffix.startsWith(".") || ["HOSTING.md", "_headers", "LICENSE-APACHE", "LICENSE-MIT"].includes(suffix)) continue;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, data);
  manifest.push({ name: storedName, bytes: data.byteLength, originalBytes: bytes.byteLength });
}
const guardText = (await readFile(new URL("../startup-guard.js", import.meta.url), "utf8"))
  .replace("__KARIN_WASM_URL__", wasmFilename + "?karin=fix2");
await writeFile(resolve(destination, "startup-guard.js"), guardText, "utf8");
manifest.push({ name: "startup-guard.js", bytes: Buffer.byteLength(guardText) });
if (!manifest.some(x => x.name === "index.html") || !manifest.some(x => x.name.endsWith(".wasm.gz")) || !manifest.some(x => x.name.endsWith(".js"))) {
  throw new Error("Missing essential WordCraft Web assets");
}
if (manifest.some(x => x.bytes > 24_000_000)) throw new Error("A single asset exceeds Cloudflare Workers Static Assets size allowance");
console.log("WordCraft static assets prepared:", JSON.stringify(manifest));
