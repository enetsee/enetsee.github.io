# Lean proof rendering (LeanInk + Alectryon)

Lean proofs on the blog are rendered to interactive HTML (hoverable goal
states) with [Alectryon](https://github.com/cpitclaudel/alectryon) driven by
[LeanInk](https://github.com/leanprover/LeanInk). This directory is **ignored by
Quarto** (the leading `_`), so nothing here is published directly. The build
step writes its output into the relevant `posts/<slug>/` directory, and *that*
committed output is what the site (and CI) renders. CI never runs Lean.

## Layout

```
_lean/<project>/        a minimal Lake project per topic
  Monoid.lean           the proof source
  lakefile.lean         minimal package (no dependencies)
  lean-toolchain        pinned: leanprover/lean4:v4.19.0-rc3
  .lake/                build dir (git-ignored)
```

To render everything: `./scripts/build-lean.sh` from the repo root.

## One-time toolchain setup

LeanInk is effectively unmaintained and its `main` is pinned to an ancient Lean
(v4.6). We use the community fork **gaetanserre/LeanInk** (Lean v4.19.0-rc3):

```sh
# 1. install the matching toolchain
elan toolchain install leanprover/lean4:v4.19.0-rc3

# 2. build the fork
git clone https://github.com/gaetanserre/LeanInk ~/.local/src/LeanInk-g
cd ~/.local/src/LeanInk-g && lake build
```

### macOS Tahoe (Darwin 25) caveat

Binaries linked by Lean's bundled `lld` lack the `SG_READ_ONLY` flag that newer
macOS dyld now *requires*, so the freshly built `leanInk` aborts with
`__DATA_CONST segment missing SG_READ_ONLY flag`. Re-link it once with Apple's
system linker (which sets the flag), pointing at Homebrew's `gmp`/`uv`:

```sh
cd ~/.local/src/LeanInk-g
/usr/bin/cc -o .lake/build/bin/leanInk .lake/build/ir/**/*.c.o.export \
  -rdynamic \
  -L "$HOME/.elan/toolchains/leanprover--lean4---v4.19.0-rc3/lib/lean" \
  -L /opt/homebrew/lib \
  -lleancpp -lInit -lStd -lLean -lleanrt -lc++ -lLake -lgmp -luv
ln -sf "$HOME/.local/src/LeanInk-g/.lake/build/bin/leanInk" ~/.local/bin/leanink
ln -sf "$HOME/.local/src/LeanInk-g/.lake/build/bin/leanInk" ~/.local/bin/leanInk
```

`build-lean.sh` sets `LEAN_SYSROOT` to the v4.19.0-rc3 toolchain so `leanInk`
finds matching `.olean` files regardless of your *default* Lean toolchain — so
you can keep your own Lean projects on whatever version you like.

## Proofs must compile under v4.19.0-rc3

The rendering toolchain is pinned, so proof sources here must use syntax/lemmas
valid in core Lean v4.19.0-rc3 (no Mathlib, unless you add it to the Lake
project). This is independent of the Lean version you use elsewhere.

## Modern alternative

The Lean project now ships [Verso](https://github.com/leanprover/verso) for
literate Lean/HTML on current toolchains. If the LeanInk path becomes painful to
maintain, migrating these posts to Verso is the forward-looking option.
