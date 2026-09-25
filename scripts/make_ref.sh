#!/usr/bin/env bash
# Cut a voice reference clip from your own recording.
#
#   scripts/make_ref.sh <recording> <start> <end> <transcript> [--demucs]
#
# <recording>   any audio or video file ffmpeg can read (a voice memo, a screen recording...)
# <start> <end> the part to keep, in seconds or hh:mm:ss.xx. Aim for 8 to 12 seconds of clean,
#               continuous speech: F5-TTS clips a reference longer than 12 s.
# <transcript>  exactly what is said in that span, word for word. F5-TTS reads it.
# --demucs      separate the voice from background music or noise first. Needs Demucs
#               (https://github.com/adefossez/demucs) on PATH, or set DEMUCS to the command
#               that runs it, for example DEMUCS="uvx demucs".
#
# Writes voice/ref.wav (mono, 24 kHz) and voice/ref.txt. Only use a voice you own or have explicit
# permission to clone.
set -euo pipefail
cd "$(dirname "$0")/.."

usage() { sed -n '4,15p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }
[ $# -ge 4 ] || usage
src=$1 start=$2 end=$3 text=$4 demucs=${5:-}
[ -f "$src" ] || { echo "make_ref: no such file: $src" >&2; exit 1; }
[ -z "$demucs" ] || [ "$demucs" = "--demucs" ] || usage

out=voice
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$out"

ffmpeg -v error -y -i "$src" -vn -ac 2 -ar 44100 "$work/full.wav"
input="$work/full.wav"
if [ "$demucs" = "--demucs" ]; then
  ${DEMUCS:-demucs} --two-stems vocals -n htdemucs -o "$work" "$work/full.wav"
  input="$work/htdemucs/full/vocals.wav"
fi
ffmpeg -v error -y -ss "$start" -to "$end" -i "$input" -ac 1 -ar 24000 "$out/ref.wav"
printf '%s\n' "$text" > "$out/ref.txt"

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/ref.wav")
echo "wrote $out/ref.wav (${dur}s) and $out/ref.txt"
awk -v d="$dur" 'BEGIN { if (d > 12) print "warning: over 12 s; F5-TTS will clip it and the transcript will no longer match" }'
