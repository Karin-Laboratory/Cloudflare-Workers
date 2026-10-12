# Karin Excel

Cloudflare Workers + D1 に保存する、Karin-Lab専用Web表計算エディター。

- Excel風UI: x-spreadsheet 1.1.5（MIT）
- XLSX/CSV入出力: SheetJS Community Edition 0.20.3（Apache-2.0）
- 表計算数式、セル書式、複数シート、元に戻す、セルのコピー貼り付け等
- 複数ブック、D1への1.5秒後自動保存、Ctrl+S、楽観ロック、失敗時のlocalStorage一時保管
- Cloudflare Access「Owner only」、セッション30日で本人限定
- VBA、マクロ、ピボット、Excel高度な機能の完全互換なし。XLSX書き出しでは一部の書式は非対応。
- SheetJS 0.20.3 はビルド時に公式配布パッケージからローカル静的アセットへ展開し、Cloudflare Workers Static Assetsで自サイト配信。ブラウザの外部CDN接続は不要（x-spreadsheetはWorker経由キャッシュ配信）。

デプロイ：`npm install && npm run check && npx wrangler deploy`（ルートディレクトリ `excel`）。
Cloudflare Workers Builds: GitHub `Karin-Laboratory/Cloudflare-Workers` の `main` / root `excel` / watch path `excel/**`。

D1データベース名は `karin-excel`。DBを再作成せずにバインド維持。
公開リポジトリのため個人データや秘密情報は保存しない。
