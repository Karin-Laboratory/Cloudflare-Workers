# Cloudflare Workers | Karin-Lab

Cloudflare Workers で動かす Karin-Lab 個人開発アプリのソースコードを、ひとつの GitHub リポジトリで管理するためのモノレポです。

## Cloudflare Worker 一覧（2026-10-26）
以下の **18本すべて** を `main` の独立ディレクトリで管理します。Cloudflare Workers Builds は対応する `<folder>/**` の変更時だけその Worker をビルド・デプロイします。

| アプリ | Worker | 公開先 |
|---|---|---|
| [video-vision/](./video-vision/) | `karin-video-vision` | `vision.karin-lab.com` |
| [mykeep/](./mykeep/) | `mykeep` | `mykeep.karin-lab.com` |
| [notepad/](./notepad/) | `karin-notepad` | `notepad.karin-lab.com` |
| [excel/](./excel/) | `karin-excel` | `excel.karin-lab.com` |
| [word/](./word/) | `karin-word` | `word.karin-lab.com` |
| [proxy/](./proxy/) | `karin-proxy` | `proxy.karin-lab.com` |
| [calendar/](./calendar/) | `karin-calendar` | `calendar.karin-lab.com` |
| [koyomi/](./koyomi/) | `today-japan-seasons` | `today-japan-seasons.karin-laboratory.workers.dev` |
| [discovery/](./discovery/) | `karin-discovery` | `discovery.karin-lab.com` |
| [gmail/](./gmail/) | `karin-gmail-mirror` | `gmail.karin-lab.com` |
| [homepage/](./homepage/) | `karin-homepage` | `homepage.karin-lab.com` |
| [museum/](./museum/) | `karin-indie-app-museum` | `museum.karin-lab.com` |
| [portal/](./portal/) | `karin-portal` | `portal.karin-lab.com` |
| [radar/](./radar/) | `karin-radar` | `radar.karin-lab.com` |
| [upload/](./upload/) | `nobody-uploader` | `upload.karin-lab.com` |
| [cron-hub/](./cron-hub/) | `karin-cron-hub` | 非公開・Cron専用 |
| [neoma/](./neoma/) | `karin-neoma` | カスタムドメインなし |
| [uploader-legacy/](./uploader-legacy/) | `karin-uploader` | カスタムドメインなし・旧版 |

自動ビルド: 各フォルダで `npm install --no-audit --no-fund && npm run check && npx wrangler deploy --dry-run` を検証し、成功時のみ `npx wrangler deploy --keep-vars` で既存の本番Workerへ反映します。

**重要:** GitHubは公開リポジトリです。Workerシークレット、メールアドレス、Cloudflare Access認証設定の実値、OAuth資格情報は保存しません。GitHubのソースを正本とし、既存D1・R2・KV・Cron・Durable Objectsはデータを再作成せずそのまま使います。

---
## アプリ

| フォルダ | 本番Worker | 役割 |
| --- | --- | --- |
| [mykeep/](./mykeep/) | `mykeep` | Cloudflare Workers + D1 + R2 のメモ / PWA / Chrome拡張 |
| [notepad/](./notepad/) | `karin-notepad` | Cloudflare Access + D1 + Durable Objectsのメモ帳 |
| [excel/](./excel/) | `karin-excel` | Cloudflare Access + GridCraft WebAssembly（旧D1保管） |

Calendar、Portal、Museum、DiscoveryなどのWorkerもソース取込み済みです。Cloudflare Pagesプロジェクトは、2026-10-11時点の調査では0件でした。

## 開発ルール

1. **`main` を全アプリの正式ソースの正本**とし、1アプリ=1フォルダで管理する。
2. ブランチは機能追加、レビュー、実験にのみ使い、アプリ単位に分割しない。
3. AI はGitHubのソースにコミットし、ビルド・検証を経てCloudflareへ公開する。ローカルGitは必須としない。
4. 各Workerは自分のディレクトリにある設定からビルド・公開する。既存のCloudflare Access、D1、R2、Durable Objectsおよび機密情報を引き継ぐ。
5. 共通ルートのREADMEと各アプリのREADMEで構成・変更方法を説明する。

## ビルドとデプロイ

- `mykeep/`: `npm ci`、`npm run build`、`node tests/pin-levels.mjs`、`npx wrangler deploy --keep-vars`。Cloudflare Workers Builds の root directory = `/mykeep`。
- `notepad/`: `npm install`、`npm run check`、`npx wrangler deploy --dry-run`、`npx wrangler deploy --keep-vars`。Cloudflare Workers Buildsの root directory = `/notepad`、watch paths = `notepad/**`。
- `excel/`: `npm install`、`npm run check`、`npx wrangler deploy --dry-run`、`npx wrangler deploy --keep-vars`。Cloudflare Workers Builds の root directory = `/excel`、watch paths = `excel/**`。
- `word/`: `npm install`、`npm run check`（SHA256照合つきWordCraft WASM生成）、`npx wrangler deploy --dry-run`、`npx wrangler deploy --keep-vars`。root = `/word`、watch paths = `word/**`。

**公開リポジトリ**です。Cloudflare Access のメールアドレス、APIキー、OTPやトークン、実データをコードに埋め込まないでください。D1/R2のIDと公開のデプロイ設定は機密ではありませんが、秘密情報はCloudflare側で管理してください。

旧MyKeep専用の作業履歴はGitで維持し、旧 `notepad-web` ブランチの履歴も削除しません。GitHubの正式リポジトリ名は `Karin-Laboratory/Cloudflare-Workers`。Cloudflare Workers Buildsでは各アプリのフォルダだけを監視し、`main` の変更で自動デプロイします。リポジトリの改名後に連携を検証済みです。

## ライセンスと公開上の注意

- 旧 `MyKeep` 由来のルート `LICENSE` は、元のMyKeepのMITライセンスです。
- `neoma/worker.mjs` には `AGPL-3.0-or-later` のSPDX表示があります。上流のライセンス条件を優先してください。全アプリを一律にMITとして再ライセンスしたものではありません。
- このリポジトリは公開されています。設定済みの個人用リンクやLANアドレスがサンプル・初期データに含まれる場合があるので、Fork・共有時は確認してください。
- Gmail連携の本人メールアドレスはCloudflareの `OWNER_EMAIL` シークレットへ移行し、ソースからは削除してあります。

## GridCraft

2026-10-12: `excel/` は GridCraft 0.5.0 公式WebAssembly版へ置換。前の Excel クローンのソースは `archive-excel-20261012` ブランチ、ブックの D1 データは残します。新しい GridCraft の保存はファイルダウンロード式です。
