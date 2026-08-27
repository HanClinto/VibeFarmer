# Runtime Art

This directory contains only artwork cleared for redistribution in Vibe Farmer's public source repository.

## Current Status

The checked-in files are the first curated CC0 art base. They are not yet runtime-complete and are not wired into the renderer. See `catalog.json` and `docs/plans/art-direction.md`.

Missing production frames include the robot companion, directional actor movement/work frames, axe, water/shore tiles, effects, charging dock, and portal cues. The catalog's `runtimeComplete` flag must remain `false` until those frames exist and the sprite renderer is validated.

## Sources

### Kenney Tiny Farm 1.0

- Author: Kenney
- Source: https://kenney.nl/assets/tiny-farm
- License: CC0 1.0
- Original tile size: 16x16
- License copy: `licenses/kenney-tiny-farm.txt`
- Imported files are semantically renamed copies of official individual tiles. `catalog.json` records the original `tile_NNNN` ID for every file.

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

Credit is not required by these CC0 packs, but Vibe Farmer credits Kenney to keep provenance visible.

## Policy

- Do not copy files from `assets/sprites/` or `assets/farm assets/`; those local packs are restricted or lack redistribution evidence.
- Do not add an asset without author, source URL, exact license, and source-frame provenance.
- Prefer a curated semantic subset over checking in full source archives.
- Keep source art and final raster files where project-original frames are added.
- Canvas and DOM inventory UI must eventually resolve the same catalog IDs.
