# Art Direction and Asset Sourcing

## Decision

Use a **hybrid CC0 + original** art pipeline for the first refinement screenshot:

- Kenney Tiny Farm provides the coherent 16x16 farming/environment/item base.
- Kenney Tiny Town provides matching 16x16 water, fences, building exteriors, doors, signs, and map-composition tiles.
- Kenney Roguelike/RPG Pack provides single-tile beds and a warmer domestic floor/wall family for the farmhouse interior.
- Vibe Farmer extends the Kenney farmhand silhouette into a directional human/android identity layer: identical proportions and action vocabulary, gray/teal synthetic recolor, tool-use poses, charging dock, portal cues, and interaction effects.
- 0x72's CC0 Robot Tileset may be evaluated as a robot reference/base, but its 16x32 industrial characters must be palette-tested against Kenney before inclusion.
- The currently downloaded packs under `assets/sprites/` remain private references and are never copied, traced, or shipped.

This decision is provisional until an in-game screenshot compares the hybrid composition with a fully original SVG/PNG prototype. The game should not lock into an asset source based on a contact sheet alone.

## Verified Sources

### Kenney Tiny Farm

- Source: https://kenney.nl/assets/tiny-farm
- Official archive: `kenney_tiny-farm.zip`
- Author: Kenney
- Version: 1.0
- Released: 2026-07-01
- Native tile size: 16x16
- Files: 130+ individual tiles plus tilemaps, preview, and sample
- License: Creative Commons Zero (CC0 1.0)
- Attribution: not required; credit will still be included
- Redistribution/modification: permitted under CC0
- Useful coverage: soil states, crop stages, seed packets, produce, paths, trees, rocks, chest, crates, tools, watering can, player/farmer sprites, market/farm props, animals

### Kenney Roguelike/RPG Pack

- Source: https://kenney.nl/assets/roguelike-rpg-pack
- Native tile size: 16x16 with a 1px sheet margin
- License: Creative Commons Zero (CC0 1.0)
- Useful coverage: single-tile beds, wood floors, warm masonry walls, furniture, doors, windows, and broad terrain/building families
- Current runtime frames: cream bed `r3c17`, orange bed `r3c15`, wood floor `r3c8`, warm masonry wall `r3c5`

### Kenney RPG Urban Pack

- Source: https://kenney.nl/assets/rpg-urban-pack
- Native tile size: 16x16
- License: Creative Commons Zero (CC0 1.0)
- Useful coverage: four-direction animated character columns and modern environment props
- Decision: retained as a labeled reference candidate; do not replace the current human/android pair until parity silhouettes, animation contracts, and palette cohesion are compared in-game

### Kenney Tiny Town

- Source: https://kenney.nl/assets/tiny-town
- Official archive: `kenney_tiny-town.zip`
- Author: Kenney
- Version: 1.1
- Released: 2023-01-11
- Native tile size: 16x16
- Files: 130+ individual tiles plus tilemaps, preview, and sample
- License: Creative Commons Zero (CC0 1.0)
- Attribution: not required; credit will still be included
- Redistribution/modification: permitted under CC0
- Useful coverage: water/shore, terrain transitions, fences, roofs, walls, doors, signs, trees, mushrooms, building and town composition

### 0x72 16x16+ Robot Tileset

- Source: https://0x72.itch.io/16x16-robot-tileset
- Author: Robert / 0x72
- Native grid: 16x16; robot characters are 16x32
- License statement: "You can use this tileset for whatever you like (CC-0)."
- Attribution: not required; credit will be included if used
- Redistribution/modification: permitted under CC0
- Useful coverage: nine robot characters and industrial effects/props
- Risk: industrial palette and 16x32 silhouette may not feel like a cozy farm companion

### Pixeldex

- Source: https://pixeldex.dev/sprites/
- License: CC0/public domain for published sprites and generator output
- Formats: SVG and PNG
- Useful coverage: original mascot/robot concepts and seed-based generation
- Risk: individual mascot style may not match the selected farm base; generated output still requires art-direction and animation consistency review

## Rejected or Reference-Only Sources

The local packs are not candidates for public runtime use unless explicit written redistribution permission is obtained:

- Cute Fantasy Free: prohibits redistribution and is non-commercial only.
- Farm RPG Tiny Asset Pack: prohibits redistribution, including modified files.
- Little Dreamyland Free: prohibits sharing the pack and modified versions.
- Shining Fields Free: prohibits redistribution and is non-commercial only.
- Snoblin Prototype Characters: prohibits redistribution, including modified files.
- TopDown 16x16, Farm RPG FREE, Animal Farm, Farm Assets, Tiny Village, and standalone sheets: no bundled grant establishing public redistribution rights.

## Curated Tiny Farm Candidate Frames

These IDs come from the official individual `Tiles/` directory and are candidates, not a final manifest:

| Game concept | Tiny Farm source candidates |
| --- | --- |
| Dry/wet soil | `tile_0000`, `tile_0001`, `tile_0036`, `tile_0037` |
| Path segments | `tile_0105` through `tile_0119` |
| Complete tree variants | `tile_0027`, `tile_0028` (`tile_0015` is a lower tree half) |
| Rock/debris | `tile_0077`, `tile_0089` |
| Crop stages | `tile_0052`, `tile_0053`, `tile_0054`, `tile_0056` |
| Root produce | `tile_0055` |
| Seed packet | `tile_0058` (`tile_0057` is the larger sack) |
| Watering can | `tile_0084` (`tile_0085` is the barrel) |
| Hoe/shovel/sickle | `tile_0086`, `tile_0087`, `tile_0088` |
| Chest | `tile_0076` |
| Player/farmer concepts | `tile_0108`, `tile_0109` |
| Water/feed trough variants | `tile_0110` through `tile_0113` (not beds) |
| Market/produce crate | `tile_0035`, `tile_0047`, `tile_0059` |
| Logs/trunk | `tile_0014`, `tile_0026`, `tile_0038` |

## Custom/Generated Requirements

The following should be project-original or generated specifically for Vibe Farmer:

1. Android farmhand with four-direction idle/walk, work pose, sleep/charging state, and readable selected-tool silhouette. Preserve the human farmhand's proportions to communicate gameplay parity.
2. Player four-direction idle/walk and work poses matching the android frame contract.
3. Axe icon if no selected CC0 source matches the palette.
4. Robot charging dock/bed that communicates sleep parity without looking like a human bed recolor.
5. Destination, invalid-target, impact, watering splash, planting, harvest, portal, and task-progress effects.
6. Portraits for the Robot Inspector/Object Inspector if portraits remain in the refined UI.

## Image Generator Access

RetroDiffusion is available through MCP. Generated output is preserved with prompts, seeds, responses, costs, and decisions under `assets/game/experiments/retrodiffusion/`; it remains source material until cleaned and cataloged.

A useful image-generation workflow would be:

1. Use the accepted Kenney farmer-derived android as the base silhouette.
2. Generate only missing directional/action contracts or targeted identity details, using cost estimates and the model-selection ladder in `asset-production-backlog.md`.
3. Redraw/clean outputs onto the exact pixel grid and preserve human/android frame alignment.
4. Record tool/model/date/prompt and confirm the generated-output license permits redistribution and modification.
5. Keep final edited source and PNG frames under `assets/game/original/` with project licensing metadata.

If an image generator becomes available, the first request should be a **concept sheet**, not a complete unreviewed sprite atlas.

## Comparison Gate

Before the art direction becomes final, produce three screenshots of the same small farm composition:

1. Current procedural placeholders (baseline).
2. Kenney Tiny Farm/Tiny Town + original/custom robot/player/effects.
3. Fully original SVG/PNG prototype if it reaches comparable coverage.

Evaluate each at 1x pixels and the game's integer display scale for:

- Immediate recognition of player, robot, tree, chest, crops, tools, water, bed, and market.
- Palette cohesion and contrast against 98.css windows.
- Direction/facing readability.
- Crop-stage and tree-damage readability without text.
- UI icon legibility at hotbar size.
- Distinctive Vibe Farmer identity rather than a generic asset-demo appearance.
- Animation feasibility and frame-count cost.

Choose the hybrid path unless the fully original prototype is visibly stronger and can reach complete coverage without delaying core map/camera work.

## Repository Layout

Proposed checked-in structure:

```text
assets/game/
  README.md
  licenses/
    kenney-tiny-farm.txt
    kenney-tiny-town.txt
    0x72-robot.txt            # only if used
    generated-art-log.md      # only if generated art is used
  kenney/
    tiny-farm/                # curated, semantically renamed PNGs
    tiny-town/                # curated, semantically renamed PNGs
  original/
    actors.png
    effects.png
    robot-dock.png
    source/                   # SVG/Aseprite-compatible source where available
  manifest.json
```

Do not check full archives into runtime directories when only a curated subset is used. Preserve official CC0 source sheets and adjacency-preserving labeled copies under `assets/reference/kenney/`; every runtime import must still map back to an exact source tile ID or row/column coordinate in `assets/game/catalog.json`.

## Acceptance

- Every runtime asset has a source, author, exact license, and source tile/frame mapping.
- Build tests fail for missing manifest files or accidental files from prohibited directories.
- The browser preloads the manifest and reports load failures before play.
- One icon catalog drives Canvas, hotbar, inventory, storage, market, and inspectors.
- No procedural rectangle remains as the normal fallback for a required entity/item after sprite integration.
