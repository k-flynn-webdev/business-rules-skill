#!/usr/bin/env bash
# Builds dist/business-rules-ledger-<version>.skill from the skill folder, for the claude.ai skills
# upload, and the same package as .zip for installing by hand.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(sed -n 's/^  version: "\(.*\)"$/\1/p' business-rules-ledger/SKILL.md)
[ -n "$VERSION" ] || { echo "No version in business-rules-ledger/SKILL.md" >&2; exit 1; }
mkdir -p dist
OUT="dist/business-rules-ledger-$VERSION.zip"
rm -f "$OUT"
zip -qr "$OUT" business-rules-ledger -x '*.DS_Store'
cp "$OUT" "${OUT%.zip}.skill"
echo "${OUT%.zip}.skill"
echo "$OUT"
