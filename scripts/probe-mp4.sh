#!/usr/bin/env bash
set -euo pipefail
mp4="${1:?usage: scripts/probe-mp4.sh <file.mp4> [WxH] [fps]}"
expected_resolution="${2:-}"
expected_fps="${3:-}"
ffprobe_bin="${FFPROBE:-ffprobe}"
if ! command -v "$ffprobe_bin" >/dev/null 2>&1; then
  ffprobe_bin="node_modules/@remotion/compositor-linux-x64-gnu/ffprobe"
fi
value(){ "$ffprobe_bin" -v error -select_streams v:0 -show_entries "$1" -of csv=p=0 "$mp4" | head -1; }
width=$(value stream=width); height=$(value stream=height); codec=$(value stream=codec_name); rate=$(value stream=r_frame_rate); duration=$("$ffprobe_bin" -v error -show_entries format=duration -of csv=p=0 "$mp4")
fps=$(awk -v r="$rate" 'BEGIN{split(r,a,"/"); printf "%.4g", (a[2]+0)?a[1]/a[2]:a[1]}')
printf '%s: %sx%s %s %.4gfps %.2fs\n' "$(basename "$mp4")" "$width" "$height" "$codec" "$fps" "${duration:-0}"
if [ -n "$expected_resolution" ] && [ "${width}x${height}" != "$expected_resolution" ]; then echo "resolution mismatch" >&2; exit 1; fi
if [ -n "$expected_fps" ] && ! awk -v a="$fps" -v b="$expected_fps" 'BEGIN{exit !((a-b)<0.5 && (a-b)>-0.5)}'; then echo "fps mismatch" >&2; exit 1; fi
[ "$codec" = h264 ] || { echo "codec is not h264" >&2; exit 1; }
echo 'spec OK'
