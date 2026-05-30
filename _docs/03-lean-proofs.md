# 04 — Lean proofs with interactive proof states

Lean posts render proofs to HTML where you can **hover over a tactic to see the
goal state** at that point. This is the gnarliest part of the blog; read this
whole page before adding a Lean post.

## How it fits together

```
_lean/<project>/Foo.lean          ← you write this (a Lake project)
        │  LeanInk analyzes it (proof states), Alectryon renders HTML
        ▼  via  ./scripts/build-lean.sh
posts/<slug>/_Foo.html            ← committed HTML fragment
posts/<slug>/alectryon.{css,js}   ← committed assets
posts/<slug>/pygments.css
        │  index.qmd does {{< include _Foo.html >}} + loads the assets
        ▼  quarto render (locally and in CI)
the published post                ← CI never runs Lean; it renders committed output
```

Two tools do the work:

- **[LeanInk](https://github.com/leanprover/LeanInk)** runs the Lean compiler and
  records the proof state at each step.
- **[Alectryon](https://github.com/cpitclaudel/alectryon)** turns that into HTML
  with the hover/stepping behaviour.

## The toolchain is pinned — and that's deliberate

LeanInk is essentially unmaintained (last release 2022; `main` pins the ancient
Lean v4.6). We use the community fork **gaetanserre/LeanInk**, pinned to **Lean
v4.19.0-rc3**. The build script sets `LEAN_SYSROOT` to that toolchain, so:

- **Proof sources in `_lean/` must compile under v4.19.0-rc3** (core Lean; no
  Mathlib unless you add it to the Lake project).
- This is **independent of your default Lean** — keep your own projects on
  whatever version you like; it won't affect or be affected by the blog.

> Modern alternative: the Lean team now ships
> [Verso](https://github.com/leanprover/verso) for literate Lean→HTML on current
> toolchains. If LeanInk becomes too painful, migrating to Verso is the
> forward-looking path. For now, LeanInk works and is simpler per-post.

## One-time: build LeanInk (and the macOS Tahoe fix)

```sh
elan toolchain install leanprover/lean4:v4.19.0-rc3
git clone https://github.com/gaetanserre/LeanInk ~/.local/src/LeanInk-g
cd ~/.local/src/LeanInk-g
lake build
```

On **macOS Tahoe (Darwin 25+)** the freshly built binary aborts at launch with
`__DATA_CONST segment missing SG_READ_ONLY flag` — Lean's bundled linker doesn't
set a flag that new dyld requires. Re-link once with Apple's system compiler
(which does set it), pointing at Homebrew's `gmp`/`uv`:

```sh
cd ~/.local/src/LeanInk-g
TC="$HOME/.elan/toolchains/leanprover--lean4---v4.19.0-rc3/lib/lean"
/usr/bin/cc -o .lake/build/bin/leanInk .lake/build/ir/**/*.c.o.export \
  -rdynamic -L "$TC" -L /opt/homebrew/lib \
  -lleancpp -lInit -lStd -lLean -lleanrt -lc++ -lLake -lgmp -luv

# put it on PATH under both name casings (Alectryon calls `leanInk`)
ln -sf ~/.local/src/LeanInk-g/.lake/build/bin/leanInk ~/.local/bin/leanink
ln -sf ~/.local/src/LeanInk-g/.lake/build/bin/leanInk ~/.local/bin/leanInk
```

(If `gmp` is missing: `brew install gmp`. `libuv` comes with the `neovim`
install.) Verify: `leanink analyze` on a tiny file should produce a `.leanInk`
JSON without aborting (a lingering `SG_READ_ONLY` line on stderr is now harmless
noise, not a crash).

Also install Alectryon into the repo venv (once):

```sh
cd ~/Documents/Workspace/enetsee.github.io
python3 -m venv .venv && .venv/bin/pip install alectryon
```

## Add a new Lean post

**1. Make a Lake project** under `_lean/` (copy `monoid-laws` as a template):

```sh
cd ~/Documents/Workspace/enetsee.github.io/_lean
cp -r monoid-laws my-topic
cd my-topic
# write your proof in a new .lean file, e.g. Group.lean
```

A project needs three things (the template already has them):

- `lean-toolchain` → `leanprover/lean4:v4.19.0-rc3`
- `lakefile.lean` → a minimal package (no deps)
- your `*.lean` proof file(s)

Configure it once: `lake update` (creates `lake-manifest.json`).

**2. Register it in the build script.** Edit `scripts/build-lean.sh` and add a
line next to the existing one:

```sh
render monoid-laws Monoid.lean lean-monoid-laws
render my-topic    Group.lean  my-topic-slug     # ← your new line
```

The three args are: `<project under _lean/>`, `<lean file>`, `<destination post
folder under posts/>`.

**3. Create the post** `posts/my-topic-slug/index.qmd`. Copy the asset wiring
from `posts/lean-monoid-laws/index.qmd` verbatim — the front-matter
`include-in-header` / `include-after-body` / `resources` block, and:

```markdown
::: {.alectryon-center}
{{< include _Group.html >}}
:::
```

(`.alectryon-center` centers the proof; the CSS is in `styles.css`.)

**4. Build, preview, publish:**

```sh
./scripts/build-lean.sh                 # regenerates _Foo.html + assets
quarto preview posts/my-topic-slug/     # check it
git add -A && git commit -m "Lean post: my topic" && git push
```

## What gets committed vs ignored

- **Committed:** `_lean/<project>/{*.lean,lakefile.lean,lean-toolchain,lake-manifest.json}`
  (reproducible source) and the rendered `posts/<slug>/_*.html` + assets.
- **Ignored:** `_lean/**/.lake/` (build dir), `.venv/`, `_lean/**/pygments.css`.

## When a proof won't render

- **`lakefile does not exist` / `.lake/packages` not found:** run `lake update`
  in the project, and `mkdir -p .lake/packages` (the build script does this, but
  if you run Alectryon by hand you need it).
- **`incompatible header` reading `Init.olean`:** `LEAN_SYSROOT` isn't pointing at
  v4.19.0-rc3. The build script sets it; if invoking by hand,
  `export LEAN_SYSROOT="$HOME/.elan/toolchains/leanprover--lean4---v4.19.0-rc3"`.
- **Proof uses a lemma that doesn't exist in v4.19:** rewrite it for core v4.19,
  or add Mathlib to the Lake project (slower build).
