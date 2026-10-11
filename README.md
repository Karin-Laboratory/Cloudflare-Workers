# Karin Workers

Cloudflare Workers で動かす Karin-Lab 個人開発アプリのソースコードを、ひとつの GitHub リポジトリで管理するためのモノレポです。

## アプリ

| フォルダ | 本番Worker | 役割 |
| --- | --- | --- |
| [mykeep/](./mykeep/) | `mykeep` | Cloudflare Workers + D1 + R2 のメモ / PWA / Chrome拡張 |
| [notepad/](./notepad/) | `karin-notepad` | Cloudflare Access + D1 + Durable Objectsのメモ帳 |

その他のKarin-Labアプリ（calendar、portal、museum、discoveryなど）は、GitHubへのソース取込みを監査できたものから追加します。未移行アプリのコードを推測で作らず、稼働中のCloudflareリソースを勝手に作り直さない方針です。

## 開発ルール

1. **`main` を全アプリの正式ソースの正本**とし、1アプリ=1フォルダで管理する。
2. ブランチは機能追加、レビュー、実験にのみ使い、アプリ単位に分割しない。
3. AI はGitHubのソースにコミットし、ビルド・検証を経てCloudflareへ公開する。ローカルGitは必須としない。
4. 各Workerは自分のディレクトリにある設定からビルド・公開する。既存のCloudflare Access、D1、R2、Durable Objectsおよび機密情報を引き継ぐ。
5. 共通ルートのREADMEと各アプリのREADMEで構成・変更方法を説明する。

## ビルドとデプロイ

- `mykeep/`: `npm ci`、`npm run build`、`node tests/pin-levels.mjs`、`npx wrangler deploy --keep-vars`。Cloudflare Workers Builds の root directory = `/mykeep`。
- `notepad/`: ソースは `worker.js`。Cloudflare Buildsの接続は別途行い、root directory = `/notepad` を指定する。現在のCloudflare API経由デプロイは運用維持する。

**公開リポジトリ**です。Cloudflare Access のメールアドレス、APIキー、OTPやトークン、実データをコードに埋め込まないでください。D1/R2のIDと公開のデプロイ設定は機密ではありませんが、秘密情報はCloudflare側で管理してください。

旧MyKeep専用の作業履歴はGitで維持し、旧 `notepad-web` ブランチの履歴も削除しません。リポジトリ名変更やCloudflare Workers Buildsの連携更新時には、ビルド成否を確認します。
