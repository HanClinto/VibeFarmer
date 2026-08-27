# Vibe Farmer Submission Draft

## Short Description

Vibe Farmer is a cozy browser farming game where a human and an AI-controlled robot work as equal farmhands in one deterministic world. WebMCP gives the robot the same primitive capabilities available through human controls: move, select an item, use it once, trade one item, transfer one item, sleep, inspect, and cancel work. Neither side gets bulk actions or hidden gameplay shortcuts.

## Project Description

Vibe Farmer explores assistive AI through visible, shared work rather than invisible automation. The player and robot clear land, till soil, plant and water turnips, sleep through crop growth, harvest, and trade using the same simulation rules. Actions take simulated time, consume the same stamina, obey the same pathfinding and inventory limits, and remain visible on the farm while they execute.

The game core is deterministic and headless. Browser controls and WebMCP are adapters over one protocol-neutral controller, so movement and item interaction converge on the same serialized intents and atomic game actions. One actor can have only one active intent, and cancellation settles at a safe tick boundary. Selection, trade, transfer, and sleep are currently immediate controller commands rather than timed intents.

Transparency is part of the play surface. Robot Inspector derives its tool list and schemas from the registered WebMCP definitions, supports raw JSON invocation, and exposes operation state and invocation timing. A separate Action Log places player and robot commands and resulting domain events in parallel columns. When the simulation is paused, pending tool calls remain unresolved and their operations visibly enter `waiting_for_ticks`; resuming continues the same operation.

The complete loop runs as a static site with no production framework or server. Versioned local autosaves preserve completed world changes, active work is safely interrupted on reload, and GitHub Pages deploys a cache-busted ES-module graph.

## Design Principles

- **Equal capability:** Human and robot actions use the same controller, intents, pathfinding, stamina, inventory, economy, and lifecycle rules.
- **Primitive tools:** WebMCP exposes single actions, not plans, queues, `plant_all`, remote storage, speed controls, or direct ticks.
- **Visible latency:** Successful movement and item-interaction responses mean simulated work visibly completed, not merely that it entered a queue. Immediate selection, trade, transfer, and sleep commands are reported synchronously.
- **Inspectable state:** Operations are serializable records with stable IDs, phases, statuses, ticks, results, and cancellation state.
- **Privacy by role:** The robot may inspect its own inventory and nearby shared storage, but not the player's inventory. It may deliver its own item into available player capacity.
- **Replaceable adapters:** The game core has no DOM, Canvas, Promise, timer, localStorage, or WebMCP dependency.

## Demo Script (2:45 Target)

### 0:00-0:18 - Premise and Shared World

Show the farm and both actors.

Narration: "Vibe Farmer is a cozy farm game where I and an AI robot share one deterministic world. The experiment is simple: different interfaces, equal gameplay capability. The robot has no bulk actions or hidden shortcuts."

### 0:18-0:38 - Discovery and Primitive Surface

Open Robot Inspector, then Tools. Briefly scroll the nine tool definitions and expand one input schema.

Narration: "Robot Inspector is derived from the registered WebMCP definitions. The surface is intentionally primitive: inspect, move, use one item, select, trade one item, transfer one item, sleep, and cancel."

### 0:38-1:03 - Visible Delayed Execution

Choose `move_to`, enter a reachable coordinate, invoke it, and keep the farm visible while the robot walks. Show the structured completion result.

Narration: "A mutating call resolves only after visible simulated work finishes. This response includes its operation ID, submitted and completed ticks, path outcome, changed events, final robot state, and possible next tools."

### 1:03-1:30 - Pause, Waiting, Resume

Open Robot Inspector > Overview > Testing and pause the simulation. Invoke another `move_to`. Open Operations and point to `waiting_for_ticks` while the Testing tick counter remains fixed. Resume at 1x and show completion.

Narration: "Pause does not fake success or cancel the request. The same authoritative operation waits for ticks, its Promise remains pending, and resume continues it."

### 1:30-1:48 - Cancellation

Start a longer move or interaction, press Cancel in the Inspector, and show `INTENT_CANCELLED` after the next safe tick.

Narration: "AbortSignal maps to controller cancellation. Cancellation settles at a deterministic atomic boundary and remains visible in operation history."

### 1:48-2:10 - Human and Robot Parity

Use Arrow/WASD or click to move the player, then Shift-click or Space/E to use an item. Open Action Log and show both columns.

Narration: "Human controls submit the same semantic commands. The parallel log shows request source, actor, movement, item use, and completion events without changing the underlying rules."

### 2:10-2:37 - Farm Loop

Show tilled, watered, and planted soil. Use Robot Inspector > Testing for faster simulation, rewatering each day. Inspect the adjacent player bed to sleep and show the Day Complete report. Harvest the mature turnip, inspect an adjacent produce display to open Market, sell it, and buy a replacement seed.

Narration: "The loop is complete: clear, till, plant, water, synchronize sleep, grow, harvest, sell, and reinvest. Both farmhands have separate inventories and stamina but share money and storage."

### 2:37-2:45 - Close

Return to the farm with the Inspector or Action Log visible.

Narration: "Vibe Farmer makes AI assistance legible: same world, same costs, different interfaces, and every action observable."

## Recording Checklist

- Start from New Game and 1x speed.
- Keep browser zoom and viewport fixed so the farm and active window remain visible.
- Preselect reachable coordinates for move and cancellation demonstrations.
- Prepare one planted crop near maturity if the full three-night loop would exceed the recording target.
- Show raw JSON input without replacing it with a generated form.
- Show at least one expanded invocation record and one parallel Action Log entry.
- Confirm the paused tick number remains unchanged on screen.
- Confirm cancellation and completion codes are readable before changing views.
- Record from the public HTTPS Pages URL with WebMCP enabled for the final take.
- Keep the final video below three minutes.