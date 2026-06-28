#!/usr/bin/env bash
# Re-encode product 3D videos for web: H.264 + WebM, max 1280px, high quality.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IN="$ROOT/img"
OUT="$ROOT/img/videos"
mkdir -p "$OUT"

encode_pair() {
  local input="$1"
  local base="$2"
  echo "→ $base"
  ffmpeg -y -i "$input" -an \
    -vf "scale='min(1280,iw)':-2:flags=lanczos" \
    -c:v libx264 -crf 21 -preset medium -pix_fmt yuv420p \
    -movflags +faststart \
    "$OUT/${base}.mp4" 2>/dev/null
  ffmpeg -y -i "$input" -an \
    -vf "scale='min(1280,iw)':-2:flags=lanczos" \
    -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 \
    "$OUT/${base}.webm" 2>/dev/null
  ls -lh "$OUT/${base}.mp4" "$OUT/${base}.webm"
}

encode_pair "$IN/HELPER+Box.MP4"    "helper-box"
encode_pair "$IN/HELPER+Slim.MP4"    "helper-slim"
encode_pair "$IN/HELPER+Slim+стійка.MP4" "helper-slim-stand"
encode_pair "$IN/bloomy.MP4"         "bloomy"

echo "Done."
