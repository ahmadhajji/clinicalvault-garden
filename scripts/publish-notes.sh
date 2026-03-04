#!/usr/bin/env bash
set -euo pipefail

REMOTE="${PUBLISH_REMOTE:-origin}"
BRANCH="${PUBLISH_BRANCH:-main}"
MESSAGE_PREFIX="${PUBLISH_MESSAGE_PREFIX:-Publish notes}"
PATHS_CSV="${PUBLISH_PATHS:-src/site/notes}"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$ROOT_DIR" ]]; then
  echo "Run this command inside a git repository." >&2
  exit 1
fi
cd "$ROOT_DIR"

IFS=',' read -r -a PATHS <<< "$PATHS_CSV"

if [[ ${#PATHS[@]} -eq 0 ]]; then
  echo "No publish paths configured." >&2
  exit 1
fi

git add -A -- "${PATHS[@]}"

if ! git diff --cached --quiet; then
  TIMESTAMP="$(date -u +'%Y-%m-%d %H:%M UTC')"
  git commit -m "$MESSAGE_PREFIX: $TIMESTAMP"
  echo "Created commit for updated notes."
else
  echo "No note changes to commit."
fi

git pull --rebase --autostash "$REMOTE" "$BRANCH"
git push "$REMOTE" "$BRANCH"

echo "Publish push complete: $REMOTE/$BRANCH"
