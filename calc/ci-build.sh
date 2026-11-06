#!/bin/sh
set -eu
if ! command -v cargo >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -o /tmp/karin-calc-rustup.sh
  sh /tmp/karin-calc-rustup.sh -y --profile minimal --default-toolchain 1.99.1
fi
. "$HOME/.cargo/env"
rustup target add wasm32-unknown-unknown
sh build.sh
