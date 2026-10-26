# Karin Video Vision | 動的エグゼクティブプレゼン

公開先：**https://vision.karin-lab.com/**

「撮る。遊ぶ。もう、できている。」をテーマとする全8幕のHTMLプレゼン。提案構想の紹介であり、動画自動編集システム本体ではありません。

## 8幕

1. ビジョン：撮る、遊ぶ、届く
2. 問題：アップロードさせた時点でUXの負け
3. 未来の体験：撮る → 遊ぶ → 届く
4. 技術構成：Android → NAS → Proxmox AI動画工房、Cloudflareは窓口
5. 編集エンジン：シーン解析、音声、感性、音楽、字幕、完成
6. 開発計画：既存資産 → Camera2 → 自動MVP → 発展
7. 信頼：同意・自宅保存・自動復旧・計測
8. 結語：人生を楽しむために、UIを減らす

## 構成

- `src/index.js`: Cloudflare Worker。**CSS / SVGライクな図解 / JavaScriptを全て含むスタンドアロンHTMLを返す**。依存するCDNや画像素材なし。
- `wrangler.toml`: Worker設定。
- `package.json`: 開発コマンド。

キーボードの矢印、PgUp/PgDn、Space、Home/End、画面右下の操作、縦スクロールに対応。フルスクリーン切替、スマートフォン表示、動きを減らすOS設定、印刷時のページ区切りをサポート。

## 開発と公開

```sh
cd video-vision
npm install
npm run check
npm run dev
npm run deploy
```

Cloudflare-Workersモノレポの独立アプリとして運用。既存のWorkerや認証設定には触れない。

## 注意

プレゼン中のスマートフォンや映像サンプルはCSSベースのイメージ表現で、実写・実サービスの動作デモではない。完成まで「数分」は目標であり実測保証ではない。録画の同意と公開時の本人承認を重視する。
