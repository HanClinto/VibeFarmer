# Vibe Farmer

A cozy pixel-art farming game where a human and a WebMCP-controlled robot work as equal farmhands in one shared world.

Vibe Farmer is an entry for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). Its central experiment is whether different models can collaborate at different levels of autonomy: a capable model may plan a full workday, while a smaller model can perform one carefully instructed action at a time.

<img width="3680" height="2382" alt="image" src="https://github.com/user-attachments/assets/62422c49-d096-4449-8b5c-9ff58b05822b" />

## Current Prototype

The first executable slice demonstrates the shared control contract:

- Deterministic A* movement for both actors.
- Player clicks resolve to the same `move_to` or `interact_at` intents available to the robot.
- Player Shift-click/right-click inspects without acting; robot inspection uses `inspect_game`.
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

For testing expensive purchases, add `?cheatMoney=10000` to the URL. It sets shared money on load and is visibly reported in the status strip. Values are limited to 1,000,000g.

Run the deterministic game-core tests with:

```sh
npm test
```

`npm run build:site` creates the same static `_site/` artifact used by GitHub Pages. Deployment builds append the current short commit hash to the HTML entry assets and all relative ES-module imports, preventing stale mixed-version module graphs.

## Controls

| Input | Action |
| --- | --- |
| Left-click | Use the selected item on a valid target, harvest a mature crop, or walk to open ground |
| Shift-click / Right-click | Inspect a tile without acting |
| Arrow keys / WASD | Move one tile |
| `1`-`0` | Select one of ten inventory slots |
| Space / E | Use the selected item on the faced tile |
| Escape | Close the frontmost open window |

Plain clicks prioritize portals, mature crops, and valid selected-item uses before ordinary movement. Occupied or blocked tiles with no meaningful selected-item action open Object Inspector instead. Moving the pointer across the farm highlights one adjacent action tile in that direction. While the pointer remains over the farm, Space or E uses that tile; leaving the farm returns keyboard actions to the actor's saved facing direction. Idle farmhands raise their full-size selected item above their head, with a subtle directional offset matching the action tile. During use, the item remains full-sized as it descends through a quarter-turn matching its mirrored orientation.

Interact with a mature crop to harvest it regardless of the selected hotbar item.
Crop tiles are walkable. Hoeing a stage-0 crop refunds its seed; hoeing a later crop destroys it.
Nearby contextual actions appear automatically in the game menu. Beside a produce display, choose Open Market to trade using shared money; both farmhands must be beside the market to buy or sell.
Beside a chest or the robot, choose Open Chest or Open Robot Storage. Click moves one item; Shift-click moves the visible stack.
Beside the player bed, choose Sleep. When both farmhands are ready, the game fades to night and shows separate human, robot, and farm statistics for the completed day. If the robot remains awake, the farm dims and offers a Sleep anyway confirmation after a short wait; an idle robot is readied for night where it is, while active robot operations are never interrupted. The same actions also remain available through Object Inspector.
Modeless windows may remain open while playing; click the canvas to restore movement controls. Market, Storage, Inspector, Action Log, and summary windows can be dragged by their title bars.

Sound is opt-in from the game menu. Short synthesized cues cover farming actions, harvests, transfers, market transactions, portal travel, and morning; no external audio files or autoplay are used.

The browser keeps a versioned local autosave. New Game requires confirmation; reloading during an active current-version operation preserves completed world changes and cancels only the unfinished operation. Outdated pre-1.0 development saves reset instead of being migrated.

Robot Inspector derives its MCP view from the registered WebMCP definitions and explains that these protocol tools are available to a local agent controlling the robot. Its Overview includes a sprite camera centered on the robot and an Agent view showing the exact default `inspect_game` ASCII observation. It also shows schemas, manual test invocation, operation records, game events, and WebMCP timing. Its collapsed Testing section contains simulation speed/tick controls and the chop-tree demo shortcut.

`inspect_game` defaults to a compact coordinate-labeled ASCII view around the robot, useful nearby entities, type counts, robot state, and active operations. Agents may choose another map/center/radius, filter entity types, request bounded history, or opt into `mode: "detailed"` when the full selected-map terrain matrix is genuinely needed.

Compact crop symbols encode both growth and moisture: `g` dry growing, `G` watered growing, `h` dry harvest-ready, and `H` watered harvest-ready. Sparse plant records also include an explicit `watered` boolean.
Inspector invocation records are collapsible, and the separate resizable Action Log compares player and robot controller commands with their resulting game events in parallel columns.

Movement and work now advance through fixed simulation ticks. Pausing stops tick progression without cancelling active player or robot work; pending operations remain visible as `waiting_for_ticks` in the Inspector and resume as the same operation.

## MVP Loop

Clear land, till soil, plant and water seeds, sleep through several days, harvest crops, and sell crops or logs. The human and robot have separate ten-slot inventories and stamina but share money. Fixed farm chests provide shared storage, and the adjacent robot can also act as player-accessible storage.

Trees remain full-sized as they take damage, shaking and shedding leaves after each axe hit. When a farmhand lacks stamina for an action, rising Zs appear above them and the status strip explains how to recover: the player sleeps at home, while the robot can use its charging berth or a Solar Charging Station.

- Turnip: 3 nights, one crop, inexpensive baseline.
- Potato: 4 nights, deterministic 2-4 crop yield.
- Corn: 5 nights, two-crop harvest, then regrows every 2 watered nights.
- Pumpkin: 6 nights, expensive seed and high-value one-crop harvest.

Daily requests and changing market prices are intentionally deferred; crop economics remain deterministic and visible.

## Solar Charging Station

The Market sells one-slot Solar Charging Stations for 400g. Select the station and use it on an empty adjacent grass or path tile to place it. The station blocks movement and stores 40 stamina.

When the robot uses `interact_at` on an adjacent station, it receives only the energy needed to reach 20 stamina. If the station cannot completely refill the robot, it transfers everything remaining. Unused charge stays in the station, and its sprite changes at full, medium, low, and empty levels. Solar charge returns to 40 each morning. The station, charge, access state, recharge result, and morning refill are visible through inspection and logs.

## Scope

The challenge release targets one fixed farm, a 3-4 day crop cycle, lumber, a simple market, local autosave, WebMCP tools, and a transparent Robot Inspector. Procedural worlds, animals, crafting, cooking, buildings, customization, multiplayer networking, seasons, weather, and mobile support are deferred.

Browser QA targets desktop Chromium at 1280x900 or larger. The interface intentionally keeps a fixed 576x480 game canvas and a 760px minimum document width; narrow/mobile layouts are not release targets.

## Assets and License

Application code is licensed under the MIT License. The Canvas world and DOM inventory use a curated CC0 16x16 runtime catalog under `assets/game/`; directional actor/action frames and effects remain refinement work. Official Kenney source sheets and adjacency-preserving labeled copies live in [assets/reference/kenney/README.md](assets/reference/kenney/README.md), making exact tile requests reproducible. Third-party dependencies are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Downloaded packs under `assets/sprites/` are local design references and are excluded from version control because their licenses do not permit redistribution. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
