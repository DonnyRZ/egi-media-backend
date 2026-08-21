#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/egi-media/cms/backend"
BRANCH="develop"
SERVICE="egi-media-cms-backend"
HEALTH_URL="http://127.0.0.1:5002/api-docs/"

cd "$APP_DIR"
export PATH="/usr/local/bin:/usr/bin:$PATH"

PREV="$(git rev-parse --short HEAD)"
echo "staging backend previous: ${PREV} ($(git branch --show-current))"

git fetch origin "${BRANCH}"

if [ "${FORCE_DEPLOY:-0}" != "1" ] \
  && [ "$(git branch --show-current)" = "${BRANCH}" ] \
  && [ "$(git rev-parse HEAD)" = "$(git rev-parse "origin/${BRANCH}")" ]; then
  echo "staging backend already at origin/${BRANCH} ${PREV}"
  exit 0
fi

if ! git diff --quiet -- . ':!node_modules' ':!uploads'; then
  echo "abort: tracked files are dirty in ${APP_DIR}"
  git status --short -- . ':!node_modules' ':!uploads'
  exit 1
fi

git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

NEW="$(git rev-parse --short HEAD)"
echo "staging backend current: ${NEW}"

npm ci

if [ -f src/migrations/031_youtube_video_review.sql ]; then
  if sudo -n -u postgres psql -d egi_media -c "SELECT 1" >/dev/null 2>&1; then
    sudo -u postgres psql -d egi_media -v ON_ERROR_STOP=1 \
      -f src/migrations/031_youtube_video_review.sql
  else
    node scripts/run-youtube-video-review-migration.js
  fi
fi

systemctl restart "${SERVICE}"
systemctl is-active --quiet "${SERVICE}"

sleep 3
curl -fsSL -o /dev/null -w "backend health %{http_code}\n" "${HEALTH_URL}"

echo "staging backend deploy ok ${PREV} -> ${NEW}"
echo "rollback: cd ${APP_DIR} && git checkout ${PREV} && npm ci && systemctl restart ${SERVICE}"
