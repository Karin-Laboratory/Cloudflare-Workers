# KARIN LAB / www.karin-lab.com

GitHub（`Cloudflare-Workers`）管理のカリンラボ公式ホームページ。Cloudflare Workersで配信する、日本語主体のインタラクティブなワンページ・サイトです。

## 主要セクション
- **WHO WE ARE** 個人とAIで活動する実験室であることを明示。
- **MISSION** 「でも本当にそう？」を起点に、実験・再利用・記録を重視。
- **FIELDS** OpenWrt/OS、AI個人開発、映像、再利用。
- **PROJECTS** 公開情報に基づくフィーチャーと20件の検索可能なプロジェクト・ライブラリ。
- **STORIES** 実機成果の読みもの、noteへの導線。
- **CONNECT** GitHub、note、video vision、X。
- **CONTACT** お問い合わせフォーム（名前・カテゴリ・件名・本文必須、返信先メールアドレス任意）。Cloudflare Turnstile検証後、くろこちゃん名義でDiscordへ通知。

## 編集・ビルド
```sh
cd karin-site
npm install
npm run check
npm run dev
npm run deploy
```

`site.html`が正式な編集原本。ビルドスクリプトで`src/index.js`に反映。外部JS/CDN/フォントに依存しない構成。Workerは `/favicon.svg`, `/robots.txt`, `/sitemap.xml`, `/health` を提供。

## 公開上の原則
- 個人実験室であり、法人・大学研究室・社員数などを誤認させない。
- 未完成のOpenWrt移植を一般ユーザー向けの完成ファームとして売り出さない。
- GitHubの公開ソースとnoteの公開記事を紹介し、内部ネットワーク・IP・秘密鍵・Access設定などは公開しない。
- 実績と構想の区別、本人同意のある映像運用などの文脈を維持。
- 参考にした情報設計: MIT Media Labの『About』『Research』、MIT Design Labの『About』。固有デザイン、画像、文章は複製せず、階層とストーリー展開を独自に制作。

## Contact / Discord 通知設定

`site.html` がフォームの編集原本、`src/index.js` の `POST /api/contact` がAPIです。

- Cloudflare Turnstile（管理モード）を `www.karin-lab.com` 用に作成済み。公開サイトキーはHTML内、秘密の検証キーはWorkerのシークレット `TURNSTILE_SECRET` に設定済み。
- **残る設定:** 既存のDiscord Webhook URLをCloudflare Worker `karin-lab-www` の `DISCORD_WEBHOOK_URL` シークレットに登録する。Webhook URLをGitHub・チャット・CIログに記載しない。
- `DISCORD_WEBHOOK_URL` が未設定なら `GET /api/contact/status` は `{"ready":false}`。フォーム送信ボタンは無効で、`POST /api/contact` は503。送信成功を偽装しない。
- Worker側でOrigin、Content-Type、全入力項目、サイズ、ハニーポット、Turnstile（hostname/action）を検証。
- 成功時はDiscordへ送信者名、問い合わせ種別、返信用メールアドレス（未入力なら「未記入」）、件名、全文、受信時刻を通知。Discordメンションは無効化。
- Discord障害や通知失敗の場合、502を返し再送を促す。サーバー側で問い合わせ本文を永続保存しない。送信履歴はDiscord側のみ。
- `npm run check` でテストを実行。送信成功／失敗／任意メール欄をモック検査。実Discordへの送信テストは環境設定後に手動実施。
- 受信者はプライベートDiscord。本人から預かったメールアドレスは当該お問い合わせへの返答にのみ利用する。

### 一度だけ必要な作業

既存Webhookの保存ファイルがある端末で、**WebブラウザでCloudflareにログインしたWrangler**を利用し、秘密URLをコマンド履歴に出さずWorkerへ登録する。

```bash
cd /path/to/Cloudflare-Workers/karin-site
npx wrangler secret put DISCORD_WEBHOOK_URL --name karin-lab-www < ~/.config/codex/discord-webhook
```

`~/.config/codex/discord-webhook` に既存のWebhook URLが保存されていることを事前確認する（ファイル内容は表示しない）。Webhooksは送信専用であり、くろこちゃんのBotとは異なる。既存のDiscordチャンネルへ届くことを確認する。
