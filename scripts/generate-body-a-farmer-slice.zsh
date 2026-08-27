#!/usr/bin/env zsh

set -e

readonly default_aseprite="$HOME/Library/Application Support/Steam/steamapps/common/Aseprite/Aseprite.app/Contents/MacOS/aseprite"
readonly aseprite_bin="${ASEPRITE_BIN:-$default_aseprite}"
readonly source_file='assets/sprites/Pixel Crawler - Free Pack/Entities/Characters/Body_A/Animations/Walk_Base/Walk_Side.aseprite'
readonly output_dir='assets/game/experiments/body-a-farmer-slice'
readonly authoring_file="$output_dir/farmer-walk-side.aseprite"

mkdir -p "$output_dir"

"$aseprite_bin" -b \
  --script-param "source=$source_file" \
  --script-param "output=$authoring_file" \
  --script scripts/aseprite/body-a-farmer-slice.lua

"$aseprite_bin" -b --list-layers --list-tags "$authoring_file" \
  --sheet "$output_dir/farmer-walk-side.png" \
  --data "$output_dir/farmer-walk-side.json" \
  --format json-array \
  --sheet-type horizontal

magick "$output_dir/farmer-walk-side.png" \
  -filter point -resize 3072x512 \
  "$output_dir/farmer-walk-side-8x.png"

print "Wrote $authoring_file and compiled review sheets"