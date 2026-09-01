# MVP Requirement Audit

Audit date: 2026-08-26

Status meanings:

- **Met:** Implemented and verified substantially as written.
- **Partial:** Meaningful implementation exists, but acceptance or architecture differs.
- **Missed:** Required behavior/artifact is absent.
- **Superseded:** Deliberately replaced by a documented decision that still meets the product goal.
- **Deferred:** Explicitly moved out of this release; not counted as complete.

| Item | Status | Evidence and gap |
| --- | --- | --- |
| 1 | Partial | README covers pitch, controls, loop, scope, Inspector, and local run; audience and release checklist remain thin. |
| 2 | Met | MIT license, third-party notices, ignore rules, and tracked-file audit exclude prohibited packs. |
| 3 | Partial | Static ES modules, Canvas, DOM, and 98.css exist; `assets/game/` does not. |
| 4 | Partial | Import direction is broadly correct, but browser composition imports game constructors and adapters read live snapshots directly. |
| 5 | Partial | Game README is a useful map but lacks placement, dispatch, lifecycle, and extension detail promised by the plan. |
| 6 | Partial | Core timing/dimension rules are configurable; prices, crop stages, chest capacity, and starting content remain distributed or hard-coded. |
| 7 | Partial | Serializable tick/day/world/operations/history exist; seeded random state and explicit wake readiness do not. |
| 8 | Partial | World owns normalized entities, but explicit tile/container/equipped/unplaced placement records are absent. |
| 9 | Met | Dense terrain is distinct from sparse entities. |
| 10 | Partial | Actors, plants, trees, and chests are entities; non-stackable tools remain anonymous inventory records. |
| 11 | Met | Player and robot share actor, movement, stamina, inventory, and intent machinery. |
| 12 | Partial | Reusable inventories/item definitions exist; stable non-stackable item identity/placement does not. |
| 13 | Partial | Actions own most atomic gameplay mutations; wake/reset and some intent/lifecycle mutations sit elsewhere. |
| 14 | Met | Adjacent chest/robot storage and robot-to-player delivery privacy are implemented and tested. |
| 15 | Met | Deterministic A* and serializable actor-neutral intents are implemented. |
| 16 | Partial | Tick simulation is synchronous and browser-free; autonomous handlers and a general event drain are absent. |
| 17 | Partial | Deterministic lifecycle registry exists; ordinary domain events mostly write history directly and handlers receive unrestricted state. |
| 18 | Partial | Day-end/day-begin order, growth, drying, and stamina restore work; beds and return-to-bed placement do not. |
| 19 | Partial | Serializable events exist, but most are not processed through the dispatcher described in the plan. |
| 20 | Missed | No seeded PRNG state/API or autonomous entity handler exists. |
| 21 | Met | Mouse/keyboard and WebMCP movement/interaction converge on shared command shapes and intents. |
| 22 | Partial | Cheapest adjacent routing, cooldown, validation, cancellation, and one replan exist; explicit target-facing and real disruption/replan coverage are incomplete. |
| 23 | Partial | `ACTOR_BUSY` and no queue are implemented; browser cancel-and-replace destination behavior is absent. |
| 24 | Partial | Strong core coverage exists; seeded randomness, event cycles, real replanning, full parity matrix, and several edge cases are missing. |
| 25 | Partial | Controller is the main adapter surface but exposes additional methods and returns a live mutable snapshot. |
| 26 | Met | Intent submission returns operation IDs and external completion Promises settled by later ticks. |
| 27 | Met | Serializable operation records are authoritative. |
| 28 | Partial | Subscription/delay/cancel/pause tests exist; reset and scheduled/manual equivalence coverage are incomplete. |
| 29 | Missed | No handcrafted farm with beds, field, paths, boundaries, water, and composition; browser creates a grass grid, chest, and four trees. |
| 30 | Missed | No original 16x16 sprite files exist under `assets/game/`; procedural rectangles are placeholders, not an acceptable replacement. |
| 31 | Partial | Integer scaling and movement interpolation exist; sprite rendering, destination feedback, work animation, and visible progress do not. |
| 32 | Met | Browser runtime schedules Pause/1x/2x/5x/10x globally. |
| 33 | Met | Catch-up is clamped and deterministically tested. |
| 34 | Partial | Controls, hotbar, contextual market/storage, daily summary, route feedback, and modeless windows exist; planned input/UI module split and player cancellation/replacement remain. |
| 35 | Met | Versioned autosave, confirmed reset, active-operation interruption, corrupt-save fallback, explicit outdated-development-save reset, and future-version preservation are implemented. Pre-1.0 backward migration is intentionally out of scope. |
| 36 | Partial | Ten focused primitive tools exist; world and market inspection are separate, movement, interaction, transfer, trade, and sleep enforce shared spatial rules, and an explicit wake tool remains absent. |
| 37 | Partial | Movement/interaction await simulation and support abort. Select, trade, transfer, and sleep mutate immediately and ignore abort. |
| 38 | Partial | Paused intents wait and abandoned calls continue; immediate mutators still execute while paused. |
| 39 | Met | `interact_at` accepts slot/item ID and returns structured operation/item/path/change/robot/recovery context without player inventory. |
| 40 | Met | No plan, queue, bulk farm, speed, direct tick, or remote-storage tool is exposed. |
| 41 | Met | Unsupported WebMCP retains local play and Inspector invocation without artificial delay. Default inspection is compact and coordinate-labeled, with map/center/radius/entity/history filters and opt-in detailed terrain JSON. |
| 42 | Partial | Four views, registry-derived tools, raw invocation, statuses, elapsed ticks, and collapsible records exist; friendly game-facing Inspector views remain weak. |
| 43 | Partial | Mock integration covers core discovery, pause, abort, abandonment, busy, privacy, results, and logs; full schema/parity/mid-execution matrix is incomplete. |
| 44 | Met | Default resources support a complete profitable crop cycle and trees cannot all be cleared by one actor on day one. |
| 45 | Partial | Broad deterministic coverage exists; human-only/robot-only/mixed multi-map play, real replanning, full capacity/stamina, and all browser workflows need coverage. |
| 46 | Missed | No tracked screenshot/visual QA, canvas pixel checks, contrast audit, log performance test, or full console/missing-asset browser pass. |
| 47 | Partial | HTTPS Pages deployment works; enabled Chrome and ChatGPT in-app WebMCP verification is not recorded. |
| 48 | Met | Public repository has source, setup, license, notices, and no prohibited asset packs. It still lacks required original runtime art. |
| 49 | Partial | Submission description and timed script exist; final URLs, refined screenshots, and recorded video do not. |

## Summary

- Met: 16
- Partial: 29
- Missed: 4
- Superseded: 0
- Deferred: 0

The missed items are 20, 29, 30, and 46. The refinement release prioritizes the game-facing blockers: canonical authored maps, original sprites, camera, spatial sleep, inspection, inventory workflows, and visual QA.

See [refinement-plan.md](refinement-plan.md) for the corrective implementation sequence.
