# 01 — Machine setup (from zero)

Everything you need to build and publish the blog on a fresh macOS machine
(Apple Silicon). Assumes [Homebrew](https://brew.sh) is installed.

## 1. Core toolchain

```sh
# CLI tools
brew install neovim ripgrep fd          # editor + fuzzy-find/grep helpers
brew install git gh                      # gh = GitHub CLI (for publishing)
brew install tree-sitter tree-sitter-cli # Neovim treesitter needs the lib + CLI
```

### Quarto

The Homebrew **cask** runs a `.pkg` installer that needs `sudo`. To avoid that,
install from the tarball into your home dir and symlink the binary:

```sh
VER=1.9.38   # check https://github.com/quarto-dev/quarto-cli/releases for latest
mkdir -p ~/.local/quarto-$VER ~/.local/bin
curl -fL "https://github.com/quarto-dev/quarto-cli/releases/download/v$VER/quarto-$VER-macos.tar.gz" \
  | tar -xz -C ~/.local/quarto-$VER --strip-components=1
ln -sf ~/.local/quarto-$VER/bin/quarto /opt/homebrew/bin/quarto
quarto --version
```

### LaTeX (for PDF export of posts)

```sh
quarto install tinytex            # a self-contained TeX Live subset, no sudo
quarto check                      # should report: Checking LaTeX .... OK
```

`tinytex` lives at `~/Library/TinyTeX`. The setup adds its `bin` to `~/.zshrc`
so `pdflatex` is on PATH in new shells. (Quarto finds it regardless.)

## 2. Clone the repo

```sh
gh auth login                                   # if not already logged in
cd ~/Documents/Workspace
gh repo clone enetsee/enetsee.github.io
cd enetsee.github.io
```

## 3. Neovim

The config is at `~/.config/nvim/` (tracked separately from the blog). On first
launch it bootstraps [lazy.nvim](https://lazy.folke.io) and installs everything.

```sh
nvim --headless "+Lazy! sync" +qa               # install plugins
# install treesitter parsers (open any file once, or force them):
nvim --headless "+Lazy! load nvim-treesitter" \
  "+TSInstallSync markdown markdown_inline ocaml ocaml_interface lua bash yaml json" +qa
```

For OCaml LSP **inside** code cells, install the language server in your opam
switch (optional — highlighting works without it):

```sh
opam install ocaml-lsp-server ocamlformat
```

See **[03-neovim.md](03-neovim.md)** for the full editor walkthrough.

## 4. Lean rendering toolchain (only if you write Lean posts)

This is the involved one — see **[04-lean-proofs.md](04-lean-proofs.md)** for the
full story and the macOS caveat. The short version:

```sh
# Python venv for Alectryon (Quarto/Lean rendering helper)
python3 -m venv .venv
.venv/bin/pip install alectryon

# Lean + the LeanInk fork (pinned to Lean v4.19.0-rc3)
elan toolchain install leanprover/lean4:v4.19.0-rc3
git clone https://github.com/gaetanserre/LeanInk ~/.local/src/LeanInk-g
cd ~/.local/src/LeanInk-g && lake build
# then RE-LINK the binary for macOS Tahoe — see 04-lean-proofs.md
```

## 5. Sanity check

```sh
cd ~/Documents/Workspace/enetsee.github.io
quarto preview          # opens the site locally with live reload
```

If that opens a browser showing the blog, you're done. Next:
**[02-authoring.md](02-authoring.md)**.
