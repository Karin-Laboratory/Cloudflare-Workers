# Karin Word: WordCraft Web (v0.5.0)

Deploy the original **WordCraft** browser editor, not a mock UI, at https://word.karin-lab.com .

- Upstream: https://github.com/storytold/wordcraft (MIT OR Apache-2.0).
- Release: https://github.com/storytold/wordcraft/releases/tag/v0.5.0
- Self-hosted WebAssembly assets are fetched during the Cloudflare build; nothing is loaded from a runtime third-party CDN.
- SHA256 of `wordcraft-web-0.5.0.zip` is pinned in `scripts/prepare-assets.mjs`.
- `npm install --no-audit --no-fund && npm run check && npx wrangler deploy --dry-run` validates build and static contents.
- `npx wrangler deploy --keep-vars` publishes Worker `karin-word`.
- Cloudflare Workers Builds: GitHub repo `Karin-Laboratory/Cloudflare-Workers`, branch `main`, root `/word`, watch `word/**`.
- `public/` is generated (do not commit the upstream WASM file). Cloudflare Workers Static Assets provides the site. Worker sets the WASM MIME type and safe caching policy.
- Basic launch check: `/healthz` should report `ok:true`; then check document creation and DOCX open/export in an actual browser.
- **WASM distribution:** WordCraft's 36,329,933-byte module exceeds Cloudflare Static Assets' 25 MiB per-file limit. The build splits it into four sub-25MiB assets, and `worker.js` streams the original bytes back as `application/wasm`. The Node integration test verifies the assembled response against the upstream SHA-384 SRI.
- **Deployment incident report (日本語):** [Cloudflare Workers × WordCraft Web: 起動までの障害記録](docs/cloudflare-wasm-deployment-postmortem.md), including the stuck `Loading WordCraft…` screen, gzip experiments, API 504 retries, and the final verified fix.
- Privacy: browser document save/export is local to the browser as implemented upstream. **No Karin cloud auto-save, D1, or R2 integration** has been added.
- WordCraft is alpha software; DOCX round-trip fidelity is not guaranteed. Back up original documents.

Licenses and attribution belong to the upstream WordCraft project; this integration does not relicense upstream code.
