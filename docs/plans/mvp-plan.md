# Vibe Farmer Challenge Vertical Slice

Build a submission-ready, no-build browser game centered on equal human and robot farmhands. The first release delivers a complete 3-4 in-game-day loop: clear, till, plant, water, sleep, harvest, buy, and sell. WebMCP exposes the robot to both small-step prompting and longer autonomous plans. Keyboard play, mouse play, WebMCP calls, inspector-driven calls, persistence, and logging all use the same game engine.

## Design Review

### Strengths

- The robot farmhand is a memorable, legible use of WebMCP: human and agent share one visible world and can divide work at any granularity.
- The Robot Inspector supports WebMCP's human-in-the-loop goals through visibility, history, control, and protocol education.
- A fixed farm and short crop cycle can demonstrate cooperation within a sub-3-minute submission video while retaining open-ended play.

### Required Revisions

- Replace broad "everything the player can do" language with one enumerated MVP action contract. Parity applies to gameplay capabilities, preconditions, costs, range, and effects rather than literal input gestures.
- A human may select slot `1`-`0` and press Space/E while an agent invokes the equivalent adjacent `use_item` action by slot or stable item ID.
- Both actors share a smart `interact_at` intent. Player Shift-click or one robot call may path to a reachable adjacent tile and then dispatch exactly one ordinary `use_item`.
- Semantic agent arguments and a navigation prelude are allowed, but neither interface receives bulk shortcuts such as `plant_all` unless an equivalent player command exists.
- Treat the game, co-op actor model, WebMCP layer, and inspector as one vertical slice. Defer world generation, JSON save files, customization, upgrades, animals, crafting, cooking, buildings, furniture, emotes, and additional maps.
- Make the first harvest and economy loop the definition of done.
- Do not publish the downloaded third-party sprite packs. Their licenses prohibit redistribution, conflicting with the challenge's public runnable-source requirement. Ship a small original sprite set with explicit licensing.
- Treat the live deployment, public repository, description, and narrated video under three minutes as release requirements.

## Phase 1: Foundation

1. Revise `README.md` into the product specification: pitch, audience, collaboration model, MVP loop, controls, WebMCP behavior, inspector, exclusions, run/deployment instructions, asset policy, and submission checklist.
2. Add an open-source `LICENSE` and `THIRD_PARTY_NOTICES.md`. Ensure prohibited source packs do not enter the public submission repository.
3. Establish a static ES-module application with `index.html`, `styles/`, `src/`, `test/`, and `assets/game/`. Use Canvas 2D for the pixel world and DOM/98.css for windows, with no transpilation or production build.
4. Define tunable rules in `src/config.js`: map dimensions, 16px tiles, 10 inventory slots mapped to `1`-`0`, stack limits, chest capacity, starting supplies and shared money, stamina, crop stages, tree durability, prices, and maximum robot batch length. Use a three-watered-night crop cycle. Missed watering pauses growth and crops do not die in the MVP.

## Phase 2: Shared Deterministic Core

5. Implement `src/state.js` as the serializable source of truth: day, shared money, map tiles, objects, crops, chests, actor positions, facing, stamina, sleep readiness, separate 10-slot inventories, selected items, robot work, and bounded history. The robot begins each day asleep/ready; its first action wakes it. The day advances only when both actors sleep.
6. Implement `src/actions.js` as the only mutation boundary. Validate atomic movement steps, selection, one adjacent item use, farm work, economy, storage, sleep, wake, and reset. Item use may resolve the current slot, an explicit slot, or stable item ID, but all forms dispatch the same atomic action.
7. Both actors may use a chest only while adjacent. The player may inspect, deposit into, and withdraw from an adjacent robot. The robot may deposit its own items into adjacent free player slots but may not inspect, remove, replace, or rearrange player items. Partial transfers leave remainders at the source.
8. Implement `src/pathfinding.js` as pure deterministic A*. Implement `src/intents.js` for actor-neutral animated destination intents and short-lived reservations.
9. Player left-click and robot `move_to` call the same `move_to(actor, target)`. Player Shift-click and robot WebMCP call the same `interact_at(actor, target, itemSelector)`, with no actor-specific branches beyond identity and inventory.
10. For either actor, `interact_at` validates the target and item, evaluates all walkable cardinally adjacent tiles, chooses the lowest actual path cost with a north/east/south/west tie-break, walks normal atomic steps, faces the target, revalidates target/item/stamina, and dispatches exactly one adjacent `use_item`. If already adjacent, act immediately. If disrupted, replan once and then fail in place without spending work stamina or items. Cancellation stops before the next step or final use.
11. Advance watered crops, dry soil, restore stamina, reset actors to beds, keep the robot asleep/ready, and show a day summary through the shared engine. The farm-side market buys seeds with shared money and immediately buys crops or logs from the acting inventory.
12. Add pure-engine tests, including a parameterized player/robot conformance suite for identical routes, tie-breaking, validation, costs, cancellation, replanning, effects, and failures from equivalent states.

## Phase 3: Playable Vertical Slice

13. Create one handcrafted farm in `src/world.js` with two beds, at least one fixed shared chest, a field, grass, paths, trees, and boundaries. Chests are fixed rather than craftable/placeable in the MVP.
14. Create original 16x16 terrain, soil, tree, crop, seed, produce, tool, chest, player, robot, bed, and effect sprites under `assets/game/`.
15. Implement `src/renderer.js` with integer scaling, a stable desktop viewport, actor animations, destination and interaction feedback, and visible player/robot paths. Smart interactions and queued work animate normal movement.
16. Implement `src/input.js` and `src/ui.js`: left-click movement, Shift-click smart interaction, keyboard movement, `1`-`0` hotbar selection, Space/E adjacent use, mouse targeting, inventories, status, menus, inspector access, chest and robot inventory windows, market, notifications, day summary, and intent cancellation.
17. Implement `src/persistence.js` with versioned localStorage autosaves and confirmed reset. Corrupt or incompatible saves fail safely. Defer JSON import/export.

## Phase 4: WebMCP and Inspector

18. Implement `src/webmcp.js` as a thin adapter over the shared engine and intent controller. Register tools for inspection, `move_to`, selection, adjacent `use_item`, shared `interact_at`, economy, adjacent storage, capacity-aware robot delivery, sleep/wake, cancellation, and bounded action sequences.
19. Let `use_item` and `interact_at` accept a 1-based slot or stable item ID and return the resolved item, final position, path/replan result, changed-state summary, robot state, and recoverable next actions. Do not expose player inventory contents to the robot.
20. Execute bounded robot plans visibly one entry at a time. An `interact_at` entry may include navigation plus exactly one ordinary use because the player has the same Shift-click affordance. Log every movement step and final action. Preserve completed entries and stop at the first failure or cancellation.
21. Do not add goal-solving or bulk tools such as `plant_plot`, `plant_all`, `water_all`, remote chest access, or cost/range bypasses unless equivalent player capabilities are deliberately added.
22. Handle unavailable `document.modelContext` explicitly while keeping solo play and inspector development controls functional.
23. Implement `src/inspector.js` with Overview, Tools, and Log views derived from the actual registry definitions. Include friendly/raw views, manual invocation, status, timing, inputs, outputs, and resulting events.
24. Add integration tests with a mock `document.modelContext` covering schemas, parity, smart interactions, storage permissions, structured results, logging, batches, cancellation, and fallback behavior.

## Phase 5: Polish and Submission

25. Balance stamina so either farmhand can perform meaningful work without clearing the entire forest on day one. Starting resources and prices must support a complete crop cycle and continued seed purchases; lumber provides useful work while crops grow.
26. Test human-only, robot-only, and mixed play; A* navigation; Shift-click/WebMCP parity; replanning; storage; delivery privacy; zero stamina; full inventories; interrupted batches; save/reload; fallback behavior; and reset.
27. Validate desktop layouts, pixel rendering, focus, modal stacking, overflow, overlap, contrast, log performance, runtime errors, and missing assets.
28. Deploy to GitHub Pages over HTTPS. Verify WebMCP in ChatGPT's in-app browser and Chrome with WebMCP testing enabled.
29. Ensure the public repository contains all permitted runtime assets, a visible license, setup instructions, and no prohibited packs.
30. Prepare the Devpost description and a narrated video under three minutes showing discovery, delegation, visible execution, inspector transparency, synchronized sleep, crop progression, harvest, and sale.

## Relevant Files

- `README.md`: product contract, run instructions, controls, scope, and submission notes.
- `index.html`: static application shell.
- `src/config.js`: balance and limits.
- `src/state.js`: serializable game state.
- `src/actions.js`: shared atomic validation and mutation.
- `src/pathfinding.js`: pure deterministic A*.
- `src/intents.js`: shared `move_to` and `interact_at` orchestration.
- `src/world.js`: fixed farm.
- `src/renderer.js`: Canvas rendering and animation.
- `src/input.js`: human input adapter.
- `src/webmcp.js`: WebMCP adapter and bounded plans.
- `src/inspector.js`: transparent debug UI.
- `src/ui.js`: windows and status UI.
- `src/persistence.js`: versioned autosave/reset.
- `assets/game/`: original redistributable sprites.
- `test/`: engine and mocked WebMCP tests.
- `LICENSE`: repository license.
- `THIRD_PARTY_NOTICES.md`: dependencies and asset boundary.

## Verification

1. Run unit and integration tests with Node's built-in test runner.
2. Serve the repository locally and complete the 3-4 day loop manually and through inspector-invoked robot actions.
3. Verify WebMCP discovery, schemas, calls, visible batches, failure responses, cancellation, and logs in Chrome.
4. Repeat the delegation demo in ChatGPT's in-app browser against the deployed HTTPS URL.
5. Reload during crop growth and after a partial robot plan without replaying effects or transactions.
6. Test a clean public deployment for missing assets, licensing visibility, console errors, and prohibited files.
7. Rehearse the final narrated workflow under three minutes.

## Decisions

- The MVP is an open-ended but submission-focused vertical slice.
- Human and robot are equal farmhands with separate 10-slot inventories and stamina, plus shared money.
- Parity is semantic rather than keystroke-literal.
- `move_to(actor, target)` and `interact_at(actor, target, itemSelector)` are universal actor-neutral intents. Player input and WebMCP are adapters over the same implementations.
- Both actors use deterministic A*. Left-click/`move_to` targets a walkable tile. Shift-click/`interact_at` paths to the cheapest reachable cardinally adjacent tile and performs one normal use.
- Combining navigation with one use is an equal input convenience, not a shortcut. It retains normal movement, work costs, animation, logging, validation, cancellation, and effects.
- A disrupted smart interaction replans once, then fails in place. Both actors receive the same failure codes.
- Robot tools are primitives plus a bounded sequence helper, without bulk gameplay shortcuts.
- Fixed farm chests are adjacent shared storage.
- The adjacent robot doubles as player-accessible storage. The robot can only deliver its own items into free player capacity.
- The day advances only when both actors sleep. The robot defaults asleep/ready each day.
- Only work consumes stamina. Movement, storage, shopping, and sleep remain possible at zero stamina.
- The market buys seeds and immediately purchases crops and logs.
- The world is one fixed map with local autosave and confirmed reset.
- Runtime art is a small original 16x16 set. Downloaded packs are reference-only unless explicit redistribution permission is obtained.

## Deferred

JSON save exchange, richer crops and economy, multiple layouts, upgrades, animals, crafting, cooking, buildings, avatar customization, multiplayer networking, embedded model hosting, mobile support, NPC systems, seasons, weather, combat, procedural worlds, and backend services.
