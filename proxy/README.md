# Karin Proxy

Cloudflare Workers 上で動く、個人用の簡易Webプロクシです。

- URL欄、戻る、進む、再読み込み、画面全体を使う閲覧領域
- HTML 内のリンク、画像、スタイルシート、スクリプト、フォーム送信先を書き換え
- CSS の url() と @import を書き換え（高度なCSSには未対応）
- リダイレクトをプロクシ内で処理、GET/HEAD/POST フォーム対応
- サイト内での閲覧履歴を上部UIに反映
- 宛先は公開 HTTPS ホストのみ。IPアドレス・ローカルホスト・Karin-Lab 内部ホストなどを拒否
- プロクシしたページを opaque-origin iframe sandbox に隔離。Cloudflare Access の本人限定OTPで外部公開を防止
- upstream の Cookie / Set-Cookie、認証ヘッダー、CSP / X-Frame-Options を転送しません。ダウンロードのファイル名は破棄します

## 制約

Chromeなどの完全なブラウザの代替ではありません。ログイン、Cookie、localStorage、Service Worker、CORS、WebSocket、SPA、bot検知、厳格な CSP を使うWebサイトは正常に動かない場合があります。HTMLやCSSのURL書き換えもベストエフォートです。対象サイト自身のHTTPSへの接続は保持されますが、アクセス元から見た接続先はCloudflare Workerになります。

**安全上の前提:** Cloudflare Access の本人限定保護を外さないこと。公開の無制限プロクシにしないこと。機密性の高いサイト、銀行、購入手続き、ログインには利用しないこと。前方プロクシ（SOCKS/CONNECT）ではありません。

## 開発

```sh
cd proxy
npm install
npm run check
npx wrangler deploy --keep-vars
```

Workers Builds はこの Worker の root directory を `/proxy`、watch paths を `proxy/**` に設定してください。
