#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$PROJECT_DIR"

echo "========================================"
echo "          TICKET WAR BOT"
echo "========================================"
echo ""

pause_on_exit() {
    EXIT_CODE=$?

    echo ""
    echo "========================================"

    if [ "$EXIT_CODE" -eq 0 ]; then
        echo "Application finished successfully."
    else
        echo "Application failed with exit code: $EXIT_CODE"
    fi

    echo "========================================"
    echo ""
    read -r -p "Press Enter to close this window..."
}

trap pause_on_exit EXIT

echo "[1/3] Running TypeScript checks..."
npm run typecheck

echo ""
echo "[2/3] Running ESLint..."
npm run lint

echo ""
echo "[3/3] Starting Ticket War Bot..."
npm run dev