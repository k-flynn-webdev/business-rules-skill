#!/usr/bin/env bash
# Builds dist/business-rules-ledger-<version>.zip from the skill folder, ready to upload or install.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(sed -n 's/^  version: "\(.*\)"$/\1/p' business-rules-ledger/SKILL.md)
[ -n "$VERSION" ] || { echo "No version in business-rules-ledger/SKILL.md" >&2; exit 1; }
mkdir -p dist
OUT="dist/business-rules-ledger-$VERSION.zip"
rm -f "$OUT"
zip -qr "$OUT" business-rules-ledger -x '*.DS_Store'
echo "$OUT"
