# Vibe Farmer Refinement Plan

## Purpose

Turn the technically complete vertical slice into a legible, cozy farming game without weakening its strongest property: human controls and WebMCP tools operate through the same deterministic headless simulation.

This plan is a corrective pass, not a declaration that the original MVP is done. The first implementation cycle favored protocol and engine behavior over game-facing quality. In particular, original plan items 29 and 30 were missed: the shipped map is not the promised handcrafted farm, and `assets/game/` contains no original sprite set.

## Audit Summary

### Release Blockers

1. **Placeholder visuals:** The renderer draws colored rectangles instead of loading sprite files. Actors have no directional idle/work/sleep frames; items have no icons; trees, crops, chests, terrain, water, beds, and buildings lack authored art.
2. **No authored farm:** The world is a 12x10 grass grid with one chest and four trees. It has no field composition, paths, water, house, beds, market landmark, boundaries, debris, or environmental storytelling.
3. **No game camera:** The canvas scales the entire map to a fixed board. There is no player-following camera, edge clamping, viewport/map separation, zoom, or camera-aware pointer conversion.
4. **No spatial sleep rule:** A menu button sleeps the player from anywhere. Beds do not exist, there is no sleep interaction, and day transition has no fade or summary.
5. **Debug-first interface:** Tick count, speed controls, raw JSON, and operation records are clearer than equipped tools, robot status, valid actions, crop state, and day goals.
6. **No action preview/feedback:** There is no hovered tile, selected destination, path, validity state, stamina preview, work progress, impact animation, particles, or friendly recovery copy.
7. **No in-game onboarding:** A blocking alert lists controls, but the game does not teach the farm loop, robot delegation, sleep, storage, or trade.

### Major Experience Gaps

8. **Robot companion view:** Robot inventory technically exists in Inspector Overview JSON, but there is no friendly inventory grid, portrait, equipped item, stamina, current task/progress, sleep state, or cancel control. Clicking the robot does nothing.
9. **World-object inspection:** Tree health, crop stage, watered state, chest contents/capacity, actor status, terrain type, and available actions are not inspectable by the player.
10. **Storage workflow:** Storage is a pair of text button lists. It opens from a global menu, transfers one unit per click, hides empty slots/capacity, and does not support familiar click/shift-click/whole-stack behavior.
11. **Market workflow:** The shop is a global text panel with one-unit transactions, no icons, owned counts, affordability state, quantity controls, or visible market location.
12. **Hotbar/inventory:** Slots display clipped internal IDs instead of icons. There is no full player inventory view, tooltip, item description, stamina cost, drag/click semantics, or held-tool rendering.
13. **Map transitions:** There is one global map and bare `{x,y}` locations. Buildings/interiors and portal regions require map-qualified locations throughout state, pathfinding, actions, operations, history, inspection, and persistence.
14. **Movement feel:** Each keyboard step is a complete intent; held movement can hit `ACTOR_BUSY`. There is no buffered turn, click-path cancellation/replacement, or visible path feedback.
15. **Animation/audio:** Only movement interpolation exists. Tools, damage, watering, planting, harvest, growth, chest opening, transactions, sleep, and robot state changes have no visual or audio response.
16. **Desktop accessibility:** The desktop-only page intentionally enforces a 760px minimum width. Canvas world information has no keyboard-accessible equivalent; the live region updates with ticks; modal focus behavior and reduced-motion/audio controls are incomplete.

### Architecture and Contract Gaps

17. **World ownership:** The browser composition root builds the farm. Canonical maps and entity placement belong in the headless game.
18. **Single-map assumptions:** Bounds, terrain, occupancy, adjacency, paths, motion, operation targets, events, WebMCP inspection, and saves all assume one map.
19. **Mutable snapshots:** `controller.getSnapshot()` returns the live state object, and browser/WebMCP adapters project directly from it. This is useful but weaker than the planned application boundary.
20. **Immediate WebMCP mutations:** Select, buy, sell, transfer, and sleep execute immediately and ignore `AbortSignal`; only movement and interaction are tick-driven operations. Documentation and submission narration must state this accurately unless these commands become simulated intents.
21. **Sleep asymmetry:** Robot-only multi-day play cannot advance because the player begins each day awake. A refined design needs explicit readiness/autonomy rules rather than relying on the robot starting asleep.
22. **Missing deterministic systems:** The original plan mentions seeded randomness, autonomous handlers, ordinary domain-event dispatch, and actual replan coverage; these are absent or partial.
23. **Missing browser module boundaries:** Planned `input.js` and `ui.js` were folded into a large `main.js`, making interaction growth harder to maintain.
24. **Save handling:** The current save format has no migration path. Multi-map locations, beds, portals, canonical map revisions, and slot-addressed inventory require a versioned migration instead of deleting old saves as corrupt.

### Asset and Licensing Decision

The downloaded packs remain private visual references only.

- Five bundled licenses explicitly prohibit redistribution of raw or modified sprites.
- The remaining packs contain no clear redistribution grant and must be treated as ambiguous.
- None supplies a suitable robot asset.
- Attribution does not override redistribution restrictions.

Use a coherent hybrid of curated CC0 Kenney Tiny Farm/Tiny Town assets and project-original player, robot, water, dock, and effect sprites under `assets/game/`. Do not trace or closely copy restricted reference-pack sprites. Every shipped file must be original project artwork or separately documented under an explicit redistributable license. See [art-direction.md](art-direction.md).

## Target Experience

### World and Camera

- A larger outdoor farm map, initially about 40x30 tiles, contains a farmhouse, pond, field, paths, chest, trees, rocks/debris, market stall or shipping point, fences/boundaries, and deliberate clearings.
- The canvas is a stable tile viewport independent of map dimensions.
- Outdoors, the camera follows the interpolated player position, centers when possible, and clamps at map edges.
- Interiors use fixed-scope framing when the entire room fits; otherwise they use the same clamped camera.
- Pointer targeting converts screen coordinates through camera and integer zoom transforms.
- Only the current map renders, but off-map actors and operations continue authoritatively.

### Maps and Portals

Use one global entity registry with map-qualified spatial placement:

```js
world: {
  definitionVersion: 1,
  maps: {
    farm: { id: "farm", width: 40, height: 30, terrain: [...] },
    farmhouse: { id: "farmhouse", width: 12, height: 9, terrain: [...] }
  },
  entities: {
    player: { type: "actor", mapId: "farm", position: { x: 8, y: 10 }, ... },
    "bed-player": { type: "bed", mapId: "farmhouse", position: { x: 3, y: 3 }, ... },
    "portal-farmhouse-door": {
      type: "portal",
      mapId: "farm",
      region: { x: 7, y: 6, width: 2, height: 1 },
      destination: { mapId: "farmhouse", x: 5, y: 7, facing: "north" }
    }
  }
}
```

- IDs remain globally unique.
- Every spatial entity has `mapId`.
- Commands normalize targets to `{mapId,x,y}`; omitted `mapId` means the actor's current map at submission.
- Portal travel occurs through ordinary movement, never a WebMCP teleport shortcut.
- Entering a portal ends or replans the current route at the map boundary; old-map paths never continue after transition.

### Original Sprite Set

Create authored PNG sprite sheets and a manifest, not renderer-generated shapes.

Minimum art inventory:

- Terrain: grass variants, dirt/path, tilled/wet soil, water center/edges, floor/wall, fence/boundary.
- Environment: tree healthy/damaged states, stump, rock/debris, pond details, farmhouse exterior, market/shipping point.
- Furniture: closed/open chest, player bed, robot charging bed/dock, table/counter, door/portal marker.
- Crops: turnip seed, stages 0-3, watered cue, harvest-ready cue, produce icon.
- Items: axe, hoe, watering can, seeds, turnip, logs, coin.
- Actors: player and robot four-direction idle/walk; work poses for axe/hoe/water/plant/harvest; sleep/charging state.
- Effects: destination marker, invalid target, tool impact, leaf/chip, splash, seed/soil, harvest sparkle.

Technical acceptance:

- Source PNGs live under `assets/game/` with an atlas manifest.
- Base grid is 16x16; larger trees/buildings may span multiple tiles.
- Renderer and DOM inventory UIs use the same manifest IDs.
- Images preload before gameplay or show a deliberate loading state.
- Missing manifest frames fail tests/build, not silently fall back to rectangles.
- `image-rendering: pixelated`; camera and scale remain integer-aligned.

### Human Inspection

Clicking or focusing an entity opens a small reusable Object Inspector window.

- Actor: name/role, portrait, map/location, stamina, sleep/idle/working state, equipped item, current operation/progress.
- Robot: complete robot inventory grid, task, path/progress, cancel action, and link to Advanced Robot Inspector.
- Plant: crop name, growth stage (`2 of 3`), watered today, harvest readiness, expected action.
- Tree: health (`2 of 3`), damage state, expected axe uses, blocking status.
- Chest: used/total slots and Open action when adjacent.
- Bed/dock: owner/type, readiness, Sleep action when eligible.
- Terrain: terrain name, wet/dry state, and contextual valid action.

A pure headless inspection query should provide the shared projection. Browser and a future read-only `inspect_at` WebMCP tool must use the same privacy rules.

### Inventory and Storage

Adopt familiar two-pane game inventory behavior.

- Open a chest by interacting while adjacent; do not open storage globally when no container is in reach.
- Show Player and Chest/Robot as slot grids with icons, quantities, selected/hovered states, capacity, and empty slots.
- Single click selects a stack; click destination moves it; Shift-click transfers the whole stack to the other pane; quantity control supports one/half/all where needed.
- Robot inventory is player-accessible only while adjacent, preserving current permissions.
- Extend transfer commands with `fromSlot`, optional `toSlot`, and quantity while retaining stable `itemId` compatibility for WebMCP.
- All transfers still use the shared action/controller path and emit domain events.

### Market

- Place a visible market stall or shipping point in the world.
- Open trade only through adjacent interaction.
- Use item icons, names, buy/sell prices, owned quantity, stock/eligibility, projected balance, and disabled unaffordable actions.
- Support 1/5/max quantity controls without adding robot-only bulk shortcuts; the human and WebMCP action contract must remain equivalent.

### Sleep and Day Transition

- Add a player bed and robot charging dock, likely inside the farmhouse.
- `sleep_actor` requires the actor to be adjacent to its eligible bed/dock on the same map.
- Human UI and WebMCP receive the same `BED_REQUIRED`/`BED_NOT_ADJACENT` failures.
- The HUD shows each farmhand's readiness.
- When both are ready, play a short fade and display a day summary: money earned/spent, items harvested/sold, crops advanced, and stamina restored.
- Decide robot-only day progression explicitly: either the player can set an auto-sleep readiness policy or robot-only testing uses a declared scenario mode. Do not silently bypass the player bed rule.

### Feedback and Onboarding

- Hover/focus tile outline and contextual action label.
- Valid/invalid target state with friendly recovery text.
- Destination marker and optional short path preview.
- Visible work cooldown/progress for both actors.
- Directional tool animation and entity reaction.
- First-run contextual sequence: move, select hoe, till, plant, water, delegate one robot action, locate bed, end day.
- Advanced protocol/debug controls remain available but move out of the primary farming hierarchy.

## Implementation Order

### Phase R0 - Baseline and Truthful Documentation

Goal: make the repository explicit about what is placeholder and what is complete.

1. Add this refinement plan and a requirement traceability table.
2. Correct README/submission language that presents procedural visuals or universal tick-driven mutations as final.
3. Add screenshot/console QA scaffolding and a tracked visual baseline report.
4. Keep every existing feature working; no schema changes yet.

Acceptance:

- Original plan items are labeled Met, Partial, Missed, Superseded, or Deferred.
- `assets/game/` is explicitly required and no prohibited pack enters Git or Pages.
- Full test suite and deployment build pass.

Checkpoint: one docs/QA commit.

### Phase R1 - Map-Aware Headless Foundation

Goal: remove the single-map architectural ceiling before visual expansion.

1. Move canonical world creation from browser `main.js` into `src/game/world/maps/`.
2. Introduce `world.maps`, `mapId` on spatial entities, map-aware terrain/bounds/entity queries, and normalized locations.
3. Update actions, adjacency, occupancy, pathfinding, intents, operations, history, and inspection projections.
4. Add state v3/save v2 migration from current saves; cancel active operations at migration boundary.
5. Preserve the current small farm visually until the schema is stable.

Acceptance:

- Same-map movement/interactions remain deterministic and parity tests pass for both actors.
- Cross-map adjacency/collision is impossible.
- Old saves retain day, money, inventories, terrain changes, crops, trees, chest contents, and actor positions on `farm`.
- Unknown future save versions are preserved and reported unsupported rather than deleted.

Checkpoints:

1. Map schema/query commit.
2. Actions/intents/tests commit.
3. Persistence migration commit.

### Phase R2 - Camera and Handcrafted Farm

Goal: establish place and spatial scale before UI ornament.

1. Split map dimensions from viewport dimensions.
2. Add pure camera helpers: centered follow, edge clamp, fixed-scope interior mode, `screenToWorld`.
3. Create a 40x30 authored farm layout with field, pond, paths, house footprint, chest, market point, trees, debris, and boundaries.
4. Render only visible tiles/entities and keep movement interpolation camera-correct.
5. Add hover target and destination/path feedback.

Acceptance:

- Player remains centered except near edges.
- Pointer and keyboard target the same tile at every camera position and integer zoom.
- No map-edge void appears.
- First viewport communicates home, field, storage, water, and a route to work.
- Camera helper tests and desktop screenshot checks pass.

Checkpoints:

1. Camera math/input conversion commit.
2. Canonical farm content commit.
3. Target/path feedback commit.

### Phase R3 - Original Art Pipeline and Sprite Replacement

Goal: remove every procedural placeholder from the released game.

1. Define palette, silhouettes, atlas layout, frame IDs, and asset license metadata.
2. Create original terrain/environment/furniture/item/effect sheets.
3. Create original player and robot directional/action sheets.
4. Add preload/manifest/catalog modules and build-time completeness tests.
5. Replace renderer shapes and DOM text-only item displays with sprite frames.
6. Add visual damage/growth/chest/watered states.

Acceptance:

- Every terrain/entity/item in default state has a frame.
- Both actors and all interactables are identifiable without text.
- Hotbar, inventory, storage, market, Object Inspector, and world use one icon catalog.
- No prohibited reference sprite is copied or shipped.
- Canvas pixel checks are nonblank and screenshots show no missing frames.

Checkpoints:

1. Palette/manifest/license commit.
2. Terrain/environment sheet commit.
3. Item/UI icon sheet commit.
4. Actor/effect sheet commit.
5. Sprite renderer integration commit.

### Phase R4 - Portals, Farmhouse, Beds, and Day Summary

Goal: make place transitions and sleep part of the world.

1. Add portal entities/regions and deterministic transition rules.
2. Create farmhouse interior map and paired exterior/interior door portals.
3. Add player bed and robot charging dock entities.
4. Require adjacency and eligibility for sleep for both actors.
5. Add fade transition and day summary UI.
6. Surface map IDs and transition events in Inspector/Action Log/WebMCP results.

Acceptance:

- Walking into a door transitions maps exactly once and never continues an old-map route.
- Camera uses fixed-scope framing in the interior.
- Neither actor can sleep remotely.
- Day advances only when both valid beds/docks are ready.
- Human and WebMCP receive identical sleep validation codes.
- Save/reload on either map and during interrupted work is safe.

Checkpoints:

1. Portal core/tests commit.
2. Farmhouse/map content commit.
3. Bed rule/parity commit.
4. Day transition UI commit.

### Phase R5 - Shared Object and Robot Inspection

Goal: make game state legible without opening raw protocol JSON.

1. Add a privacy-aware pure inspection query in the core.
2. Add reusable Object Inspector window and click/focus targeting.
3. Add friendly views for terrain, plants, trees, chests, beds, player, and robot.
4. Add robot inventory grid, equipped item, stamina, task/progress, and cancel action.
5. Keep raw Robot Inspector as an Advanced protocol view.
6. Add read-only `inspect_at` WebMCP only if it preserves equal human-visible information.

Acceptance:

- Tree HP and crop growth/water state are visible to humans.
- Robot inventory and current task are visible without reading JSON.
- Human inspection and WebMCP projection share privacy tests.
- Clicking empty terrain is useful and clicking an entity never starts an unintended action.

Checkpoints:

1. Core inspection query commit.
2. Object Inspector window commit.
3. Robot companion panel commit.
4. Optional `inspect_at` parity commit.

### Phase R6 - Inventory, Storage, Hotbar, and Market Redesign

Goal: replace programmer-facing transactions with familiar game interactions.

1. Build reusable icon slot-grid and item tooltip components.
2. Upgrade hotbar and add full player inventory view.
3. Add slot-addressed transfer semantics and migration-compatible command handling.
4. Replace storage text buttons with two-pane chest/robot inventory.
5. Replace market text buttons with icon rows/grid, quantities, owned counts, affordability, and projected balance.
6. Open chest/robot/market through world interaction and proximity.

Acceptance:

- Whole stack and one-unit transfers are possible without repeated text-button scanning.
- Empty slots, capacity, item quantities, and selection are visible.
- Keyboard and pointer workflows are complete.
- Robot permissions and player privacy remain unchanged.
- Human and WebMCP transfers share the same action and tests.

Checkpoints:

1. Slot-grid/icon tooltip commit.
2. Transfer action/schema commit.
3. Storage UI commit.
4. Market UI commit.

### Phase R7 - Movement Feel, Animation, Audio, and Onboarding

Goal: make the refined systems pleasant and understandable.

1. Add held-key movement with one buffered turn and click-path replacement/cancel.
2. Add directional idle/walk/work/sleep animation state derived from simulation.
3. Add tool/entity effects, particles, progress indicators, and friendly status copy.
4. Add restrained original/cleared sounds, mute, volume, and reduced-motion support.
5. Add first-run contextual onboarding and persistent help journal.
6. Rebalance map travel, stamina, cooldowns, prices, and crop timing against the larger world.

Acceptance:

- Held movement never exposes `ACTOR_BUSY`.
- Every tool action has anticipation, contact, and result feedback.
- All failure codes shown to players have friendly recovery text.
- A new player can complete day one without README help.
- Mute/reduced-motion settings persist.

Checkpoints:

1. Movement buffering/cancel commit.
2. Animation/effects commit.
3. Audio/settings commit.
4. Onboarding/copy commit.
5. Balance pass commit.

### Phase R8 - Release QA and Submission Refresh

Goal: verify the game as a product, not only as a headless system.

1. Add browser automation at the 1280x900 desktop baseline for console errors, missing assets, focus, overlap, and canvas nonblank checks.
2. Add screenshot baselines for farm center/edge, farmhouse, storage, market, Object Inspector, Robot Inspector, Action Log, sleep summary, and pause/cancel states.
3. Test human-only, robot-assisted, and mixed loops across maps.
4. Verify WebMCP discovery and invocation in enabled Chrome and ChatGPT's in-app browser.
5. Rewrite submission copy/video around the refined experience and record the final under-three-minute take.

Acceptance:

- Full deterministic suite, browser suite, build, and public HTTPS smoke test pass.
- No missing/forbidden assets or console errors.
- The 1280x900 desktop baseline has no incoherent overlap or page-level horizontal scroll.
- Public asset SHA matches the release commit.
- Submission claims match observable behavior.

Checkpoints:

1. Browser QA harness commit.
2. Visual/layout fixes commit(s).
3. Submission refresh commit.
4. Release tag only after public verification.

## Overnight Execution Sequence

Work in this order and push after every validated checkpoint:

1. **Audit/truth pass:** land this plan, traceability, and documentation corrections.
2. **R1 map schema:** introduce map-aware state and tests without changing visuals.
3. **R1 migration:** preserve current saves and publish a rollback point.
4. **R2 camera helpers:** pure math, pointer conversion, and tests.
5. **R2 farm definition:** move world construction into the core and author the larger map.
6. **R3 asset foundation:** palette, manifest, licensing metadata, and the first original terrain/item sheets.
7. **R3 renderer slice:** render the farm, chest, trees, crops, player, and robot from files.
8. **R5 early companion slice:** if time remains, add the friendly robot inventory/status panel because it has high user value and does not require portals.

Do not start portals, beds, or inventory transfer schema changes until map-aware state and save migration are pushed and green. Do not redesign every window before the shared icon/slot component exists. Do not publish generated `_site` files or any local reference-pack asset.

## Validation at Every Checkpoint

- Run the narrowest affected tests immediately after the first edit.
- Run `npm test`, `npm run build:site`, diagnostics, and `git diff --check` before commit.
- For renderer/UI changes, start the local site and verify with Chromium at 1280x900 or larger.
- For Canvas changes, capture screenshots and inspect canvas pixels for nonblank output and missing assets.
- For schema changes, test migration from a serialized current-version fixture and preserve unknown future saves.
- Commit and push one isolated, validated concern at a time with no unrelated formatting churn.

## Decisions Needed Later

These do not block R0-R3 and should not interrupt work prematurely:

1. Whether the market is a staffed stall, shipping bin, or both.
2. Whether robot-only play gets an explicit player auto-readiness mode for day transition.
3. Whether `inspect_at` becomes a tenth WebMCP tool or `inspect_game` gains a location filter.
4. Mobile support remains deferred until browser WebMCP implementations make it a meaningful target.
5. Final art direction after the first original sprite-sheet screenshot: brighter storybook farm, muted working farm, or another coherent palette.

## Definition of Refined Release

The refinement release is ready when the first five minutes feel like a farm game rather than an engine demo: the player recognizes the place and objects from authored sprites, moves through a larger camera-followed farm, opens a chest through world interaction, understands item slots from icons, inspects crops/trees/robot without JSON, enters the farmhouse, sleeps only at a bed, sees a day transition, and can delegate the same visible work to the robot through WebMCP with no capability shortcut.
