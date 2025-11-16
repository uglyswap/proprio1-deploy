#!/bin/bash
# Script CRON pour reset mensuel des crédits
# À ajouter dans crontab: 0 2 * * * /path/to/cron-reset-credits.sh

# Variables
APP_URL="${APP_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET}"

# Appeler l'API CRON
curl -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  "${APP_URL}/api/cron/reset-credits"

echo "CRON reset credits executed at $(date)"
