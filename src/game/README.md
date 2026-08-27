# Headless Game

This folder contains Vibe Farmer's deterministic gameplay domain. It can run in Node without a DOM, Canvas, WebMCP, timers, or browser storage.

## Domain Map

- `state.js` creates the serializable game state.
- `farm.js` owns the canonical handcrafted world content used by browser and headless callers.
- `config.js` contains shared rules and balance values.
- `actions/` contains verbs that validate and apply atomic state changes.
- `world/` owns terrain, a normalized entity registry, placement, spatial queries, and pathfinding.
- `world/inspection.js` projects privacy-aware terrain and entity details for human and protocol adapters.
- `world/entities/actors/` contains behavior shared by human, robot, and future autonomous actors.
- `index.js` exposes the intentionally small public headless API.

Terrain is dense state at every coordinate. Entities are sparse or contained game things owned by the world. Actions coordinate those nouns; gameplay rules do not live in UI controls or protocol adapters.

Each actor may own one serializable intent. `simulation.js` advances those intents through deterministic ticks; browser timing and completion Promises live outside this folder.