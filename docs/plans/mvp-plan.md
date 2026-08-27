# Vibe Farmer Challenge Vertical Slice

> **Implementation status:** This is the original canonical MVP plan, not a completion report. The 2026-08-26 audit found partial and missed requirements, including the handcrafted farm and original sprite set. See [mvp-audit.md](mvp-audit.md) and [refinement-plan.md](refinement-plan.md).

Build a submission-ready, no-build browser game centered on equal human and robot farmhands. The first release delivers a complete 3-4 in-game-day loop: clear, till, plant, water, sleep, harvest, buy, and sell. WebMCP exposes the robot through the same protocol-neutral controller used by human input. A deterministic headless simulation owns gameplay and time; browser UI, WebMCP, inspector controls, tests, and future protocols are replaceable adapters around it.

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
- Use common-sense layered boundaries rather than strict MVC: a headless `game` domain, a protocol-neutral application controller, and separate browser/WebMCP adapters. Gameplay rules never depend on the DOM, Canvas, WebMCP, wall-clock timers, or adapter schemas.
- Model action duration through deterministic simulation ticks. Delay represents world execution rather than UI-only animation.
- Allow exactly one active intent per actor. Defer multi-intent queues and autonomous action plans; an agent chooses its next primitive after the current one completes.
- Organize the game as an inviting domain map: the world owns terrain and entities; actors, plants, obstacles, containers, and items are entity categories; actions remain verb-first operations outside the world hierarchy.
- Use explicit deterministic lifecycle-handler registries rather than runtime object subscriptions. Begin with only `day_end` and `day_begin`; add finer night phases only when sequencing requirements make them necessary.
- Treat the game, co-op actor model, WebMCP layer, and inspector as one vertical slice. Defer world generation, JSON save files, customization, upgrades, animals, crafting, cooking, buildings, furniture, emotes, and additional maps.
- Make the first harvest and economy loop the definition of done.
- Do not publish the downloaded third-party sprite packs. Their licenses prohibit redistribution, conflicting with the challenge's public runnable-source requirement. Ship a small original sprite set with explicit licensing.
- Treat the live deployment, public repository, description, and narrated video under three minutes as release requirements.

## Phase 1: Foundation

1. Revise `README.md` into the product specification: pitch, audience, collaboration model, MVP loop, controls, WebMCP behavior, inspector, exclusions, run/deployment instructions, asset policy, and submission checklist.
2. Add an open-source `LICENSE` and `THIRD_PARTY_NOTICES.md`. Ensure prohibited source packs do not enter the public submission repository.
3. Establish a static ES-module application with `index.html`, `styles/`, `src/game/`, `src/application/`, `src/adapters/`, `test/`, and `assets/game/`. Use Canvas 2D for the pixel world and DOM/98.css for windows, with no transpilation or production build.
4. Enforce one-way dependencies: `adapters -> application -> game`. The game imports no application or adapter modules; the application layer imports no browser or WebMCP modules; adapters use the controller's public API rather than mutable state or atomic actions.
5. Add `src/game/README.md` as a reader's map explaining state ownership, terrain versus entities, entity placement, actor intents, action dispatch, lifecycle handlers, deterministic ticks, and where to add new gameplay content. Create folders only when backed by current MVP behavior rather than prebuilding future systems.
6. Define tunable rules in `src/game/config.js`: map dimensions, 16px tiles, 10 inventory slots mapped to `1`-`0`, stack limits, chest capacity, starting supplies and shared money, stamina, crop stages, tree durability, fixed tick duration, movement/work cooldown ticks, and browser catch-up limit. Use a three-watered-day crop cycle. Missed watering pauses growth and crops do not die in the MVP.

## Phase 2: Shared Deterministic Game

7. Implement `src/game/state.js` as the fully serializable source of truth: simulation tick, day, shared money, world terrain, world-owned entities, at most one active intent per actor, cooldowns, operation status, deterministic random state, and bounded domain-event history. The robot begins each day asleep/ready; its first action wakes it. The day advances only when both actors sleep.
8. Define the world in `src/game/world/`: dense terrain plus normalized entities owned by ID. Entities never hold back-references to the world or parent containers. An entity's placement records whether it occupies a tile, lives in a container, is equipped, or is temporarily unplaced during a controlled mutation.
9. Keep terrain distinct in `src/game/world/terrain/`: every coordinate has one terrain type such as grass, water, dirt, tilled soil, or wet tilled soil. Terrain is dense coordinate state without per-tile entity IDs.
10. Keep sparse, identifiable, or contained game things under `src/game/world/entities/`. Actors, plants, obstacles, containers, and non-stackable item instances are entity categories. Stackable seeds, logs, and produce use lightweight stack records inside container slots rather than receiving one entity ID per unit.
11. Model actors in `src/game/world/entities/actors/` as one shared record/system with role data. Human, robot, and future animals/NPCs use the same position, facing, stamina, inventory, and intent machinery; their intent source and explicit permissions differ without class inheritance or separate movement logic.
12. Put reusable inventory/container rules under `src/game/world/entities/containers/`, including actors, chests, and future container-bearing entities. Put item definitions and queries under `src/game/world/entities/items/`; item identity does not change when moving between a tile, actor, chest, or market transaction.
13. Implement `src/game/actions/` as the only atomic mutation boundary. Actions are verbs such as `move`, `useItem`, `transferItem`, `plant`, `water`, `harvest`, `buy`, `sell`, `sleep`, and `wake`. Each resolves nouns, validates shared rules, applies one state transition, emits domain events, and returns a stable result code. Do not hide cross-domain rules in methods such as `Tree.hitWithAxe()`.
14. Both actors may use a chest only while adjacent. The player may inspect, deposit into, and withdraw from an adjacent robot. The robot may deposit its own items into adjacent free player slots but may not inspect, remove, replace, or rearrange player items. Partial transfers leave remainders at the source.
15. Implement `src/game/world/pathfinding.js` as pure deterministic A*. Implement `src/game/world/entities/actors/intents.js` as serializable actor-neutral intent creation, validation, phase, route, cooldown, replan count, completion, failure, and cancellation state.
16. Implement `src/game/simulation.js` with synchronous deterministic `tick(state)`. Each call advances exactly one fixed simulation step: decrement cooldowns, move an actor at most one tile when ready, run eligible autonomous handlers, begin/complete one work phase, drain domain events, or transition an intent to completed/failed/cancelled. The game never calls `Date.now()`, `setTimeout()`, `requestAnimationFrame()`, Promises, DOM APIs, or WebMCP APIs.
17. Implement `src/game/events.js` as the explicit registry and deterministic dispatcher for lifecycle and domain events. Handlers are ordinary functions grouped near their domain modules, not subscriptions attached to runtime objects. Dispatch selects eligible entities from serialized placement/status, sorts them by stable entity ID, invokes registered handlers in documented order, and applies mutations through a constrained context or validated actions.
18. Begin with exactly two lifecycle events: `day_end`, dispatched after both actors sleep while the finished day's watering state is still available; and `day_begin`, dispatched after the day number advances. Plant `day_end` handlers increment growth only when their terrain is watered. Terrain `day_begin` handlers dry tilled soil; actor `day_begin` handlers restore stamina and reset bed/readiness state. Add `night_begin`/`night_end` only if future sequencing cannot be expressed cleanly with these two phases.
19. Use plain serializable domain events such as `actor_moved`, `item_used`, `crop_grew`, and `intent_completed` for reactions, inspection, UI, audio, and WebMCP logs. Domain handlers may emit additional events, but the dispatcher drains them deterministically and guards against unbounded event cycles.
20. Autonomous entity handlers, including future animal AI, use the same one-intent actor machinery. Random choices use a seeded PRNG stored in game state so identical state, commands, and ticks produce identical results across headless tests and save/load.
21. Player left-click and robot `move_to` submit the same command shape. Player Shift-click and robot WebMCP submit the same `interact_at` command shape, with no actor-specific branches beyond identity and inventory.
22. For either actor, `interact_at` validates the target and item, evaluates all walkable cardinally adjacent tiles, chooses the lowest actual path cost with a north/east/south/west tie-break, and records the route and final action as one intent. Future ticks walk normal atomic steps, face the target, revalidate target/item/stamina, and dispatch exactly one adjacent `use_item`. If already adjacent, the work phase still respects its cooldown. If disrupted, replan once and then fail in place without spending work stamina or items. Cancellation takes effect before the next atomic step or final use.
23. Reject submission with `ACTOR_BUSY` whenever that actor already has an active intent. Do not queue commands in the game. Player UI may explicitly cancel the player's current movement intent before submitting a replacement destination; WebMCP can do the same through cancellation followed by a new command.
24. Add pure-game tests that run ticks without real delays, including lifecycle order, handler eligibility, watered crop growth at `day_end`, soil drying at `day_begin`, deterministic event order, seeded randomness, event-cycle protection, and a parameterized player/robot suite for identical routes, tick counts, cooldowns, validation, costs, cancellation, replanning, effects, and `ACTOR_BUSY`. Add a headless import test proving all `src/game/` modules run in Node without browser globals.

## Phase 3: Protocol-Neutral Application Controller

25. Implement `src/application/controller.js` as the sole public control surface for adapters: `getSnapshot()`, `submit(command)`, `tick(count = 1)`, `cancel(operationId)`, and `subscribe(listener)`.
26. `submit(command)` validates and records one actor intent, then returns an operation ID and completion Promise. Keep Promise state outside the serializable game: the controller holds an in-memory map from operation IDs to resolvers and settles them when a later tick emits completion, failure, or cancellation. Headless callers may ignore Promises and inspect/tick state directly.
27. Give each operation a stable serializable record with operation ID, actor ID, command, phase, status, submitted tick, completed tick, and result/failure code. This record is authoritative; the Promise merely observes it.
28. `subscribe(listener)` publishes snapshots and domain events to external adapters. This controller-boundary subscription is separate from the game's explicit deterministic handler registry. Add controller tests for subscriptions, delayed completion, cancellation, `ACTOR_BUSY`, reset, and deterministic equivalence between manual and scheduled ticks.

## Phase 4: Playable Browser Adapter

29. Create one handcrafted farm in `src/game/world/world.js` with two beds, at least one fixed shared chest, a field, grass, paths, trees, and boundaries. Chests are fixed rather than craftable/placeable in the MVP.
30. Create original 16x16 terrain, soil, tree, crop, seed, produce, tool, chest, player, robot, bed, and effect sprites under `assets/game/`.
31. Implement `src/adapters/browser/renderer.js` with integer scaling, a stable desktop viewport, actor animations, destination and interaction feedback, and visible progress. Rendering reads snapshots/events and never mutates simulation state or decides gameplay outcomes.
32. Implement `src/adapters/browser/runtime.js` as the wall-clock scheduler. The UI may select pause, 1x, 2x, 5x, or 10x speed; runtime translates elapsed real time into `controller.tick()` calls. Speed affects both actors and all world systems equally and is not part of game state.
33. Clamp browser catch-up to a configured maximum, initially three seconds at base tick duration. After tab suspension or a long frame, process no more than that cap and discard excess elapsed wall time.
34. Implement `src/adapters/browser/input.js` and `src/adapters/browser/ui.js`: movement, smart interaction, keyboard controls, hotbar, targeting, inventories, status, speed controls, menus, inspector access, storage windows, market, notifications, day summary, and cancellation/replacement. Browser input submits controller commands and never calls game actions directly.
35. Implement `src/adapters/browser/persistence.js` with versioned localStorage autosaves and confirmed reset. Persist serializable game/operation state, not completion Promises or wall-clock accumulator state. For the MVP, reload marks active operations cancelled with a stable interruption code rather than reconnecting old adapter Promises. Corrupt or incompatible saves fail safely. Defer JSON import/export.

## Phase 5: WebMCP and Inspector Adapters

36. Implement `src/adapters/webmcp/tools.js` for tool names, descriptions, and JSON schemas, and `src/adapters/webmcp/adapter.js` as a thin translation layer over the application controller. Register tools for inspection, `move_to`, selection, adjacent `use_item`, shared `interact_at`, economy, adjacent storage, capacity-aware robot delivery, sleep/wake, and cancellation.
37. Primitive mutating WebMCP tools submit one robot intent and await the controller's completion Promise, so success means visible simulated execution finished rather than merely entered a queue. Forward the callback's `AbortSignal` to `controller.cancel(operationId)`.
38. Accept mutating commands while the simulation is paused. Their operations enter `waiting_for_ticks`, their WebMCP Promises remain pending without an internal timeout, and they resume when the browser schedules ticks again. If the host cancels through `AbortSignal`, cancel at the next safe atomic boundary. If a host abandons a call without cancellation, the authoritative in-game operation continues and remains visible by operation ID in the inspector.
39. Let `use_item` and `interact_at` accept a 1-based slot or stable item ID and return operation ID, submitted/completed ticks, resolved item, final position, path/replan result, changed-state summary, robot state, and recoverable next actions. Do not expose player inventory contents to the robot.
40. Do not expose multi-command queues, bounded plans, goal-solving or bulk tools such as `plant_plot`, `plant_all`, or `water_all`, remote chest access, speed controls, direct `tick()` access, or cost/range bypasses in the MVP. Models sequence work by waiting for one primitive result and choosing the next action.
41. Handle unavailable `document.modelContext` explicitly while keeping solo play and inspector development controls functional. Do not add artificial adapter delays: elapsed time comes from simulation progress.
42. Implement `src/adapters/browser/inspector.js` with Overview, Tools, Operations, and Log views derived from actual registry definitions. Include friendly/raw views, manual invocation, waiting/running/completed/failed/cancelled status, ticks elapsed, inputs, outputs, and domain events.
43. Add integration tests with a mock `document.modelContext` covering schemas, parity, completion only after ticks, paused submission, pause/resume during execution, abort-to-cancel propagation, abandoned-call continuation, one active robot intent, storage permissions, structured results, logging, and fallback behavior.

## Phase 6: Polish and Submission

44. Balance tick cooldowns and stamina so either farmhand performs meaningful visible work without making normal tool calls unreasonably slow or clearing the entire forest on day one. Starting resources and prices must support a complete crop cycle and continued seed purchases; lumber provides useful work while crops grow.
45. Test human-only, robot-only, and mixed play; headless rapid ticking; pause and all speed multipliers; bounded catch-up; A* navigation; Shift-click/WebMCP parity; delayed completion; paused waiting; one-active-intent rejection; cancellation; replanning; storage; delivery privacy; zero stamina; full inventories; save/reload interruption; fallback behavior; and reset.
46. Validate desktop layouts, pixel rendering, focus, modal stacking, overflow, overlap, contrast, log performance, runtime errors, and missing assets.
47. Deploy to GitHub Pages over HTTPS. Verify WebMCP in ChatGPT's in-app browser and Chrome with WebMCP testing enabled.
48. Ensure the public repository contains all permitted runtime assets, a visible license, setup instructions, and no prohibited packs.
49. Prepare the Devpost description and a narrated video under three minutes showing discovery, intent submission, visible delayed execution, pause/resume waiting, completion response, cancellation, inspector transparency, synchronized sleep, crop progression, harvest, and sale.

## Relevant Files

- `README.md`: product contract, run instructions, controls, scope, and submission notes.
- `index.html`: static application shell.
- `src/game/README.md`: wiki-like guide to gameplay concepts and extension points.
- `src/game/index.js`: small public headless-game API.
- `src/game/config.js`: simulation rules, balance, tick duration, cooldowns, and catch-up limit.
- `src/game/state.js`: fully serializable headless game and operation state.
- `src/game/simulation.js`: deterministic synchronous `tick()` progression.
- `src/game/events.js`: explicit lifecycle/domain handler registry and deterministic dispatcher.
- `src/game/actions/`: verb-first atomic game mutations.
- `src/game/world/world.js`: world construction, ownership, and queries.
- `src/game/world/pathfinding.js`: pure deterministic A*.
- `src/game/world/terrain/`: dense terrain grid, definitions, queries, and `day_begin` handlers.
- `src/game/world/entities/`: normalized entity registry, definitions, placement, and domain categories.
- `src/game/world/entities/actors/`: shared actor records, intents, stamina, and lifecycle handlers.
- `src/game/world/entities/containers/`: inventories, chests, and transfer rules shared by container-bearing entities.
- `src/game/world/entities/items/`: item definitions, tools, seeds, resources, and stack records.
- `src/game/world/entities/plants/`: crops, growth rules, and `day_end` handlers.
- `src/game/world/entities/obstacles/`: trees, rocks, and debris.
- `src/application/controller.js`: protocol-neutral submission, ticking, completion handles, cancellation, snapshots, and subscriptions.
- `src/adapters/browser/main.js`: browser composition root.
- `src/adapters/browser/runtime.js`: wall-clock tick scheduling, speed controls, and bounded catch-up.
- `src/adapters/browser/renderer.js`: Canvas rendering and presentation.
- `src/adapters/browser/input.js`: human input adapter.
- `src/adapters/browser/ui.js`: windows and status UI.
- `src/adapters/browser/inspector.js`: transparent operation/tool debug UI.
- `src/adapters/browser/persistence.js`: versioned local autosave/reset.
- `src/adapters/webmcp/tools.js`: WebMCP-only metadata and schemas.
- `src/adapters/webmcp/adapter.js`: WebMCP registration and controller translation.
- `assets/game/`: original redistributable sprites.
- `test/`: engine and mocked WebMCP tests.
- `LICENSE`: repository license.
- `THIRD_PARTY_NOTICES.md`: dependencies and asset boundary.

## Verification

1. Run game and controller tests with Node's built-in test runner, including headless imports, lifecycle dispatch, and deterministic manual ticking without browser globals or real delays.
2. Serve the repository locally and complete the 3-4 day loop manually and through inspector-invoked robot actions.
3. Verify WebMCP discovery, schemas, completion-blocking primitive calls, paused waiting, delayed execution, failure responses, cancellation, and operation logs in Chrome.
4. Repeat the delegation demo in ChatGPT's in-app browser against the deployed HTTPS URL.
5. Reload during crop growth and an active intent; verify it becomes explicitly interrupted without replaying effects or transactions.
6. Test a clean public deployment for missing assets, licensing visibility, console errors, and prohibited files.
7. Rehearse the final narrated workflow under three minutes.

## Decisions

- The MVP is an open-ended but submission-focused vertical slice.
- Human and robot are equal farmhands with separate 10-slot inventories and stamina, plus shared money.
- Parity is semantic rather than keystroke-literal.
- Architecture uses one-way `adapters -> application -> game` dependencies. The headless game contains gameplay and deterministic time; the controller exposes protocol-neutral commands; browser and WebMCP integrations are replaceable adapters.
- The world owns dense terrain and normalized entities. Actors, plants, obstacles, containers, and items are entity categories; IDs and placement records replace world/parent back-references.
- Actions are explicit verbs outside the world/entity hierarchy. Entity modules describe nouns, definitions, queries, and local lifecycle handlers without hiding cross-domain mutations in object methods.
- The game uses an explicit deterministic handler registry rather than runtime object subscriptions. Only `day_end` and `day_begin` lifecycle events exist initially: crops evaluate watered ground at `day_end`, then terrain dries and actors reset at `day_begin`.
- `move_to(actor, target)` and `interact_at(actor, target, itemSelector)` are universal actor-neutral intents. Player input and WebMCP are adapters over the same implementations.
- Both actors use deterministic A*. Left-click/`move_to` targets a walkable tile. Shift-click/`interact_at` paths to the cheapest reachable cardinally adjacent tile and performs one normal use.
- The headless core advances only through deterministic fixed ticks. Intent routes, phases, cooldowns, operation status, and completion are serializable state; wall-clock APIs and Promises remain outside the core.
- The browser UI controls global pause, 1x, 2x, 5x, and 10x speed by scheduling controller ticks. Catch-up after suspension is capped at three seconds and excess elapsed time is discarded.
- Combining navigation with one use is an equal input convenience, not a shortcut. It retains normal movement, tick duration, work costs, animation, logging, validation, cancellation, and effects.
- A disrupted smart interaction replans once, then fails in place. Both actors receive the same failure codes.
- Each actor has at most one active intent. Busy actors reject new commands; no hidden queue or multi-action robot plan exists in the MVP.
- Primitive WebMCP calls await real tick-driven completion and support abort-driven cancellation. Promise handles exist only in the application controller and observe authoritative serializable operation records.
- Commands submitted while paused enter `waiting_for_ticks`; their tool calls remain pending and visible until ticks resume or cancellation occurs.
- Robot tools expose only single-action primitives, without bulk gameplay shortcuts or sequence helpers.
- Fixed farm chests are adjacent shared storage.
- The adjacent robot doubles as player-accessible storage. The robot can only deliver its own items into free player capacity.
- The day advances only when both actors sleep. The robot defaults asleep/ready each day.
- Only work consumes stamina. Movement, storage, shopping, and sleep remain possible at zero stamina.
- The market buys seeds and immediately purchases crops and logs.
- The world is one fixed map with local autosave and confirmed reset.
- Runtime art is a small original 16x16 set. Downloaded packs are reference-only unless explicit redistribution permission is obtained.

## Deferred

JSON save exchange, richer crops and economy, multiple layouts, upgrades, animals, crafting, cooking, buildings, avatar customization, multiplayer networking, embedded model hosting, mobile support, NPC systems, seasons, weather, combat, procedural worlds, and backend services.
