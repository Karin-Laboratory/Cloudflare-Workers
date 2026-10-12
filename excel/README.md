# Karin GridCraft

The authentic open-source **GridCraft 0.5.0** (Rust / WebAssembly spreadsheet) at https://excel.karin-lab.com/ replaces the previous Karin Excel clone.

- Upstream: https://github.com/storytold/gridcraft (MIT OR Apache-2.0).
- Official web archive: https://github.com/storytold/gridcraft/releases/tag/v0.5.0 .
- Cloudflare Workers Builds downloads the exact pinned release and verifies its SHA256 before deploying.
- Self-hosted JavaScript and WASM. WASM is stored as gzip, then decompressed at the Worker edge to meet Cloudflare static asset limits and return application/wasm.
- XLSX and CSV/TSV, formulas, sheets, charts and samples are provided by upstream.
- **Important:** GridCraft saves locally through the browser download dialog. It does not support the old Karin Excel cloud auto-save or D1 workbook browser.
- The existing D1 database karin-excel is NOT deleted and keeps historical workbook data for recovery. The new Worker does not bind to it.
- Cloudflare Access and the custom domain are preserved.
- Old source snapshot: branch archive-excel-20261012.
- Workers Builds root: /excel, watch path: excel/**, branch: main.
- Check: npm install --no-audit --no-fund && npm run check && npx wrangler deploy --dry-run
- Deploy: npx wrangler deploy --keep-vars
- Smoke test: /healthz and sample workbook, open an XLSX and export it again in a real browser.

This integration retains upstream licenses and branding. GridCraft is pre-alpha; keep backups of important workbooks.
