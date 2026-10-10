#!/bin/bash

cd /Users/lukmannudin/Projects/javascript/ticket-war-bot || exit 1

echo "========================================"
echo "       KAHITNA TICKET WAR BOT"
echo "========================================"
echo ""
echo "Starting bot..."
echo ""

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

caffeinate -i npm run dev

echo ""
echo "Bot finished."
read -r -p "Press Enter to close Terminal..."
