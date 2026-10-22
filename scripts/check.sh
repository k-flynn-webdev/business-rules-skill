#!/usr/bin/env bash
# Checks that the skill agrees with itself: one version everywhere, and each example's installed
# copies identical to the skill's assets. --fix copies the assets into the examples.
set -euo pipefail
cd "$(dirname "$0")/.."
SKILL=business-rules-ledger
EXAMPLES=(examples/journal-app examples/quote-app)
VERSION=$(sed -n 's/^  version: "\(.*\)"$/\1/p' $SKILL/SKILL.md)
[ -n "$VERSION" ] || { echo "No version in $SKILL/SKILL.md" >&2; exit 1; }

# Each installed copy, as "asset:copy". The repo's own ledger uses the authoring file too.
COPIES=("$SKILL/assets/business-rules-authoring.md:specs/BUSINESS-RULES-AUTHORING.md")
for EXAMPLE in "${EXAMPLES[@]}"; do
  COPIES+=(
    "$SKILL/assets/ledger-check.ts:$EXAMPLE/scripts/ledger-check.ts"
    "$SKILL/assets/audio-ledger.ts:$EXAMPLE/scripts/audio-ledger.ts"
    "$SKILL/assets/business-rules-authoring.md:$EXAMPLE/specs/BUSINESS-RULES-AUTHORING.md"
  )
done

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
for LEDGER in specs/BUSINESS-RULES.md "${EXAMPLES[@]/%//specs/BUSINESS-RULES.md}"; do
  expect "$LEDGER" "Format: business-rules-ledger $VERSION"
done

for pair in "${COPIES[@]}"; do
  cmp -s "${pair%%:*}" "${pair#*:}" || { echo "${pair#*:} differs from ${pair%%:*}. Run scripts/check.sh --fix." >&2; fail=1; }
done

[ $fail -eq 0 ] && echo "Skill $VERSION agrees with itself."
exit $fail
