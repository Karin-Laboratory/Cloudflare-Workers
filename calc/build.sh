#!/bin/sh
set -eu
cd "$(dirname "$0")"
cargo test --locked
cargo build --locked --release --target wasm32-unknown-unknown
mkdir -p dist
cp web/* dist/
cp target/wasm32-unknown-unknown/release/karin_calc.wasm dist/calc.wasm
node build-worker.mjs
node tests/wasm.mjs
