# WordCraft Web × Cloudflare Workers: 起動までの障害記録

> 2026-10-12 / `word.karin-lab.com` / WordCraft Web v0.5.0
>
> **結果:** ユーザーの Chrome で WordCraft のエディタが正常に開いた。
> **位置づけ:** 今回の構成で観測・検証した事実と推定を分けた事後記録。すべての Workers / WASM に当てはまるとは限らない。

## 背景と構成

- アプリ: [storytold/wordcraft](https://github.com/storytold/wordcraft) の公式 Web リリース `wordcraft-web-0.5.0.zip`（Rust → WebAssembly / Trunk）。
- 配信: Cloudflare Worker `karin-word` + Workers Static Assets、カスタムドメイン `word.karin-lab.com`。
- ソース管理: `Karin-Laboratory/Cloudflare-Workers` の `word/`。GitHub `main` の `word/**` 変更で Workers Builds を起動。
- 公開側は Cloudflare Access（メール OTP）で保護。公開コンテンツに文書の自動クラウド保存は実装していない。
- ビルド時に公式 ZIP を取得し、**ZIP 全体の SHA-256 を照合**してからアセットを生成する。
- 公式 WASM の実測サイズは **36,329,933 bytes**（約 34.65 MiB）。Cloudflare Workers Static Assets の単一ファイル上限（25 MiB）を超える。

## 詰まった点（時系列）

| 段階 | 症状・失敗 | 対応と教訓 |
| --- | --- | --- |
| 1. 公式リリースをそのまま配置 | WASM ファイルが Static Assets の単一ファイル上限を超えてデプロイ不可 | 大型 WASM は「ZIP が小さい」だけでは収まらない。展開後の個別サイズも確認する |
| 2. WASM を gzip 圧縮して `.wasm.gz` に保存 | デプロイは通るが、ブラウザでは **`Loading WordCraft…` のまま** | `Content-Encoding`、`Content-Type`、レスポンス実体と Trunk のブートストラップの整合性を要確認 |
| 3. Worker 側 `DecompressionStream("gzip")` に変更 | WebGL2 モードでの再試行を含め、ユーザー環境で起動せず | **gzip が真の唯一の原因だったとは断定しない**。今回の方式での不具合であり、ブラウザのネットワーク記録は取得していない |
| 4. ブートストラップと診断を調査 | 公式 `index.html` は JS の `init({ module_or_path: '…_bg.wasm' })` を実行する。初期化に進めなければ Loading 表示が残る | HTTP 200、`/healthz` 成功、Worker デプロイ成功は **アプリ起動成功と別物** |
| 5. 別の方式に切り替え | **WASM を 4 分割して保存**し、リクエスト時に Worker が元のバイト列でストリーミング結合する方式へ | 圧縮・解凍・`Content-Encoding` 変換に依存しない。結果としてユーザーから「開いた！」と確認できた |
| 6. 再デプロイを繰り返す | Cloudflare API がときどき **HTTP 504 Gateway Timeout**（例: assets-upload-session、workers/services、subdomain） | アプリ不具合と運用側の一時エラーを分けて対処。`wrangler deploy` に限定回数のリトライを設定 |
| 7. 開発中の検査 | テスト用正規表現や JS の `URL` 識別子衝突など、修正用コード自身も失敗した | 検査失敗を隠さず、Cloudflare のビルドログを読んで修正。GitHub の commit が成功しても build が通るとは限らない |

## 最終的に採った配信方法

[prepare-assets.mjs](../scripts/prepare-assets.mjs) で WASM を 12,000,000 bytes ごとに分割。

```text
wordcraft-web-d288edabbaf506a2_bg.wasm.part0  12,000,000 bytes
wordcraft-web-d288edabbaf506a2_bg.wasm.part1  12,000,000 bytes
wordcraft-web-d288edabbaf506a2_bg.wasm.part2  12,000,000 bytes
wordcraft-web-d288edabbaf506a2_bg.wasm.part3     329,933 bytes
                                                   ------------
合計                                            36,329,933 bytes
```

[worker.js](../worker.js) はブラウザから `…_bg.wasm` が要求されたら、`.part0` から `.part3` を順に `env.ASSETS.fetch()` し、`ReadableStream` でそのまま連結して返す。レスポンスは `Content-Type: application/wasm`。WASM 本体の展開と書き戻しはしない。

公式 `index.html` の JS / WASM 参照には `?karin=parts3` を付けて、以前の失敗したレスポンスのキャッシュとの混同を防ぐ。診断用 `startup-guard.js` は、一定時間経っても起動しないときにブラウザエラーと WebGL2 再試行リンクを表示する。

**注意:** 今回のチャンク数・サイズ・URL は v0.5.0 の公式リリースに合わせたもの。上流更新時に固定値が変わる可能性があるため、無条件で流用しない。

## 重要だった検証

- [check-assets.mjs](../tests/check-assets.mjs) が 4 チャンクの存在、WASM マジックバイト `00 61 73 6d`、合計 **36,329,933 bytes** をチェック。
- Worker にモックの Assets binding を渡して実際の `fetch` 処理を実行し、そのレスポンス全体の **SHA-384 が公式 HTML の `integrity="sha384-…"` と完全一致**することを確認。
- 公式 ZIP 自体の SHA-256 は `196d0070fec6572238298e211ac4a3ea0510b7a0ac8d6096a5ee59f2ff69f85d`。
- Cloudflare Builds の最終結果が `success` で、独自ドメインへの公開ログがあることを確認。
- **最後の確認はユーザーのブラウザで実際に WordCraft が開いたこと**。この確認はビルド・配信テストでは代用できない。

関連コミット:

- [`cec54de`](https://github.com/Karin-Laboratory/Cloudflare-Workers/commit/cec54dec0b02a1794175e7b35735df5b3effc05e) 初期の圧縮配信方式を修正
- [`93327ae`](https://github.com/Karin-Laboratory/Cloudflare-Workers/commit/93327ae6b04e2bb7ae09e832549530a446e43228) 非圧縮 WASM の分割・ストリーミング結合へ
- [`b791963`](https://github.com/Karin-Laboratory/Cloudflare-Workers/commit/b791963da1322a344b8a4bfbbcb092ccb1861d53) WASM の SHA-384 整合性テスト追加
- [`60195af`](https://github.com/Karin-Laboratory/Cloudflare-Workers/commit/60195af9c7f6952824a754eb2608d517c0210ea7) HTML 内の読み込み経路・診断を更新

## 同種の障害が出たら

1. まず公式 ZIP の中身を確認する。展開後 WASM のファイルサイズ、`index.html` の JS/WASM 参照、SRI を見る。
2. Worker の静的アセット上限と MIME を確認する。HTTP 200 や `/healthz` だけで起動成功とみなさない。
3. ブラウザの開発者ツールで **Console と Network の JS/WASM リクエスト**を確認する。今回ここを取得できなかったため、圧縮経路の根本原因までは未確定。
4. WASM を加工・配信するなら、**ブラウザへ返す最終バイト列**を公式 SRI と比較する。
5. Cloudflare の 504 はビルド時エラーと切り分ける。必要に応じて再試行し、**Build outcome = success** と公開ログを確認する。
6. 最後に保護された本番ドメインで実際に文書編集画面が出るか確認する。Access の認証、キャッシュ、ブラウザ GPU は別の故障点。

## まだ未確認のこと

- 最初の gzip 配信で Loading のままになった**厳密な原因**。Console / Network の HAR がないため、`Content-Encoding` の不整合と断定はできない。
- Chrome 以外のブラウザ・端末、およびすべての DOCX 取扱い機能。
- WASM の分割配信の大規模アクセス時のコスト・性能特性。

**要点:** 「Cloudflare で公開できた」と「Rust/WASM アプリが起動する」は別段階。**配信する WASM の同一性を検査し、最後はブラウザの実動作で判断する。**
