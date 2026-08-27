# Art Generation Ledger

Initial authorized exploration budget: **$5.05**

| Experiment | Purpose | Outputs | Reported cost | Running total | Decision |
| --- | --- | ---: | ---: | ---: | --- |
| Setup | Tool discovery and experiment plan | 0 | $0.00 | $0.00 | MCP connected after server restart. |
| 001 | RD Pro top-down robot silhouette concepts, 32x32, four independent variants | 4 | $0.72 | $0.72 | Useful concept direction; too expensive as the normal production workflow. Variants 01/04 strongest. |
| Style attempt | Kenney-reference custom RD Pro user style | 0 | $0.00 | $0.72 | Outcome unknown; no user style appeared in catalog. Treat as not created. |
| 002 | RD Mini top-down robot, native 16x16, Kenney-derived palette | 1 plus original-background return | $0.023 | $0.743 | Palette is compatible, but silhouette reads as a hooded farmhand rather than a robot. Reject for production robot. |
| 003 | RD Fast 16-item P0 static sheet, 256x256, Kenney-derived palette | 1 plus original-background return | $0.028 | $0.771 | Useful tree/stump/coin/prop candidates; weak prompt fidelity and layout. Escalate static sheet to Plus. |
| 004 | RD Plus 16-item P0 static sheet, 256x256, Kenney-derived palette | 1 plus original-background return | $0.058 | $0.829 | Better 4x4 structure, but key subjects still drifted. Do not escalate the whole sheet to Pro. |
| 005 | RD Plus focused turnip lifecycle shotgun sheet | 12 extracted candidates plus original-background return | $0.058 | $0.887 | Successful source for seed bag, stages 0-3, and harvested turnip; normalized 16x16 candidates await output-rights confirmation. |
| 006A | PixelLab Pixen solar charging station, 32x32 | 1 | 1 generation | $0.887 | Clean battery-cabinet silhouette; solar panel reads, but form is more appliance than farm pump. |
| 006B | RD Fast low-resolution solar charging station, 32x32 | 4 | $0.067 | $0.954 | Candidates 00/01 read clearly as solar charging pumps; 00 is the strongest composition reference. |
| 007 | RD Advanced Animation six-frame farmer side walk from an Aseprite-authored 64x64 keyframe | 1 sheet, 6 frames | $0.14 | $1.094 | Preserves farmer identity and approximate anchor, but redraws the Body_A gait and proportions. Use as reference, not bulk conversion. |

**Remaining RetroDiffusion API balance: $3.956.**

Requests, responses, outputs, comparison sheets, and notes are stored under `assets/game/experiments/`.

## Free Cost Estimates

Estimates do not affect the running total.

| Deliverable | Style | Estimated cost |
| --- | --- | ---: |
| Four 32x32 robot concepts | RD Pro top-down | $0.72 |
| One 256x256 16-item sheet | RD Pro spritesheet | $0.18 |
| One 256x256 16-item sheet | RD Plus item sheet | $0.058 |
| One 256x256 16-item sheet | RD Fast item sheet | $0.028 |
| One native 16x16 axe | RD Pro simple | $0.18 |
| One native 16x16 axe | RD Plus top-down item | $0.023 |
| One native 16x16 axe | RD Mini top-down item | $0.023 |
| One native 16x16 axe | RD Fast low resolution | $0.017 |
| Complete robot small-sprites animation contract | RD Animation small sprites | $0.07 |
| Water/grass Wang tileset | RD Tileset | $0.10 |

## Experiment 001 Notes

Goal: find a distinctive cozy farm robot silhouette that fits the selected Kenney Tiny Farm/Tiny Town 16x16 palette and remains readable beside a 16x16 farmhand.

The 32x32 size was chosen for silhouette exploration rather than production, but that distinction was not made clearly enough before spending. Production remains 16x16 unless a fixed animation contract intentionally uses a larger frame.

Desired output:

- One concept sheet, preferably 6-12 variants if the API supports sheets efficiently.
- Top-down or three-quarter top-down farm companion robots.
- Compact body readable in a 16x16 or 16x24/16x32 production frame.
- Warm cream/wood/teal/orange accents, dark plum outline, no neon sci-fi environment.
- Friendly utility design: antenna or leaf sensor, small display/eyes, visible hands/tool mount.
- Transparent or plain neutral background.
- No text, logos, weapons, humans, vehicles, or detailed scenery.

Selection criteria:

1. Readable at native resolution and 3x integer scale.
2. Distinct from the human farmhand but equally important.
3. Can plausibly hold axe, hoe, watering can, and seed bag.
4. Supports four directional poses and a charging/sleep state.
5. Palette can be reconciled with the current CC0 farm base.
6. Does not resemble a copyrighted named character or franchise design.

Future static production uses a sheet-first escalation: Fast, then Plus, then Pro only when reference consistency justifies the cost. See `docs/plans/asset-production-backlog.md`.

## Runtime Promotion Gate

RetroDiffusion's public terms page was unavailable during this session, and the MCP documentation does not state generated-output ownership/redistribution terms. Generated outputs remain under `assets/game/experiments/` and are excluded from Pages until those rights are verified. Normalized turnip candidates under `assets/game/original/` are not referenced by the runtime catalog yet.
