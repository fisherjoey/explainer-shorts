#!/usr/bin/env bash
# Usage: ./make.sh <slug>   — videos/<slug>/script.json -> out/<slug>.mp4
# Set EXPLAINER_ENGINE to pick a TTS engine (f5-tts by default; "fake" gives a test tone) and
# EXPLAINER_REF to use a reference clip other than voice/ref.wav.
set -euo pipefail
cd "$(dirname "$0")"
slug="${1:?usage: ./make.sh <slug>}"
dir="videos/$slug"
ref="${EXPLAINER_REF:-voice/ref.wav}"
pnpm -s validate "$slug"
if [ "${EXPLAINER_ENGINE:-f5-tts}" != fake ] && [ ! -f "$ref" ]; then
  echo "no voice reference clip at $ref. Cut one from your own recording with scripts/make_ref.sh" >&2
  echo "(see 'Voice cloning' in README.md), or run with EXPLAINER_ENGINE=fake for a test tone." >&2
  exit 1
fi
uv run --extra tts explainer voice "$dir" ${EXPLAINER_ENGINE:+--engine "$EXPLAINER_ENGINE"}
uv run --extra tts explainer align "$dir" --report
pnpm -s render "$slug"
