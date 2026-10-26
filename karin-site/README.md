# KARIN LAB / www.karin-lab.com

GitHub（`Cloudflare-Workers`）管理のカリンラボ公式ホームページ。Cloudflare Workersで配信する、日本語主体のインタラクティブなワンページ・サイトです。

## 主要セクション
- **WHO WE ARE** 個人とAIで活動する実験室であることを明示。
- **MISSION** 「でも本当にそう？」を起点に、実験・再利用・記録を重視。
- **FIELDS** OpenWrt/OS、AI個人開発、映像、再利用。
- **PROJECTS** 公開情報に基づくフィーチャーと20件の検索可能なプロジェクト・ライブラリ。
- **STORIES** 実機成果の読みもの、noteへの導線。
- **CONNECT** GitHub、note、video vision、X。

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
