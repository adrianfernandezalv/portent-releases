#!/usr/bin/env bash
# Daily update checks per app version, from the Analytics Engine dataset the Pages Functions
# write to (functions/_count.js). Needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN
# (Account Analytics: Read); when unset, both are read from 1Password ($STATS_OP_ITEM).
#   scripts/stats.sh [appcast|models] [days]
set -euo pipefail
feed=${1:-appcast}
days=${2:-14}
[[ $feed =~ ^(appcast|models)$ && $days =~ ^[0-9]+$ ]] || { echo "usage: $0 [appcast|models] [days]" >&2; exit 1; }

item=${STATS_OP_ITEM:-op://Dev/Cloudflare portent analytics}
account=${STATS_OP_ACCOUNT:-my.1password.com}
[[ -n ${CLOUDFLARE_ACCOUNT_ID:-} ]] || CLOUDFLARE_ACCOUNT_ID=$(op read --account "$account" "$item/account id")
[[ -n ${CLOUDFLARE_API_TOKEN:-} ]] || CLOUDFLARE_API_TOKEN=$(op read --account "$account" "$item/credential")

# Analytics Engine SQL has no TabSeparatedWithNames, so the header is printed here.
{ printf 'day\tapp\tversion\tchecks\n'
curl -sS --fail-with-body "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data "SELECT toDate(timestamp) AS day, blob2 AS app, if(blob3 = '', '-', blob3) AS version, SUM(_sample_interval) AS checks
FROM portent_checks
WHERE index1 = '$feed' AND timestamp > NOW() - INTERVAL '$days' DAY
GROUP BY day, app, version
ORDER BY day DESC, checks DESC
FORMAT TabSeparated"
} | column -t -s $'\t'
