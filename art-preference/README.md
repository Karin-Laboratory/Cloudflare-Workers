# どっちの絵が好き？ / Art Preference

公開リポジトリ [Cloudflare-Workers](https://github.com/Karin-Laboratory/Cloudflare-Workers) 内の独立したアプリです。公開URL: `https://art.karin-lab.com`。2026-11-07、Cloudflare Worker `karin-art-preference` の作成・独自ドメイン割当・DNS登録をAPIで確認済み（外部ブラウザからの表示確認は未完了）。

## 現状（2026-11-07）

- 8問、各問2枚から1枚クリック。作品名と作者名は結果まで伏せる。
- 決断時間はブラウザ内で100ms単位に丸めて記録。読み込みが終わるまで計時しない。
- 8回答から特徴差分ベクトルを計算し、未提示作品を順位付け。個人内対数決断時間の分散から暫定2段階重みを計算。
- 位置効果は記録し、現段階では**補正しない**。8回の左右選択から個人の位置バイアスを断定できないため。
- 同一モデル版・同一ペア・選択・決断時間から同一結果になる。外部利用者の回答からモデルを学習しない。
- **これは動作検証プレビュー**。仮の24作品を使い、画像URL・利用条件・作品特徴・推薦精度は未検証。正式な美術嗜好判定ではない。失敗した画像は無効化される。

## 正式版の受入条件

1. 二次元の絵画だけ（彫刻・動画・漫画・写真・版画を除外）の**人気上位1,024作品**を、公開した選定基準で固定。
2. 全画像の出典・ライセンスと許諾範囲を監査し、表示サイズWebPをR2に保存。SHA256を付けたmanifestをGitHub管理。
3. OpenCLIP等のライセンス確認済みモデルを利用し、再現可能な画像特徴を一括抽出。人間が確認できる説明特徴を別途監査。
4. 既存選好学習を使い、8問の適応的出題を固定。画像特徴方式・解釈可能特徴方式・ハイブリッドを独立参加者の未提示選択で比較。
5. 時間重み・左右補正は、補正なしモデルより精度が改善した場合だけ採用。結果を運用中に自動学習しない。
6. モデル、データ、計算式、同点規則、バージョンとSHA256を固定。1人目も100人目も同一条件で同じ結果。

## 実装

- `index.html`: 画面、レスポンシブデザイン
- `app.js`: 出題、回答時間、推薦計算、ローカル監査ログ
- `data/preview-artworks.json`: 未検証デモ用データ（本番データではない）
- `scripts/prepare-artworks.mjs`: Art Institute of Chicago Open Access APIから権利付きの原候補を再現可能に採取する補助スクリプト

初回の公開は `proxy-worker.js` と同じロジックの Worker をCloudflare API経由で独立デプロイ。公開コンテンツはGitHubの固定コミット `49d72105fb9c3cea50f9373ab1faa922fd4fed7a` から読み、ブラウザの実行コードは勝手に変わりません。画像は現段階ではCommons外部配信、正式版ではR2 `karin-art-images` に移行します。\n\nこのアプリが属する公開モノレポでは既存のサービスごとに別設定でデプロイしています。他サービスへの影響を避け、`art-preference/`を単独デプロイしてください。

## 開発

```sh
cd art-preference
npm run check
npx wrangler deploy
```

`wrangler.jsonc` は独立したCloudflare Workerを作るための設定です。独自ドメイン `art.karin-lab.com` は追加でCloudflare route/custom domainが必要です。シークレットはGitHubに保存しません。

## 2026-11-07 画像表示修正 v0.2

- 作業前の `main` をバックアップブランチ [backup/art-preference-preview-20261107](https://github.com/Karin-Laboratory/Cloudflare-Workers/tree/backup/art-preference-preview-20261107) に保全（起点 commit `eeef87edd34465a670573dba79fe15c55603ecf7`）。
- 旧プレビューの未確認 Wikimedia URLを公開経路から外し、シカゴ美術館公式APIの `is_public_domain=true`、`artwork_type_title=Painting`、公式IIIF画像へのGET応答を条件にした暫定作品カタログを返す専用Workerへ変更。
- 公開Workerは画像を最大32件選び、配信カタログをCloudflareエッジに24時間キャッシュする。**これは正式な固定1,024作品モデルではない**。正式公開にはR2とGitHubのmanifestでデータを完全固定する必要がある。
- 作品画像が読み込めなかった場合は、美術館APIのサムネイルにフォールバックするか別の作品ペアへ自動で切り替える。従来の「作品データの監査待ちです」画面を表示しない。
- GitHub Actions `refresh-art-preview.yml` に、公式APIによる画像確認とプレビュー作品一覧の保存手順を登録。実行完了の確認は別途必要。
- Cloudflare Workerの更新APIとドメイン割当は成功したが、ブラウザでのリロード後の全８問操作は未検証。

## 2026-11-07 追加復旧 v0.4（画面が空白になる障害）

- 原因: 公開Workerがリクエストごとに美術館APIを呼び、一覧取得失敗でHTTP 503になっていた。JavaScriptも一覧が取得できないと起動できなかった。
- 修正: 起動時の外部API・画像ネットワーク依存をゼロにした。app.js内に固定した32枚の自作SVG試験画像と仮特徴量を使用。
- 初回８問の二択・推薦３点を実コードのJavaScript DOMシミュレーションでPASS確認。tests/interactive-flow.test.mjsを追加。
- Cloudflare karin-art-preference は固定GitHubコミット 76d9d7e446d4a760a514fea8de313d9620678c1d のHTML/JSを提供。API更新成功。
- 実ブラウザから公開URLの８問完走テストは未確認。GitHub ActionsのPlaywrightテストを登録済みだが結果取得は未完了。
- v0.4の32画像は本物の美術館作品ではない。表示機能検証用のオリジナル画像。推薦精度の根拠にしてはならない。
- 本物の絵画JPEGを取得してGitHubに固定保存するバッチ scripts/build-frozen-preview.mjs と対応CIを追加済み。生成・権利監査成功を確認するまで実作品モードに切り替えない。
- 復元用ブランチ: backup/art-before-static-fallback-20261107。
