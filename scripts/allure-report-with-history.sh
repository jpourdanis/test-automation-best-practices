#!/usr/bin/env bash
# Builds the Allure report with trend history for GitHub Pages.
#
# A port of simple-elf/allure-report-action@v1.15's entrypoint.sh that runs on
# the runner directly instead of in a Docker image. That action rebuilt its
# image FROM public.ecr.aws/amazoncorretto on every run, and the anonymous ECR
# pull limit ("429 Too Many Requests - Data limit exceeded") kept failing the
# "Merge Reports & Publish" job. ubuntu-latest already ships Java, and the
# Allure CLI comes from npm, the same registry the job already installs from.
#
# Layout matches the action, so the existing gh-pages history keeps working:
#   $ALLURE_HISTORY/<run number>/  the new report
#   $ALLURE_HISTORY/last-history/  trend data for the next run
#   $ALLURE_HISTORY/index.html     redirect to the newest report
set -euo pipefail

ALLURE_RESULTS=${ALLURE_RESULTS:-allure-results}
ALLURE_REPORT=${ALLURE_REPORT:-allure-report}
GH_PAGES=${GH_PAGES:-gh-pages}
ALLURE_HISTORY=${ALLURE_HISTORY:-allure-history}
KEEP_REPORTS=${KEEP_REPORTS:-20}
REPORT_NAME=${REPORT_NAME:-Allure Report with history}
ALLURE_CMD=${ALLURE_CMD:-npx --yes allure-commandline@2.44.0}

RUN_NUMBER=${GITHUB_RUN_NUMBER:?GITHUB_RUN_NUMBER is not set}
RUN_ID=${GITHUB_RUN_ID:?GITHUB_RUN_ID is not set}
REPOSITORY=${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is not set}
SERVER_URL=${GITHUB_SERVER_URL:-https://github.com}
PAGES_URL=${REPORT_URL:-https://${GITHUB_REPOSITORY_OWNER:-${REPOSITORY%%/*}}.github.io/${REPOSITORY##*/}}

mkdir -p "$GH_PAGES" "$ALLURE_HISTORY" "$ALLURE_RESULTS"
cp -r "$GH_PAGES/." "$ALLURE_HISTORY"

# Keep the newest $KEEP_REPORTS run folders (same pruning as the action).
# Hidden entries (.git from the gh-pages checkout, .nojekyll) are skipped,
# as the action's `ls` did, so they are neither counted nor deleted.
list_entries() { find "$ALLURE_HISTORY" -mindepth 1 -maxdepth 1 -not -name '.*' -printf '%f\n'; }
count=$(list_entries | wc -l)
if ((count > KEEP_REPORTS + 1)); then
  echo "Pruning old reports: $count entries, keeping $KEEP_REPORTS"
  rm -rf "$ALLURE_HISTORY/index.html" "$ALLURE_HISTORY/last-history"
  list_entries | sort -n | grep -v 'CNAME' | head -n -$((KEEP_REPORTS - 1)) |
    (cd "$ALLURE_HISTORY" && xargs -r rm -rf)
fi

cat >"$ALLURE_HISTORY/index.html" <<EOF
<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="refresh" content="0; URL=${PAGES_URL}/${RUN_NUMBER}/index.html">
<meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0">
EOF

cat >"$ALLURE_RESULTS/executor.json" <<EOF
{"name":"GitHub Actions","type":"github","reportName":"${REPORT_NAME}",
"url":"${PAGES_URL}",
"reportUrl":"${PAGES_URL}/${RUN_NUMBER}",
"buildUrl":"${SERVER_URL}/${REPOSITORY}/actions/runs/${RUN_ID}",
"buildName":"GitHub Actions Run #${RUN_ID}","buildOrder":"${RUN_NUMBER}"}
EOF

if [ -d "$GH_PAGES/last-history" ]; then
  mkdir -p "$ALLURE_RESULTS/history"
  cp -r "$GH_PAGES/last-history/." "$ALLURE_RESULTS/history"
else
  echo "No previous history in $GH_PAGES/last-history; trends start fresh."
fi

$ALLURE_CMD generate --clean "$ALLURE_RESULTS" -o "$ALLURE_REPORT"

mkdir -p "$ALLURE_HISTORY/$RUN_NUMBER" "$ALLURE_HISTORY/last-history"
cp -r "$ALLURE_REPORT/." "$ALLURE_HISTORY/$RUN_NUMBER"
cp -r "$ALLURE_REPORT/history/." "$ALLURE_HISTORY/last-history"
