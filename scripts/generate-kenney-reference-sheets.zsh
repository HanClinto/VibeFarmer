#!/bin/zsh

set -e

reference_root=${1:-assets/reference/kenney}
cell_size=64
label_height=16

if ! command -v magick >/dev/null; then
  print -u2 "ImageMagick is required (missing: magick)"
  exit 1
fi

generate_sheet() {
  local slug=$1
  local sheet_name=$2
  local columns=$3
  local rows=$4
  local margin=$5
  local label_mode=$6
  local source_sheet="$reference_root/$slug/original/$sheet_name"
  local output_dir="$reference_root/$slug/annotated"
  local work_dir
  local -a tiles

  work_dir=$(mktemp -d)
  mkdir -p "$output_dir"

  local row column index label x y output
  for ((row = 0; row < rows; row += 1)); do
    for ((column = 0; column < columns; column += 1)); do
      index=$((row * columns + column))
      if [[ $label_mode == tile ]]; then
        label=$(printf 'tile_%04d' $index)
      else
        label="r${row}c${column}"
      fi
      x=$((column * (16 + margin)))
      y=$((row * (16 + margin)))
      output="$work_dir/$(printf '%04d' $index).png"
      magick "$source_sheet" \
        -crop "16x16+${x}+${y}" +repage \
        -filter point -resize "${cell_size}x${cell_size}" \
        -background '#20242b' -gravity south -splice "0x${label_height}" \
        -fill white -font Menlo -pointsize 9 -annotate +0+3 "$label" \
        "$output"
      tiles+=("$output")
    done
  done

  magick montage "${tiles[@]}" \
    -tile "${columns}x${rows}" -geometry +1+1 -background '#111318' \
    "$output_dir/${sheet_name:r}-labeled.png"
  rm -rf "$work_dir"
}

generate_sheet tiny-farm tilemap.png 12 11 1 tile
generate_sheet tiny-town tilemap.png 12 11 1 tile
generate_sheet tiny-dungeon tilemap.png 12 11 1 tile
generate_sheet tiny-battle tilemap.png 18 11 1 tile
generate_sheet roguelike-indoors spritesheet.png 27 18 1 coordinate
generate_sheet roguelike-rpg-pack spritesheet.png 57 31 1 coordinate
generate_sheet rpg-urban-pack tilemap.png 27 18 1 tile