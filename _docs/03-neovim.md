# 03 — Neovim (tuned to feel like VSCode)

Config lives at `~/.config/nvim/` (not in this repo). It's a from-scratch Lua
setup built around [lazy.nvim](https://lazy.folke.io), themed and keybound to
feel like VSCode. Your old 2021 `init.vim` is backed up at
`~/.config/nvim/init.vim.bak.2021`.

## File layout

```
~/.config/nvim/
  init.lua                 sets leader, loads the modules below
  lua/config/options.lua   editor behaviour (numbers, clipboard, spell, etc.)
  lua/config/keymaps.lua    VSCode-style keybindings
  lua/config/lazy.lua       plugin-manager bootstrap
  lua/plugins/
    ui.lua                 theme, file tree, tabs, statusline, terminal, git
    editor.lua             telescope, treesitter (+ a compat shim), comments
    lsp.lua                LSP (native 0.11 API), Mason, completion, formatting
    quarto.lua             quarto-nvim + otter (LSP inside code cells)
    lean.lua               lean.nvim (LSP + interactive infoview)
```

To change anything, edit the relevant file and restart Neovim (lazy.nvim
auto-syncs on change). `:Lazy` opens the plugin manager UI; `:Mason` the LSP
installer; `:checkhealth` diagnoses problems.

## Keybinding cheat sheet

Leader is **Space**. The bindings mirror VSCode where it makes sense:

| Keys | Action | VSCode analog |
|------|--------|---------------|
| `Ctrl-S` | Save | Save |
| `Ctrl-P` | Find files (fuzzy) | Quick Open |
| `Ctrl-Shift-P` | Command palette | Command Palette |
| `Ctrl-B` / `Space e` | Toggle file explorer | Toggle Side Bar |
| `Ctrl-Shift-F` | Search across files (grep) | Search |
| `Ctrl-\`` | Toggle integrated terminal | Terminal |
| `Ctrl-/` | Toggle comment (line/selection) | Comment |
| `Shift-L` / `Shift-H` | Next / previous buffer tab | Ctrl-Tab |
| `Ctrl-W` | Close buffer | Close tab |
| `Ctrl-h/j/k/l` | Move between split windows | — |
| `Esc` | Clear search highlight | — |

LSP (active when a language server attaches):

| Keys | Action |
|------|--------|
| `gd` / `F12` | Go to definition |
| `gr` / `Shift-F12` | Find references |
| `gi` | Go to implementation |
| `K` | Hover docs |
| `F2` | Rename symbol |
| `Space ca` | Code action |
| `[d` / `]d` | Previous / next diagnostic |

Completion popup: `Tab`/`Shift-Tab` to cycle, `Enter` to accept, `Ctrl-Space` to
trigger.

Quarto: `Space qp` = live preview, `Space qq` = close preview.

Lean (in `.lean` files): `lean.nvim`'s infoview opens automatically and shows the
goal state at the cursor. Its commands live under `<localleader>` (also Space).

## What each language gets

- **Markdown / Quarto (`.qmd`):** treesitter highlighting, prose spell-check,
  and — via `otter.nvim` — LSP/completion *inside* fenced code cells. Live
  preview with `:QuartoPreview`.
- **OCaml:** highlighting always; full LSP (hover, go-to-def, completion,
  format-on-save) **if** `ocaml-lsp-server` is in your active opam switch
  (`opam install ocaml-lsp-server ocamlformat`).
- **Lean:** full LSP + interactive goal infoview from `lean.nvim`, using whatever
  toolchain the project's `lean-toolchain` pins.
- **Lua / Bash / others:** treesitter + LSP where a server is installed via Mason.

## Notes / intentional quirks

- **Treesitter is pinned to the `master` branch.** The newer `main` branch
  dropped the classic config API. `editor.lua` also contains a small
  compatibility shim re-registering the markdown injection directive, because
  the archived `master` branch crashes on Neovim 0.12's query format. Don't
  remove it — without it, fenced-code highlighting and otter break. (Details in
  [05-troubleshooting.md](05-troubleshooting.md#neovim-treesitter-crash).)
- **No `latex` treesitter parser** is installed (it needs npm-based generation).
  Math in `.qmd` is just text; MathJax renders it in preview. Not a problem.
- **LSP uses the native `vim.lsp.config` / `vim.lsp.enable` API** (Neovim 0.11+),
  not the deprecated `require('lspconfig').x.setup{}` framework.
