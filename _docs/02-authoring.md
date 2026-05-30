# 02 — Authoring posts

The day-to-day loop. Assumes setup from [01-machine-setup.md](01-machine-setup.md).

## The loop in one breath

```sh
cd ~/Documents/Workspace/enetsee.github.io
git pull                      # in case you wrote from another machine
# ... create/edit a post ...
quarto preview                # live preview in the browser, reloads on save
git add -A && git commit -m "New post: ..." && git push   # publishes
```

Push to `main` → the GitHub Action renders and deploys → live at
`https://enetsee.github.io` in ~1–2 minutes.

## Create a new post

Each post is a folder under `posts/` containing an `index.qmd`:

```sh
mkdir -p posts/my-new-post
$EDITOR posts/my-new-post/index.qmd
```

Minimal front matter:

```yaml
---
title: "A Catchy Title"
description: "One sentence shown in the listing."
author: "Michael Thomas"
date: "2026-06-01"
categories: [ocaml, type-theory]   # become filterable tags on the home page
---
```

- The home page (`index.qmd`) lists posts automatically, newest first. No need to
  register the post anywhere.
- Put images and other assets **in the post folder** and reference them
  relatively (`![](diagram.png)`). They get copied alongside the page.
- A post's first image becomes its listing thumbnail unless you set
  `image: thumb.png` in the front matter.

## Math

Inline math with `$…$`, display math with `$$…$$`:

```markdown
The monoid $(\NN, +, 0)$ satisfies $e \cdot x = x$.

$$
(x \cdot y) \cdot z = x \cdot (y \cdot z)
$$
```

Rendered in the browser by MathJax — no LaTeX install needed for HTML. A few
shortcut macros are predefined site-wide in `_quarto.yml` (`\RR`, `\NN`, `\ZZ`,
`\llbracket`, `\rrbracket`); add more there.

## Code

Fenced blocks are syntax-highlighted. OCaml works out of the box:

````markdown
```ocaml
let rec map f = function
  | [] -> []
  | x :: xs -> f x :: map f xs
```
````

Other languages: anything in `quarto pandoc --list-highlight-languages`.
**Code is not executed** — paste any output yourself. (Lean proofs are a special
case with real proof states — see [04-lean-proofs.md](04-lean-proofs.md).)

## Preview while writing

```sh
quarto preview                       # whole site
quarto preview posts/my-new-post/    # just one post, faster
```

Or from inside Neovim, open the `.qmd` and run `:QuartoPreview` (or `<Space>qp`).
The browser reloads every time you save.

## Export a post to PDF (optional)

Add a `pdf` format to the post's front matter:

```yaml
format:
  html: default
  pdf: default
```

Then `quarto render posts/my-new-post/index.qmd --to pdf`. Requires TinyTeX
(installed in setup). The HTML site is unaffected.

## Publish

```sh
git add -A
git commit -m "New post: A Catchy Title"
git push                     # this is the publish action
```

Watch the deploy:

```sh
gh run watch                 # follow the latest Action run
gh run list --limit 3        # recent runs + pass/fail
```

If you don't see changes in the browser afterwards, it's almost always **cache** —
see [05-troubleshooting.md](05-troubleshooting.md#i-dont-see-my-changes).

## Edit something site-wide

- **Theme, navbar, math macros, TOC:** `_quarto.yml`.
- **CSS tweaks:** `styles.css`.
- **Defaults for all posts:** `posts/_metadata.yml`.
- **About page:** `about.qmd`.
