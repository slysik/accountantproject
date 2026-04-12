#!/bin/bash
# Restart the local dev server

# Kill existing process on port 3000
pid=$(lsof -ti :3000 2>/dev/null)
if [ -n "$pid" ]; then
  kill "$pid" 2>/dev/null
  sleep 0.5
fi

# Start dev server
exec bun run dev
