# Vibe Farmer Original and Modified Art

## Android Farmhand South

`android-farmhand-south.png` is a Vibe Farmer modification of Kenney Tiny Farm `tile_0109` (`kenney/tiny-farm/farmhand-b.png`). The source is CC0 1.0 and permits modification and redistribution.

Design purpose: preserve the human farmhand's exact silhouette and proportions so the robot reads as an android counterpart with equal physical/gameplay affordances.

Modification stages are preserved under `assets/game/experiments/manual-android/`:

1. `01-recolor.png`: maps skin/workwear colors to warm gray metal, muted teal, and slate while preserving the original outline and alpha.
2. `02-glow-details.png`: changes the existing eye pixels to cyan and adds one amber status-light pixel.
3. `comparison.png`: nearest-neighbor comparison with the source farmer.

The promoted frame is copied from stage 2. `android-farmhand-raised.png` applies the same palette and glow details to the project raised-arm variant based on `tile_0109`. Future north/east/west and action frames should preserve the same palette mapping and foot alignment.

## Raised-Arm Farmhands

`kenney/tiny-farm/farmhand-a-raised.png` and `farmhand-b-raised.png` are Vibe Farmer raised-arm modifications based on Kenney Tiny Farm `tile_0108` and `tile_0109`. They preserve the original 16x16 actor footprint and are used to present selected items above idle farmhands.

## Watered Soil

`soil-wet.png` is a directionless dark recolor of Kenney Tiny Town `tile_0025`, replacing the directional furrows from Tiny Farm. The dry source color `#EAA56C` maps to `#9A6B57`; silhouette and dimensions remain unchanged. This lets players till free-form plots without every tile implying a horizontal or vertical planting row.

`crop-pumpkin-mature.png` and `item-pumpkin.png` are semantic copies of a Vibe Farmer recolor of Kenney Tiny Farm `tile_0056`. Source greens `#4E974C`, `#84C669`, and `#C6E58D` map to pumpkin oranges `#A74720`, `#DF742C`, and `#F3B24A`; the original dark outline and 16x16 silhouette are preserved.

## Turnip Lifecycle Candidates

The normalized 16x16 seed, stage, and harvested-turnip candidates are preserved under `assets/game/experiments/retrodiffusion/005-plus-turnip-lifecycle/normalized/` with their full request, response, sheets, crops, and notes.

They are not referenced by `catalog.json` yet. Runtime promotion is blocked until RetroDiffusion generated-output ownership and public redistribution rights are verified.
