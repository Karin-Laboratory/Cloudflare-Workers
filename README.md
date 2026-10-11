# Cloudflare Workers | Karin-Lab

Cloudflare Workers で動かす Karin-Lab 個人開発アプリのソースコードを、ひとつの GitHub リポジトリで管理するためのモノレポです。

## Cloudflare Worker 一覧（2026-10-11）
以下の **13本すべて** を `main` の独立ディレクトリで管理します。Cloudflare Workers Builds は対応する `<folder>/**` の変更時だけその Worker をビルド・デプロイします。

| アプリ | Worker | 公開先 |
|---|---|---|
| [mykeep/](./mykeep/) | `mykeep` | `mykeep.karin-lab.com` |
| [notepad/](./notepad/) | `karin-notepad` | `notepad.karin-lab.com` |
| [calendar/](./calendar/) | `karin-calendar` | `calendar.karin-lab.com` |
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

**公開リポジトリ**です。Cloudflare Access のメールアドレス、APIキー、OTPやトークン、実データをコードに埋め込まないでください。D1/R2のIDと公開のデプロイ設定は機密ではありませんが、秘密情報はCloudflare側で管理してください。

旧MyKeep専用の作業履歴はGitで維持し、旧 `notepad-web` ブランチの履歴も削除しません。GitHubの正式リポジトリ名は `Karin-Laboratory/Cloudflare-Workers`。Cloudflare Workers Buildsでは各アプリのフォルダだけを監視し、`main` の変更で自動デプロイします。リポジトリの改名後に連携を検証済みです。
