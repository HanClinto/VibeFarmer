# Vibe Farmer

A cozy pixel-art farming game where a human and a WebMCP-controlled robot work as equal farmhands in one shared world.

Vibe Farmer is an entry for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). Its central experiment is whether different models can collaborate at different levels of autonomy: a capable model may plan a full workday, while a smaller model can perform one carefully instructed action at a time.

## Current Prototype

The first executable slice demonstrates the shared control contract:

- Deterministic A* movement for both actors.
- Player left-click and robot `move_to` use the same intent.
- Player Shift-click and robot `interact_at` path adjacent to a target and use one item.
- Player hotbar slots use keys `1` through `0`.
- Robot actions may identify the same owned item by slot or stable item ID.
- Neither actor receives bulk gameplay shortcuts.

The broader MVP is specified in [docs/plans/mvp-plan.md](docs/plans/mvp-plan.md).
Submission copy and the timed demo script live in [docs/submission.md](docs/submission.md).
The implementation audit and corrective design cycle are tracked in [docs/plans/mvp-audit.md](docs/plans/mvp-audit.md) and [docs/plans/refinement-plan.md](docs/plans/refinement-plan.md).
The licensed/original sprite strategy and comparison gate are documented in [docs/plans/art-direction.md](docs/plans/art-direction.md).

## Run Locally

The game has no production build step. Serve the repository over HTTP:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Run the deterministic game-core tests with:

```sh
npm test
```

`npm run build:site` creates the same static `_site/` artifact used by GitHub Pages. Deployment builds append the current short commit hash to the HTML entry assets and all relative ES-module imports, preventing stale mixed-version module graphs.

## Controls

| Input | Action |
| --- | --- |
| Left-click | Walk to a reachable tile |
| Shift-click | Walk adjacent to the target and use the selected item once |
| Arrow keys / WASD | Move one tile |
| `1`-`0` | Select one of ten inventory slots |
| Space / E | Use the selected item on the faced tile |
| Escape | Close the frontmost open window |

Select an empty hotbar slot and Shift-click a mature crop to harvest it.
Crop tiles are walkable. Hoeing a stage-0 crop refunds its seed; hoeing a later crop destroys it.
Click an adjacent produce display and choose Open Market to trade using shared money. Both farmhands must be beside the market to buy or sell.
Click an adjacent chest or robot and choose Open Storage to transfer items. Click moves one item; Shift-click moves the visible stack.
Click the adjacent player bed and choose Sleep. When both farmhands are ready, the game fades to night and shows separate human, robot, and farm statistics for the completed day.
Modeless windows may remain open while playing; click the canvas to restore movement controls. Market, Storage, Inspector, Action Log, and summary windows can be dragged by their title bars.

The browser keeps a versioned local autosave. New Game requires confirmation; reloading during an active current-version operation preserves completed world changes and cancels only the unfinished operation. Outdated pre-1.0 development saves reset instead of being migrated.

Robot Inspector derives its Tools view from the registered WebMCP definitions and shows robot state, schemas, manually invokable tools, operation records, game events, and WebMCP invocation timing. Its collapsed Testing section contains simulation speed/tick controls and the chop-tree demo shortcut.
Inspector invocation records are collapsible, and the separate resizable Action Log compares player and robot controller commands with their resulting game events in parallel columns.

Movement and work now advance through fixed simulation ticks. Pausing stops tick progression without cancelling active player or robot work; pending operations remain visible as `waiting_for_ticks` in the Inspector and resume as the same operation.

## MVP Loop

Clear land, till soil, plant and water seeds, sleep through several days, harvest crops, and sell crops or logs. The human and robot have separate ten-slot inventories and stamina but share money. Fixed farm chests provide shared storage, and the adjacent robot can also act as player-accessible storage.

## Scope

The challenge release targets one fixed farm, a 3-4 day crop cycle, lumber, a simple market, local autosave, WebMCP tools, and a transparent Robot Inspector. Procedural worlds, animals, crafting, cooking, buildings, customization, multiplayer networking, seasons, weather, and mobile support are deferred.

Browser QA targets desktop Chromium at 1280x900 or larger. The interface intentionally keeps a fixed 576x480 game canvas and a 760px minimum document width; narrow/mobile layouts are not release targets.

## Assets and License

Application code is licensed under the MIT License. The Canvas world and DOM inventory use a curated CC0 16x16 runtime catalog under `assets/game/`; directional actor/action frames and effects remain refinement work. Official Kenney source sheets and adjacency-preserving labeled copies live in [assets/reference/kenney/README.md](assets/reference/kenney/README.md), making exact tile requests reproducible. Third-party dependencies are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Downloaded packs under `assets/sprites/` are local design references and are excluded from version control because their licenses do not permit redistribution. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).