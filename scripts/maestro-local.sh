#!/usr/bin/env bash
# Run the Maestro smoke suite against the installed Hone APK.
#
# Prerequisites
#   1. Maestro CLI installed:  curl -Ls "https://get.maestro.mobile.dev" | bash
#   2. Android device connected via USB with USB debugging enabled,
#      OR an Android emulator running (API 26+).
#   3. Hone APK installed on the device/emulator.
#
# Usage
#   From the repo root: ./scripts/maestro-local.sh
#   Single flow:        maestro test maestro/flows/02-browse-recipe.yaml
#
# Output
#   Pass/fail per flow. On failure: screenshot saved to ~/.maestro/tests/<timestamp>/.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLOWS_DIR="$REPO_ROOT/maestro/flows"

if ! command -v maestro &>/dev/null; then
  echo "Maestro CLI not found. Install with:"
  echo "  curl -Ls \"https://get.maestro.mobile.dev\" | bash"
  exit 1
fi

echo "Running Hone Maestro suite against connected device..."
maestro test "$FLOWS_DIR"
