# Blog maintainer docs

> These docs live in `_docs/`. The leading underscore means **Quarto ignores
> them** — they are committed to the repo but never rendered or published to the
> site. Same trick as `_lean/` and `_quarto.yml`.

This is the operating manual for `enetsee.github.io` — a [Quarto](https://quarto.org)
blog for technical writing (programming languages, type theory, OCaml, Lean).

## Read these in order

1. **[01-machine-setup.md](01-machine-setup.md)** — set up a fresh Mac from zero
   (Quarto, LaTeX, and the Lean rendering toolchain).
2. **[02-authoring.md](02-authoring.md)** — the day-to-day loop: new post, math,
   OCaml, live preview, publish.
3. **[03-lean-proofs.md](03-lean-proofs.md)** — render Lean proofs with hoverable
   goal states; how to add a new one.
4. **[04-troubleshooting.md](04-troubleshooting.md)** — every gotcha we hit, and
   the fix.

> **Editor:** the Neovim config is its own thing — documented at
> `~/.config/nvim/README.md`, not here. It has nothing to do with the blog.

## The 30-second mental model

```
            you write .qmd in your editor
                     │
            git push  ▼  (branch: main)
        ┌─────────────────────────────┐
        │  GitHub Action publish.yml   │   renders with Quarto,
        │  quarto-actions/publish@v2   │   pushes HTML to gh-pages
        └─────────────────────────────┘
                     │
            GitHub Pages serves  ▼
              https://enetsee.github.io   (from the gh-pages branch)
```

- **Source branch:** `main`. **Published branch:** `gh-pages` (auto-generated; you
  never edit it by hand).
- **You only ever touch `main`.** Push to it and the site updates in ~1–2 minutes.
- CI does **not** run OCaml, Lean, or LaTeX. Anything expensive (Lean proofs) is
  rendered locally and the *output* is committed (`execute: freeze: auto` +
  committed Lean fragments). CI just assembles already-rendered pieces.

## Repo layout

```
_quarto.yml            site config: theme, math, navbar, freeze
index.qmd              home page (the post listing)
about.qmd              about page
styles.css             site-wide CSS tweaks
posts/
  <slug>/index.qmd     one folder per post
  _metadata.yml        defaults applied to every post
.github/workflows/
  publish.yml          the CI that renders + deploys
_lean/                 Lake projects for Lean posts (NOT published)
_docs/                 these docs (NOT published)
scripts/build-lean.sh  regenerates Lean proof HTML
.venv/                 python venv for Alectryon (git-ignored)
```

## The golden rules

- Edit only on `main`. Never commit to `gh-pages`.
- `_freeze/` (if it appears) **is committed** on purpose. `_site/`, `.quarto/`,
  `.venv/`, and `_lean/**/.lake/` are git-ignored.
- Anything you don't want published goes in a `_`-prefixed file or folder.
