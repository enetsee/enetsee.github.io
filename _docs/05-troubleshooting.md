# 05 — Troubleshooting

The real problems we hit setting this up, and the fixes. Skim the headers.

## I don't see my changes {#i-dont-see-my-changes}

99% of the time this is **caching**, not a broken deploy. The server updates;
your browser (and GitHub's CDN) don't.

1. Confirm the deploy succeeded: `gh run list --limit 3` (look for ✓ success).
2. Confirm the *server* has your change, bypassing cache:
   ```sh
   curl -s "https://enetsee.github.io/?cb=$(date +%s)" | grep -o '<title>.*</title>'
   ```
3. If the server is right but your browser is wrong: **hard refresh**
   (`Cmd-Shift-R`), or open a private window, or append `?v=2` to the URL.
4. GitHub's CDN edge cache can lag ~10 minutes after a deploy. Wait it out.

## CI fails: "Multiple previous publishes exist" {#multiple-publishes}

Cause: a committed `_publish.yml` with an id that doesn't match a real
deployment. **Quarto 1.9 does not generate `_publish.yml` for gh-pages**, and you
don't need one. Fix: delete `_publish.yml`, commit, push. The
`quarto-actions/publish@v2` step works fine with just `target: gh-pages`.

## First `quarto publish gh-pages` errors: no `gh-pages` branch {#first-publish}

`quarto publish gh-pages --no-prompt` refuses to create the branch. Seed an empty
one first, then publish:

```sh
EMPTY=$(git hash-object -t tree /dev/null)
INIT=$(git commit-tree "$EMPTY" -m "Initialize gh-pages")
git push origin "${INIT}:refs/heads/gh-pages"     # braces matter: zsh eats $INIT:r
quarto publish gh-pages --no-prompt
```

Then point Pages at it (once):

```sh
gh api -X PUT repos/enetsee/enetsee.github.io/pages \
  -f 'source[branch]=gh-pages' -f 'source[path]=/'
```

(`build_type: legacy` in the Pages API just means "serve this branch as-is" — correct
for our pre-built HTML.)

## Quarto cask install asks for a sudo password and fails {#quarto-sudo}

The Homebrew cask runs a `.pkg` installer needing `sudo`, which can't prompt in a
non-interactive shell. Use the tarball install instead — see
[01-machine-setup.md](01-machine-setup.md#quarto).

## Neovim won't start: `libtree-sitter.0.26.dylib` not found

The Homebrew `neovim` bottle needs the `tree-sitter` library:
`brew install tree-sitter`.

## Neovim treesitter crash on `.qmd`: "attempt to call method 'range' (a nil value)" {#neovim-treesitter-crash}

`nvim-treesitter`'s archived `master` branch ships a markdown injection directive
written for the pre-0.11 query format; Neovim 0.12 passes a *list* of nodes, so it
crashes — which breaks otter and fenced-code highlighting. Fixed by a shim in
`~/.config/nvim/lua/plugins/editor.lua` that re-registers
`set-lang-from-info-string!` (and `set-lang-from-mimetype!`) with
`{ force = true, all = true }` and handles the node-list. **Don't delete the shim.**
(Longer-term fix would be moving to the treesitter `main` branch.)

## Neovim: nvim-lspconfig deprecation traceback at startup

`require('lspconfig').x.setup{}` is deprecated on Neovim 0.11+. The config uses the
native `vim.lsp.config(...)` + `vim.lsp.enable({...})` API instead. If you re-add a
server, follow that pattern — don't call the old `.setup{}`.

## Lean: `leanInk` aborts with `SG_READ_ONLY` {#leanink-abort}

macOS Tahoe rejects binaries linked by Lean's bundled linker. Re-link with the
system compiler — full recipe in [04-lean-proofs.md](04-lean-proofs.md#one-time-build-leanink-and-the-macos-tahoe-fix).
A `SG_READ_ONLY` line on **stderr without a crash** is harmless; the build script
filters it out.

## Lean: `incompatible header` reading `Init.olean`

`leanInk` is finding the wrong toolchain's `.olean` files. Set
`LEAN_SYSROOT="$HOME/.elan/toolchains/leanprover--lean4---v4.19.0-rc3"`. The build
script does this for you.

## Lean: `lakefile does not exist` or missing `.lake/packages`

`leanInk --lake` needs a configured project. In the `_lean/<project>` dir run
`lake update`, then `mkdir -p .lake/packages` (empty is fine for dependency-free
projects). The build script handles both.

## Something I don't want is showing up on the site

Anything that should never be published must start with `_` (file or folder).
Quarto skips `_quarto.yml`, `_lean/`, `_docs/`, `posts/_metadata.yml`, and any
`_foo.html` include. If a stray file is being copied to `_site/`, prefix it with
`_` or add it to the post's front matter exclusions.

## Useful commands

```sh
quarto check                 # verify Quarto + LaTeX + engines
quarto preview               # local server, live reload
quarto render                # render the whole site to _site/ (local only)
gh run watch                 # follow the latest deploy
gh run view <id> --log-failed   # see why a deploy failed
```
