#!/bin/zsh
# Double-click once: creates a private GitHub repo "inkboard" and pushes this folder.
# Later, double-click again to push new changes.
cd "$(dirname "$0")"
command -v gh >/dev/null || { echo "Installing GitHub CLI…"; brew install gh || { echo "Install Homebrew first: https://brew.sh"; read; exit 1; }; }
gh auth status >/dev/null 2>&1 || gh auth login --web
[ -d .git ] || { git init -q -b main; }
git add -A
git commit -qm "Update Inkboard $(date '+%Y-%m-%d %H:%M')" || echo "Nothing new to commit."
if git remote get-url origin >/dev/null 2>&1; then git push -u origin main
else gh repo create inkboard --private --source=. --push; fi
echo; echo "Done. Repo: $(gh repo view --json url -q .url 2>/dev/null)"; read "?Press Enter to close"
