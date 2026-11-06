# 電卓。

https://calc.karin-lab.com

Rust → WebAssemblyの電卓。外部crate・数式評価ライブラリ・UIフレームワークなし。
Rust標準ライブラリを使用。HTML/CSSと素のJavaScriptが表示・入力・WASMとの受け渡しを担当します。

## 機能

- 四則演算、括弧、べき乗（右結合）、階乗、百分率
- sin/cos/tan、sqrt/log/ln/abs/exp、pi/e、DEG/RAD
- キーボード入力、計算履歴（ページ内のみ）、コピー、スマホ対応
- 構文・定義域・0除算・長さ・再帰深度の検証

`1+2*3=7`、`-2^2=-4`、`2^3^2=512`。
`%`は常に100で割る後置演算子（`200*10%=20`）。暗黙の乗算はありません。
IEEE 754 f64を使用し表示は有効数字15桁。十進厳密演算ではありません。

## 読む順序

1. `src/lib.rs`: 式を解析し計算するRust本体、結果整形、WASM ABI、単体テスト
2. `web/app.js`: ボタン入力・履歴・ブラウザとWASMの橋渡し
3. `web/index.html` / `web/style.css`: 画面
4. `build-worker.mjs`: 静的ファイルを配る小さなWorkerを生成

## ビルドと検証

Rust 1.99.1、wasm32-unknown-unknownターゲット、Node.js 22以降。

```sh
cd calc
sh ci-build.sh
```

`cargo test`、release WASMビルド、Node.jsで実際のWASMを読み込むテスト
（計算・エラー・DEG/RAD・10,000回のメモリ確保と解放）を実行します。
`dist/worker.js`は生成物で、HTML/CSS/JS/WASMを同じオリジンから配信します。

## GitHub連携

Cloudflare Workers Buildsがこのリポジトリのmain、`calc/**`を監視。
ルート `calc`、build `sh ci-build.sh`、deploy `npx wrangler@4.135.0 deploy`。
GitHub Actionsも同じテストを実行します。デプロイ用の秘密情報はソースに含みません。

## 行数

`wc -l src/lib.rs web/index.html web/style.css web/app.js build-worker.mjs`
で空行・コメントを含む物理行数を再現できます。生成物・設定・説明文は別計上。

MIT License（リポジトリのLICENSEを参照）。
