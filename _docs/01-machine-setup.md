# 01 — Machine setup (from zero)

Everything you need to build and publish the blog on a fresh macOS machine
(Apple Silicon). Assumes [Homebrew](https://brew.sh) is installed.

## 1. Core toolchain

```sh
brew install git gh    # gh = GitHub CLI, used for publishing
```

(Editor tooling is separate — set up your editor however you like. If you use the
Neovim config, its install steps are in `~/.config/nvim/README.md`.)

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

## 3. Editor

The blog is just text files — use whatever editor you like. (I use Neovim; that
config and its own docs live at `~/.config/nvim/README.md`, separate from the
blog and from these docs.)

## 4. Lean rendering toolchain (only if you write Lean posts)

This is the involved one — see **[03-lean-proofs.md](03-lean-proofs.md)** for the
full story and the macOS caveat. The short version:

```sh
# Python venv for Alectryon (Quarto/Lean rendering helper)
python3 -m venv .venv
.venv/bin/pip install alectryon

# Lean + the LeanInk fork (pinned to Lean v4.19.0-rc3)
elan toolchain install leanprover/lean4:v4.19.0-rc3
git clone https://github.com/gaetanserre/LeanInk ~/.local/src/LeanInk-g
cd ~/.local/src/LeanInk-g && lake build
# then RE-LINK the binary for macOS Tahoe — see 03-lean-proofs.md
```

## 5. Sanity check

```sh
cd ~/Documents/Workspace/enetsee.github.io
quarto preview          # opens the site locally with live reload
```

If that opens a browser showing the blog, you're done. Next:
**[02-authoring.md](02-authoring.md)**.
