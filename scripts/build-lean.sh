#!/usr/bin/env bash
# Render Lean proofs to interactive HTML (with proof-state hovers) using
# LeanInk + Alectryon, then place the fragment + assets into the matching post.
#
# This is a LOCAL build step. Its output is committed, so the GitHub Action
# never runs Lean/LeanInk/Alectryon — CI just renders the committed fragments.
#
# Requirements (see _lean/README.md):
#   - leanink on PATH  (built from gaetanserre/LeanInk, pinned to v4.19.0-rc3)
#   - the v4.19.0-rc3 toolchain installed via elan
#   - the Python venv at .venv with alectryon installed
#
# Usage:  ./scripts/build-lean.sh
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$REPO/.venv"
export LEAN_SYSROOT="$HOME/.elan/toolchains/leanprover--lean4---v4.19.0-rc3"
export PATH="$HOME/.local/bin:$HOME/.elan/bin:$PATH"

# Quieten the harmless macOS dyld note from the locally-linked leanInk binary.
alectryon() { "$VENV/bin/alectryon" "$@" 2> >(grep -vi 'SG_READ_ONLY' >&2); }

# One call per proof: <lake project under _lean/>  <lean file>  <destination post dir>
render() {
  local project="$1" leanfile="$2" postdir="$3"
  local src="$REPO/_lean/$project"
  local dst="$REPO/posts/$postdir"
  local stem="${leanfile%.lean}"
  echo ">> $project/$leanfile -> posts/$postdir/_${stem}.html"

  # leanInk --lake needs a configured project with a (possibly empty) packages dir.
  ( cd "$src"
    [ -f lake-manifest.json ] || lake update >/dev/null
    mkdir -p .lake/packages

    # 1) the embeddable fragment (proof states + hovers)
    alectryon --frontend lean4 --lake lakefile.lean "$leanfile" \
      --backend snippets-html -o "$dst/_${stem}.html"

    # 2) the styling/behaviour assets (alectryon.css, alectryon.js, pygments.css),
    #    emitted next to a throwaway standalone page which we then discard.
    alectryon --frontend lean4 --lake lakefile.lean "$leanfile" \
      --backend webpage --copy-assets copy -o "$dst/.__throwaway.html"
    rm -f "$dst/.__throwaway.html"
  )
}

render monoid-laws Monoid.lean lean-monoid-laws

echo "done."
