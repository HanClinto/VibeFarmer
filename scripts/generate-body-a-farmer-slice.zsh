#!/usr/bin/env zsh

set -e

readonly default_aseprite="$HOME/Library/Application Support/Steam/steamapps/common/Aseprite/Aseprite.app/Contents/MacOS/aseprite"
readonly aseprite_bin="${ASEPRITE_BIN:-$default_aseprite}"
readonly source_file='assets/sprites/Pixel Crawler - Free Pack/Entities/Characters/Body_A/Animations/Walk_Base/Walk_Side.aseprite'
readonly output_dir='assets/game/experiments/body-a-farmer-slice'
readonly input_dir="$output_dir/pixellab-input"
readonly pixen_reference="$output_dir/pixellab-pixen-farmer-reference.png"
readonly pixen_input="$output_dir/pixen-contact-sheet-input.png"
readonly pixen_output="$output_dir/pixen-contact-sheet-output.png"
readonly pixen_frames_dir="$output_dir/pixen-contact-sheet-frames"
readonly pro_frames_dir="$output_dir/pixellab-pro-frames"
readonly normalized_dir="$output_dir/farmer-normalized"

rm -rf "$input_dir" "$normalized_dir" "$pixen_frames_dir"
mkdir -p "$input_dir" "$normalized_dir"

"$aseprite_bin" -b "$source_file" \
  --save-as "$input_dir/frame-{frame}.png"

"$aseprite_bin" -b --list-layers --list-tags "$source_file" \
  --sheet "$output_dir/body-a-walk-side.png" \
  --data "$output_dir/body-a-walk-side.json" \
  --format json-array \
  --sheet-type horizontal

for input_frame in "$input_dir"/frame-*.png; do
  magick "$input_frame" -strip -define png:color-type=6 "$input_frame"
done

if [[ -f "$pixen_reference" ]]; then
  magick montage "$pixen_reference" "$input_dir"/frame-{1..5}.png \
    -tile 3x2 -geometry 64x64+0+0 -background none "$pixen_input"
fi

if [[ -f "$pixen_output" ]]; then
  mkdir -p "$pixen_frames_dir"
  magick "$pixen_output" -crop 64x64 +repage +adjoin \
    "$pixen_frames_dir/frame-%d.png"
  generated_dir="$pixen_frames_dir"
  output_name='pixen-contact-sheet-normalized-walk-side'
elif [[ -f "$pro_frames_dir/frame-0.png" ]]; then
  generated_dir="$pro_frames_dir"
  output_name='pixellab-pro-normalized-walk-side'
else
  print "Prepared PixelLab inputs in $input_dir"
  if [[ -f "$pixen_input" ]]; then
    print "Submit $pixen_input to edit_image_pixen, save the result as $pixen_output, and rerun"
  else
    print "Create a Pixen farmer reference at $pixen_reference, then rerun"
  fi
  exit 0
fi

for input_frame in "$input_dir"/frame-*.png; do
  frame_name="${input_frame:t}"
  generated_frame="$generated_dir/$frame_name"

  if [[ ! -f "$generated_frame" ]]; then
    print -u2 "Missing generated frame: $generated_frame"
    exit 1
  fi

  source_bounds=$(magick "$input_frame" -format '%@' info:)
  generated_bounds=$(magick "$generated_frame" -format '%@' info:)
  source_y=$(print "$source_bounds" | sed -E 's/^[0-9]+x[0-9]+\+[0-9]+\+([0-9]+)$/\1/')
  source_height=$(print "$source_bounds" | sed -E 's/^[0-9]+x([0-9]+).*/\1/')
  generated_y=$(print "$generated_bounds" | sed -E 's/^[0-9]+x[0-9]+\+[0-9]+\+([0-9]+)$/\1/')
  generated_height=$(print "$generated_bounds" | sed -E 's/^[0-9]+x([0-9]+).*/\1/')
  y_shift=$(((source_y + source_height - 1) - (generated_y + generated_height - 1)))

  magick "$generated_frame" -roll +0${y_shift} "$normalized_dir/$frame_name"
done

magick "$normalized_dir"/frame-*.png +append \
  "$output_dir/$output_name.png"
magick "$output_dir/$output_name.png" \
  -filter point -resize 3072x512 \
  "$output_dir/$output_name-8x.png"
magick -delay 10 -dispose background "$normalized_dir"/frame-*.png \
  -loop 0 "$output_dir/$output_name.gif"

print "Normalized PixelLab frames into $output_dir/$output_name.png"