# Kenney Source References

This directory keeps redistributable CC0 source sheets and adjacency-preserving labeled versions for visual asset review.

## How To Refer To A Sprite

- Numbered-tile packs: use the label shown below the sprite, such as `tiny-farm tile_0058`.
- Margined spritesheets: use the zero-based row and column label, such as `roguelike-rpg-pack r3c17`.
- Relative descriptions remain useful with a label, for example: "the tile immediately right of `tile_0057` (`tile_0058`)".

Annotated sheets preserve the source sheet's original number of rows and columns. Each 16x16 source cell is enlarged to 64x64 and receives a 16px label area; tiles are never reflowed. This keeps horizontal and vertical neighbors in their original relationship.

## Packs

| Folder | Source | Grid | Label format | Runtime status |
| --- | --- | ---: | --- | --- |
| `tiny-farm` | https://kenney.nl/assets/tiny-farm | 12x11 | `tile_NNNN` | Used |
| `tiny-town` | https://kenney.nl/assets/tiny-town | 12x11 | `tile_NNNN` | Used |
| `tiny-dungeon` | https://kenney.nl/assets/tiny-dungeon | 12x11 | `tile_NNNN` | Used |
| `tiny-battle` | https://kenney.nl/assets/tiny-battle | 18x11 | `tile_NNNN` | Used |
| `roguelike-indoors` | https://kenney.nl/assets/roguelike-indoors | 27x18 | `rNcN` | Reviewed; not currently used |
| `roguelike-rpg-pack` | https://kenney.nl/assets/roguelike-rpg-pack | 57x31 | `rNcN` | Used |
| `rpg-urban-pack` | https://kenney.nl/assets/rpg-urban-pack | 27x18 | `tile_NNNN` | Reviewed directional-animation candidate |

Each pack contains official files under `original/` and a generated labeled sheet under `annotated/`. Official previews, samples, packed sheets where supplied, and license copies are retained beside the primary source sheet.

## Regeneration

Run from the repository root with ImageMagick installed:

```sh
scripts/generate-kenney-reference-sheets.zsh
```

The generator reads only the checked-in `original/` sheets and reproduces every `annotated/` image with the source grid intact.
