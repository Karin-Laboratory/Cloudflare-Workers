# 今日の日本は、どんな季節？ 🍁

二十四節気、七十二候、月齢、日の出・日の入り、旬の花と食べ物を、スマートフォンの一画面で眺める日本語Webアプリ。

**公開URL:** https://today-japan-seasons.karin-laboratory.workers.dev/

## できること

- 二十四節気と七十二候（全72候）。読み仮名と季節の短い説明
- 月齢・月のイメージ・日の出と日の入り
- 月ごとの代表的な旬の花・食べ物
- 春夏秋冬で切り替わる色彩とレスポンシブなレイアウト
- 日本標準時（JST）のカレンダー日付が変わると自動更新
- 日付選択による過去・未来の表示、［今日］ボタンで自動更新に復帰
- 位置情報の使用は任意。許可しなければ東京都心（北緯35.6581°、東経139.7414°）
- ログイン、APIキー、有料サービス、広告、外部JavaScriptライブラリ不要

## 計算の精度・注意点

**暦：** 太陽の見かけの黄経を近似計算して15度ごとに二十四節気、5度ごとに七十二候を割り当てています。境界日は国立天文台の公式暦、伝統的な七十二候と1日程度異なる場合があります。植物・気象の変化は地域ごとに異なります。

**月齢：** 日本時間の正午時点。2026年については新月の公表時刻を用い、それ以外の年は平均朔望月29.530588853日で延長する概算です。8段階の月の絵はイメージです。

**日の出入り：** NOAAの近似式による計算。地形、標高、大気差等を省略しており実際の時刻と異なる場合があります。出力は常に日本標準時（JST）です。位置情報はボタンを押した場合だけ問い合わせ、端末内で計算します。サーバーには送信・保存しません。

**旬：** 旬の花・食材は一般的な月ごとの代表例で、地域・気象・品種などにより異なります。リアルタイムの開花や市場データではありません。

## 出典・参考

- [国立天文台 暦計算室：二十四節気](https://eco.mtk.nao.ac.jp/koyomi/faq/24sekki.html)
- [国立天文台：2026年暦要項](https://eco.mtk.nao.ac.jp/koyomi/yoko/2026/rekiyou262.html)
- [国立天文台：月齢の定義](https://eco.mtk.nao.ac.jp/koyomi/faq/moon.html)
- [国立天文台：月齢カレンダー](https://eco.mtk.nao.ac.jp/koyomi/dni/2026/m1310.html)
- [NOAA：太陽の出入り近似式](https://gml.noaa.gov/grad/solcalc/solareqns.PDF)
- [暦生活：七十二候](https://www.543life.com/content/about72seasons-sp/)

## ソースと構成

```text
src/index.js        # Cloudflare Worker本体（HTML・CSS・JSを含む）
wrangler.toml       # このアプリ専用のデプロイ設定
package.json        # 開発・公開用のコマンド
README.md           # この説明
```

*実際に公開されているWorkerのソースをGitHubに登録しています。* まず動作している内容をそのまま保存する方針のため、現在はHTML・CSS・ブラウザ側JavaScriptもWorkerの中にまとめられています。

## ローカルで実行

Node.jsが必要です。

```sh
npm install
npm run dev
```

開発サーバーが表示するローカルURLをブラウザで開いてください。

## Cloudflare Workersに公開

Cloudflareにログインした環境で：

```sh
npx wrangler login
npm install
npm run deploy
```

**Cloudflare Workers Builds と `Karin-Laboratory/koyomi` の `main` は接続済みです。** `main` に変更をpushすると、このアプリ専用Worker `today-japan-seasons` の自動ビルド・自動公開が実行されます（公開の成否はCloudflareのビルド履歴で確認してください）。ビルドコマンドは `npm run build`、デプロイコマンドは `npm run deploy` です。

本リポジトリ専用の設定以外に、既存アプリ・DNSレコード・Workerの設定を変更する必要はありません。
