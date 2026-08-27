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
| Sleep | End the day once both farmhands are sleeping |

Select an empty hotbar slot and Shift-click a mature crop to harvest it.

Movement and work now advance through fixed simulation ticks. Pausing stops tick progression without cancelling active player or robot work; resuming continues the same operation.

## MVP Loop

Clear land, till soil, plant and water seeds, sleep through several days, harvest crops, and sell crops or logs. The human and robot have separate ten-slot inventories and stamina but share money. Fixed farm chests provide shared storage, and the adjacent robot can also act as player-accessible storage.

## Scope

The challenge release targets one fixed farm, a 3-4 day crop cycle, lumber, a simple market, local autosave, WebMCP tools, and a transparent Robot Inspector. Procedural worlds, animals, crafting, cooking, buildings, customization, multiplayer networking, seasons, weather, and mobile support are deferred.

## Assets and License

Application code is licensed under the MIT License. Runtime artwork created for the game will live under `assets/game/`.

Downloaded packs under `assets/sprites/` are local design references and are excluded from version control because their licenses do not permit redistribution. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).