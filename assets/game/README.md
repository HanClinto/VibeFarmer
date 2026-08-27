# Runtime Art

This directory contains only artwork cleared for redistribution in Vibe Farmer's public source repository. The Canvas renderer and DOM inventory UI load these files through `catalog.json`.

## Current Status

The checked-in files are the curated CC0 runtime art base. They are not yet runtime-complete. See `catalog.json` and `docs/plans/art-direction.md`.

Missing production frames include the robot companion, directional actor movement/work frames, axe, water/shore tiles, effects, charging dock, and portal cues. The catalog's `runtimeComplete` flag must remain `false` until those frames exist and the sprite renderer is validated.

## Sources

### Kenney Tiny Farm 1.0

- Author: Kenney
- Source: https://kenney.nl/assets/tiny-farm
- License: CC0 1.0
- Original tile size: 16x16
- License copy: `licenses/kenney-tiny-farm.txt`
- Imported files are semantically renamed copies of official individual tiles. `catalog.json` records the original `tile_NNNN` ID for every file.
- Runtime crop art covers Turnip, Potato, Corn, and Pumpkin. Generic early growth tiles are explicitly marked as reused in the catalog; the mature Pumpkin and item icon are documented project recolors of CC0 `tile_0056`.

### Kenney Tiny Town 1.1

- Author: Kenney
- Source: https://kenney.nl/assets/tiny-town
- License: CC0 1.0
- Original tile size: 16x16
- License copy: `licenses/kenney-tiny-town.txt`
- Imported files are semantically renamed copies of official individual tiles. `catalog.json` records the original `tile_NNNN` ID for every file.

### Kenney Tiny Dungeon 1.0

- Author: Kenney
- Source: https://kenney.nl/assets/tiny-dungeon
- License: CC0 1.0
- Original tile size: 16x16
- License copy: `licenses/kenney-tiny-dungeon.txt`
- Curated frames provide chest states, interior floors/walls/doors, storage props, and portal/arch cues. Combat assets are intentionally excluded.

### Kenney Tiny Battle

- Author: Kenney
- Source: https://kenney.nl/assets/tiny-battle
- License: CC0 1.0
- Original tile size: 16x16
- License copy: `licenses/kenney-tiny-battle.txt`
- Curated frames provide the complete nine-slice grass/water pond family. Unit/combat art is intentionally excluded. Tiny Ski was reviewed and not used because it did not add relevant farm assets.

### Kenney Roguelike/RPG Pack 1.0

- Author: Kenney
- Source: https://kenney.nl/assets/roguelike-rpg-pack
- License: CC0 1.0
- Original tile size: 16x16 with a 1px sheet margin
- License copy: `licenses/kenney-roguelike-rpg-pack.txt`
- Curated frames provide single-tile player/robot beds, a wood floor, and warm masonry walls. Catalog provenance uses exact zero-based sheet row and column coordinates.

Credit is not required by these CC0 packs, but Vibe Farmer credits Kenney to keep provenance visible.

## Policy

- Do not copy files from `assets/sprites/` or `assets/farm assets/`; those local packs are restricted or lack redistribution evidence.
- Do not add an asset without author, source URL, exact license, and source-frame provenance.
- Keep runtime directories curated. Full CC0 source sheets and adjacency-preserving labeled copies belong under `assets/reference/kenney/`, not `assets/game/`.
- Keep source art and final raster files where project-original frames are added.
- Canvas and DOM inventory UI must eventually resolve the same catalog IDs.
