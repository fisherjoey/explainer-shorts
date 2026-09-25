#!/usr/bin/env bash
# Makes videos/_fixture/audio/voice.wav: a quiet 220 Hz tone as long as the fixture's
# timing.json total, so `pnpm render _fixture` has a real audio stream to mux and check.
set -euo pipefail
cd "$(dirname "$0")/.."

total=$(node -p 'JSON.parse(require("node:fs").readFileSync("videos/_fixture/timing.json", "utf8")).total')
mkdir -p videos/_fixture/audio
ffmpeg -v error -y -f lavfi -i "sine=frequency=220:duration=${total}" \
  -ar 24000 -ac 1 -af volume=0.05 videos/_fixture/audio/voice.wav
echo "videos/_fixture/audio/voice.wav (${total}s)"
