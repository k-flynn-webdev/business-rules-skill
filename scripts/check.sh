#!/usr/bin/env bash
# Checks that the skill agrees with itself: one version everywhere, and the example's installed
# copies identical to the skill's assets. --fix copies the assets into the example.
set -euo pipefail
cd "$(dirname "$0")/.."
SKILL=business-rules-ledger
EXAMPLE=examples/journal-app
VERSION=$(sed -n 's/^  version: "\(.*\)"$/\1/p' $SKILL/SKILL.md)
[ -n "$VERSION" ] || { echo "No version in $SKILL/SKILL.md" >&2; exit 1; }

# Each installed copy, as "asset:copy".
COPIES=(
  "$SKILL/assets/ledger-check.ts:$EXAMPLE/scripts/ledger-check.ts"
  "$SKILL/assets/audio-ledger.ts:$EXAMPLE/scripts/audio-ledger.ts"
  "$SKILL/assets/business-rules-authoring.md:$EXAMPLE/specs/BUSINESS-RULES-AUTHORING.md"
)

if [ "${1:-}" = "--fix" ]; then
  for pair in "${COPIES[@]}"; do cp "${pair%%:*}" "${pair#*:}"; done
fi

fail=0
expect() { # file, pattern with the version in it
  grep -qF "$2" "$1" || { echo "$1: expected \"$2\"" >&2; fail=1; }
}
expect $SKILL/SKILL.md "Version $VERSION. See the changelog"
expect $SKILL/assets/ledger-check.ts " * Version $VERSION — "
expect $SKILL/assets/audio-ledger.ts " * Version $VERSION — "
expect $SKILL/assets/ledger-template.md "Format: business-rules-ledger $VERSION"
expect $SKILL/assets/business-rules-authoring.md "Format: business-rules-ledger $VERSION"

for pair in "${COPIES[@]}"; do
  cmp -s "${pair%%:*}" "${pair#*:}" || { echo "${pair#*:} differs from ${pair%%:*}. Run scripts/check.sh --fix." >&2; fail=1; }
done

[ $fail -eq 0 ] && echo "Skill $VERSION agrees with itself."
exit $fail
