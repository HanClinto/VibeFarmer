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
| Pause / 1x / 2x / 5x / 10x | Set the deterministic simulation speed |
| Escape | Close the frontmost open window |
| Sleep | End the day once both farmhands are sleeping |

Select an empty hotbar slot and Shift-click a mature crop to harvest it.
Crop tiles are walkable. Hoeing a stage-0 crop refunds its seed; hoeing a later crop destroys it.
The farm-side Market buys seeds and sells turnips or logs one item at a time using shared money.
The Storage window transfers items one unit at a time with an adjacent farm chest or the robot companion.
Market and Storage windows can be dragged by their title bars.

The browser keeps a versioned local autosave. New Game requires confirmation; reloading during an active operation preserves completed world changes and cancels only the unfinished operation.

Robot Inspector derives its Tools view from the registered WebMCP definitions and shows robot state, schemas, manually invokable tools, operation records, game events, and WebMCP invocation timing.
Inspector invocation records are collapsible, and the separate resizable Action Log compares player and robot controller commands with their resulting game events in parallel columns.

Movement and work now advance through fixed simulation ticks. Pausing stops tick progression without cancelling active player or robot work; pending operations remain visible as `waiting_for_ticks` in the Inspector and resume as the same operation.

## MVP Loop

Clear land, till soil, plant and water seeds, sleep through several days, harvest crops, and sell crops or logs. The human and robot have separate ten-slot inventories and stamina but share money. Fixed farm chests provide shared storage, and the adjacent robot can also act as player-accessible storage.

## Scope

The challenge release targets one fixed farm, a 3-4 day crop cycle, lumber, a simple market, local autosave, WebMCP tools, and a transparent Robot Inspector. Procedural worlds, animals, crafting, cooking, buildings, customization, multiplayer networking, seasons, weather, and mobile support are deferred.

## Assets and License

Application code is licensed under the MIT License. Current game-world visuals are procedural Canvas placeholders; the refinement plan requires an original redistributable sprite set under `assets/game/`. The 98.css interface dependency is documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Downloaded packs under `assets/sprites/` are local design references and are excluded from version control because their licenses do not permit redistribution. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).