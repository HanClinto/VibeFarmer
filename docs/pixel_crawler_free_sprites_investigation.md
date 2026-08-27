# Pixel Crawler Free Sprite Investigation

Investigation date: 2026-08-27

## Decision

Continue shipping and refining the current Kenney-based presentation. Treat Pixel Crawler as a possible future visual theme, not a replacement currently in progress.

The pack is a strong artistic and mechanical fit, especially for directional actor animation and richer environments. Vibe Farmer's deterministic game core, WebMCP tools, saves, pathfinding, and ASCII Agent View can remain independent of a future theme. The renderer and map presentation need meaningful abstraction before this pack can be used coherently.

Do not commit the downloaded pack or derived runtime assets until redistribution in a public source repository is explicitly approved by the author.

## Source

- Pack: [Free Pixel Art Asset Pack - Topdown Tileset - RPG 16x16 Sprites](https://anokolisa.itch.io/free-pixel-art-asset-pack-topdown-tileset-rpg-16x16-sprites)
- Series: Pixel Crawler
- Author: Anokolisa
- Download examined: `Pixel Crawler - Free Pack 2.11`
- Local reference path: `assets/sprites/Pixel Crawler - Free Pack/`
- Local size: approximately 3.7 MB
- Local files: 372 total
  - 181 PNG exports
  - 190 Aseprite source files
  - 1 terms file

The local reference directory is covered by the repository's existing ignored `assets/sprites/` path and must remain untracked.

## License Findings

The pack includes `Terms.txt`. The itch page also links a two-page terms PDF. Both identify Anokolisa as the author and permit project use and modification. The bundled terms state that:

- Attribution is not required, although appreciated.
- The art may be altered in shape, color, or pattern.
- The assets may be used in commercial products, study, or other functional projects.
- The assets, including altered versions, may not be sold or marketed as an asset product without authorization.

The linked PDF additionally says that users may create projects with the assets without restriction and describes commercial project use in more detail.

Neither document clearly grants redistribution of the original sprite sheets or Aseprite sources in a public source repository. Vibe Farmer's challenge submission requires all runtime assets to be available in its public repository, so ordinary permission to use the art in a game is not enough evidence for this deployment model.

Before promoting any Pixel Crawler art into tracked runtime assets, ask `AnomalyPixel@gmail.com` for written permission to:

1. Include selected exported PNG frames in Vibe Farmer's public GitHub repository.
2. Deploy those PNGs as part of the public browser game.
3. Modify character art into a robot farmhand.
4. Keep Pixel Crawler art under Anokolisa's terms and explicitly outside Vibe Farmer's MIT code license.
5. Clarify whether original `.aseprite` files may be redistributed or must remain local authoring inputs.

If permission covers only final game use and not public source distribution, the pack is not suitable for the challenge build unless the public repository can legally contain all required derived runtime files.

## Pack Coverage

The archive is organized into:

- `Entities/`: base characters, NPCs, skeletons, orcs, and animation sources.
- `Environment/`: terrain, water, structures, interiors, furniture, farming props, trees, rocks, stations, and other scenery.
- `Icons/`: Aseprite icon source; no general icon PNG was included in the examined directory.
- `Weapons/`: wood, bone, and hand equipment sheets.
- `MockUps/`: a 1280x1280 tavern composition demonstrating intended layering and density.

The pack contains relevant visual material for water, modular buildings, interiors, doors, trees, rocks, tools, furniture, and farming props. It does not provide an obvious one-to-one set of exported PNGs for every current Vibe Farmer crop stage, seed packet, produce icon, hotbar icon, robot state, market display, bed, and storage state. A curated theme would need a coverage matrix and likely some original or modified art.

## The Meaning of 16x16

The pack uses a 16x16 logical placement grid, but many visual frames are deliberately larger. A logical cell, an animation frame, a visible opaque bound, and a collision footprint are different concepts.

### Base Character Measurements

The base character exports use 64x64 frame cells:

| Animation family | Frames | Sheet size | Typical opaque body bounds |
| --- | ---: | ---: | ---: |
| Idle | 4 | 256x64 | about 16x28-30 |
| Walk | 6 | 384x64 | about 13-16x28-30 |
| Run | 6 | 384x64 | similar 64x64 cells |
| Carry idle | 4 | 256x64 | 64x64 cells |
| Carry walk/run | 6 | 384x64 | 64x64 cells |
| Water, collect, crush, slice, pierce, fish | 8 | 512x64 | action-dependent |

Measured watering-side frames reached approximately 25x31 opaque pixels. The character remains positioned inside a stable 64x64 action envelope so tools, carried items, and motion can extend around the same foot position.

Animation exports exist for Up, Down, and Side. A four-direction runtime should mirror Side frames horizontally for left versus right.

The likely actor anchor is near the lower center of the 64x64 cell, approximately `(32, 48)`, but this must be confirmed against Aseprite source or a controlled rendering spike before becoming a catalog contract.

### Trees and Large Props

Tree PNGs range from 128x96 to 448x368, with one source collection reaching 384x512. These files are collections or sheets of related tree sprites, not necessarily one enormous tree per PNG.

Representative small trees appear to occupy roughly 32x48 pixels each, or about two logical columns by three logical rows. Larger variants are suitable for landmarks and forest canopies. Even modest trees therefore need a small trunk collision footprint, a much larger draw bound, a lower-center anchor, and canopy-aware depth ordering.

### Environment Atlases

Common environment canvases are 400x400. Measured examples include:

- Farm props: 400x400
- Roofs: 400x400
- Building props: 400x400
- Water tiles: 400x400
- Wall tiles: 400x400
- Building walls: 672x800
- Interior walls: 656x400
- Interior props: 608x384

These are working atlases with mixed and sometimes irregular compositions. They should not all be treated as uniform 16x16 runtime tilesheets. Curated source rectangles or exported image-collection tiles are needed.

## Required Presentation Model

A future catalog must distinguish at least these properties:

```js
{
  source: "pixel-crawler/environment.png",
  sourceRect: { x: 0, y: 0, width: 32, height: 48 },
  anchor: { x: 16, y: 48 },
  footprint: [
    { x: 0, y: 0 },
  ],
  layer: "entity",
  sortOffset: 0,
  mirrorX: false,
}
```

- **Logical position:** The authoritative game cell used by pathfinding, interaction, WebMCP, and saves.
- **Footprint:** Cells blocked or occupied for gameplay.
- **Source rectangle:** Pixels selected from an atlas.
- **Draw bounds:** The visual area covered around the logical position.
- **Anchor:** The source pixel aligned to the logical position.
- **Sort point:** The world-space depth point, usually feet or trunk base.
- **Layer:** Ground, decal, Y-sorted entity, overhead canopy/roof, or foreground/effect.
- **Animation:** Ordered frames, duration, direction, looping, mirroring, and action state.

An actor may occupy one logical cell while drawing a 64x64 frame. A tree may block one or two trunk cells while its canopy extends across many visible cells. A building may use a broad collision footprint and separate roof overlay.

## Current Vibe Farmer Coupling

The current architecture already provides useful separation:

- The game core is browser-free and deterministic.
- WebMCP and ASCII inspection use semantic terrain and entities, not pixels.
- The runtime catalog uses semantic IDs such as `terrain.grass`, `actor.robot.south`, and `crop.turnip.3`.
- World drawing is centralized in `src/adapters/browser/renderer.js`.
- Both the main camera and Robot Inspector camera use the shared renderer.

The main presentation coupling that must be removed is:

1. `src/game/farm.js` stores theme-specific `spriteId` values on domain entities.
2. The catalog loader expects one complete image per semantic frame, not source rectangles within atlases.
3. Actor rendering currently resolves one static south-facing frame.
4. Drawing assumes a frame is square and occupies one rendered tile.
5. Scene order is terrain, objects, actors, feedback; there is no Y-sort or overhead layer.
6. Collision is mostly one entity position plus a blocking flag, not an explicit multi-cell footprint.
7. The authored farm is assembled directly in JavaScript from theme-specific tile pieces.

The save/state schema should not need to change merely to select a visual theme. A map migration may be needed if richer prefabs introduce different collision footprints or portal positions.

## Recommended Theme Architecture

Do not maintain two copied browser frontends. Prefer one renderer with replaceable theme data:

```text
Deterministic game state
        |
Semantic presentation projection
        |
  +-----+-------------------+
  |                         |
Kenney theme       Pixel Crawler theme
simple frames      atlases, anchors,
current maps       animations, prefabs
```

Keep the current Kenney catalog and add a separate theme definition selected by a browser setting or query parameter, for example `?theme=kenney` and `?theme=pixel-crawler`. The default must remain Kenney until the alternate theme is complete and licensed.

The ASCII Agent View must remain theme-independent. It represents gameplay semantics available through `inspect_game`, while Camera View represents the chosen visual presentation.

## Renderer Work

The shared renderer needs these capabilities before a serious conversion:

1. Atlas source rectangles in catalog entries.
2. Arbitrary destination size and anchor offsets.
3. Directional animation selection from actor facing.
4. Idle/walk selection from actor motion.
5. Work animation selection from active operation and held item.
6. Horizontal mirroring for side animations.
7. Stable animation timing derived from simulation/render time.
8. Y-sorting by feet or configured sort point.
9. Separate below-actor, entity, overhead, and foreground layers.
10. Camera culling based on draw bounds rather than only logical positions.
11. Optional explicit multi-cell footprints for large objects.

## Map Authoring and Tiled

Use Tiled for the first production map pipeline instead of building a custom editor.

Recommended Tiled organization:

- Repeatable 16x16 tile layers for base terrain.
- Detail/decal layers for nonblocking ground variation.
- Image-collection tilesets for oversized trees, furniture, stations, and prefab pieces.
- Y-sorted object layers for actors and world objects.
- Roof/canopy and foreground layers above actors.
- Object layers for collision footprints, portals, beds, markets, chests, crop areas, and interaction cells.
- Custom properties such as `entityType`, `prefabId`, `blocking`, `destinationMap`, `destinationX`, `destinationY`, and `actorId`.

A Node conversion script should validate exported Tiled JSON and generate deterministic game-map/presentation data. Runtime code should not parse arbitrary editor data without validation.

Use semantic prefabs such as `farmhouse.exterior`, `farmhouse.interior`, `market.stall`, and `tree.common` instead of embedding a theme's roof and wall frame IDs in domain entities. Each theme may compose the same semantic prefab differently.

## Asset Pipeline

The pack is Aseprite-first, but an Aseprite CLI was not available during this investigation. Keep the original pack as ignored local source and promote only curated exports.

Potential pipeline:

1. Select only assets required by a small theme coverage matrix.
2. Use Aseprite exports or source rectangles to produce stable runtime PNGs.
3. Record exact source file, source rectangle/slice, author, terms, and modifications.
4. Define semantic frames, animations, anchors, footprints, and layers in a separate catalog.
5. Generate Tiled tilesets or image collections from curated definitions.
6. Validate all referenced files and rectangles in tests.
7. Exclude unneeded original sheets and Aseprite sources from production output unless redistribution permission explicitly covers them.

## Robot Art

The pack does not contain a Vibe Farmer robot. A coherent alternate theme needs a four-direction robot with idle, walk, and core work animations.

The terms permit color and shape modification, so a robot could be derived from the base-character animation layout if public-source redistribution permission is obtained. This remains a significant art task because the robot must preserve frame alignment across every selected direction and action.

At minimum, the robot needs:

- Idle: up, down, side/mirrored side
- Walk: up, down, side/mirrored side
- Watering
- Hoe/soil work
- Axe/chop work
- Collect/harvest
- Sleep/charging presentation or a documented idle substitute

## Reversible Spike

The first experiment should be an alternate theme, not a replacement. It should include only:

- One small outdoor scene
- Grass, path, water, and one modest tree type
- A small farmhouse or market prefab
- Four-direction player idle/walk animation
- A provisional robot treatment
- One tilled/watered crop lifecycle
- Theme selection that leaves Kenney as the default
- Camera and Agent View comparison from identical game state

Success criteria:

1. Logical movement and WebMCP results are identical under both themes.
2. Oversized frames do not change collision or interaction behavior.
3. Actors sort correctly in front of and behind trees/buildings.
4. Camera culling does not clip large draw bounds.
5. The main and Robot Inspector cameras render the same theme correctly.
6. The new presentation materially improves clarity and desire to explore.
7. The alternate theme can be removed without touching the deterministic game core.

## Estimated Lift

Based on the examined files:

- One-scene player-only visual spike: 1-2 focused days.
- Atlas, anchor, mirroring, animation, and Y-sort renderer support: 2-4 days.
- Tiled import, collision, and prefab model: 3-5 days.
- Farm and farmhouse visual reconstruction: 3-6 days.
- Animated robot adaptation and complete farming/UI coverage: 3-6 days.
- Theme switching, regression coverage, and browser QA: 1-3 days.

A polished complete theme is approximately 2-4 weeks, depending on license approval, crop/icon coverage, and robot-art effort. This estimate is for presentation work; it does not include new gameplay systems.

## Open Questions

1. Will Anokolisa explicitly permit selected derived PNGs in a public source repository?
2. May original Aseprite sources be redistributed, or only final curated exports?
3. Which crop stages and inventory icons can be sourced coherently from this pack?
4. Should large tree canopies become translucent when obscuring an actor?
5. Should richer building footprints preserve current map geometry or create a separate map definition?
6. Can Tiled animation/slice metadata replace hand-authored catalog rectangles reliably?
7. What minimum action set makes the player and robot feel visually equal?

## Current Next Step

Keep the current Kenney presentation as the production design. Continue ordinary gameplay, WebMCP, documentation, and submission work without depending on Pixel Crawler.

Revisit this investigation only after explicit redistribution permission is obtained or when a local, untracked one-scene spike is intentionally scheduled.