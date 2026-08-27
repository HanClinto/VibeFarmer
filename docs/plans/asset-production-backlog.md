# Asset Production Backlog

## Budget State

- Initial balance: **$5.05**
- Spent: **$0.887**
- Remaining: **$4.163**
- Paid generations completed: **5**
- Further paid generation is paused until this backlog is approved by implementation order.

The first paid request generated four independent 32x32 robot concepts. It was useful for silhouette exploration but inefficient compared with contract-specific sheet generation. Those files and exact metadata are preserved under `assets/game/experiments/retrodiffusion/001-robot-concepts/`.

The RD Mini 16x16 robot test matched the constrained palette but read as a hooded farmhand rather than a robot. The Fast and Plus P0 sheets produced useful trees/props/effects, but both missed key named assets. Do not escalate the full sheet to Pro. The selected robot direction is now an android recolor derived from the Kenney farmer so human/robot parity is visible in the shared silhouette.

The focused Plus turnip sheet produced a usable seed/stage/harvest sequence, normalized to native 16x16 candidates. It remains outside the runtime catalog until RetroDiffusion generated-output redistribution rights are verified.

## Kenney Coverage and True Gaps

### Already Covered and Imported

Do not generate replacements for these unless browser integration proves a specific defect:

| Family | Current coverage |
| --- | --- |
| Seeds | Generic seed bag icon (`item.turnip_seeds`) is usable |
| Crop lifecycle | Four coherent generic green-crop stages exist, but they are placeholders rather than recognizable turnips |
| Harvested crop | Root-produce icon exists but reads as potato; it is a turnip placeholder |
| Soil | Dry tilled and wet tilled tiles |
| Common tools | Hoe, watering can, shovel, sickle |
| Storage/furniture | Chest, crates, two bed colorways |
| Environment | Grass variants, trees, rock, fences, wall, roof, door, sign |
| Human baseline | South-facing farmer/farmhand silhouettes |

### Highest-Priority Missing Assets

1. **Shared actor frame contract:** north/east/west plus movement/work frames for human and android. The accepted android south frame is a recolor of the human south frame so both actors communicate equivalent capability.
2. **Actual turnip lifecycle:** turnip seed presentation, stages 0-3, and harvested white/purple turnip. Current generic green crop/potato-like root are placeholders.
3. **Water/shore autotiles:** complete connective pond/lake family for the larger map.
4. **Unambiguous default item icons:** axe and stack of logs. Existing CC0 candidates are ambiguous; manual drawing or targeted low-cost generation is acceptable.
5. **Spatial-sleep identity:** robot charging dock/bed matching the accepted android, while the player reuses Kenney bed tiles.
6. **World-state/action feedback:** open chest, damaged tree, stump, destination, invalid target, axe chips, watering splash, planting puff, harvest sparkle, portal cue.

### Lower Priority Because Kenney Composition Is Sufficient

- Generic farmhouse walls/roof/door/fences/signs.
- Basic market/shipping props; compose crates/sign/door first.
- Decorative vegetation and animals.
- Additional crop families before gameplay defines them.

## Production Rules

1. The production tile standard remains native **16x16**.
2. A larger size is allowed only when the object intentionally spans tiles or an animation model has a fixed native frame contract.
3. Use Kenney Tiny Farm/Tiny Town CC0 frames before generating equivalent generic assets.
4. Use one generation per deliverable contract: static collection, character animation sheet, Wang tileset, or VFX sheet.
5. Pass the saved Kenney mosaic as a reference image when the selected style supports references.
6. Fixed animation styles that do not support references must use explicit palette/material language, followed by palette conversion and manual cleanup.
7. Estimate every paid request. Do not exceed the current $4.33 remainder without user approval.
8. Save request, full response metadata, every output, contact sheet, notes, seed, and reported cost.
9. Generated output is source material. Extract, align, clean, and test frames before adding them to the runtime catalog.
10. Never generate a sheet merely to fill space. Every requested cell must map to a named runtime frame or an explicit variant comparison.

## P0 - Release-Blocking Assets

These assets remove current procedural placeholders or unlock the planned map/camera/bed loop.

| Order | Deliverable | Native contract | Need | Source/strategy | Estimated generation cost |
| --- | --- | --- | --- | --- | ---: |
| 1 | Android farmhand directional/action contract | Same proportions and frame layout as human farmhand; south candidate is native 16x16 | Communicates equal capability through a human-imitation silhouette | Extend the accepted Kenney-farmer recolor manually first; use fixed animation only when it preserves the silhouette | $0-$0.07 |
| 2 | P0 static completion | Individual 16x16 frames and small coherent sheets | Axe, logs, charging dock, destination marker, invalid target, action effects, open chest, damaged tree, stump | Reuse Kenney and manual edits first; extract accepted Fast/Plus cells; no whole-sheet Pro escalation | $0 additional by default |
| 3 | Water/grass autotile sheet | 16x16 Wang-style tile contract | Larger farm needs a pond/lake with correct shore combinations | `rd_tile__tileset`; palette-convert toward Kenney greens/teals if needed | $0.10 |
| 4 | Player directional movement sheet | Fixed four-direction walking/idle contract | Current player has one south-facing static Kenney frame | First test whether existing Kenney farmhand can be manually extended; otherwise one animation job | $0.07 if generated |
| 5 | Item icon completion | Six 16x16 icons: axe, hoe, watering can, seeds, turnip, logs | Hotbar/storage/market cannot become icon-first until all default items resolve | Reuse Kenney for five; extract axe/logs from P0 static sheet | Included above |
| 6 | Bed/dock set | 16x16/16x32 furniture frames | Spatial sleep needs player bed and robot charging dock | Reuse Kenney bed halves; dock from P0 static sheet | Included above |
| 7 | Required world-state variants | Tree full/damaged/stump, chest closed/open, crop 0-3, dry/wet soil | Human inspection and action feedback must be visible without text | Reuse Kenney where available; complete from static sheet | Included above |

**P0 projected additional spend:** $0.10-$0.24 for water plus optional actor animation contracts. Generic static items default to CC0/manual extraction rather than more full-sheet generation.

### P0 Acceptance

- Player and robot are visually distinct, directional, and aligned to tile feet.
- Every default inventory item has a readable icon at 16x16 and hotbar scale.
- Water tiles connect without visible seams in a 5x5 pond test.
- Tree damage, chest open state, crop stage, and wet soil are distinguishable without labels.
- Destination/invalid/action effects remain readable over grass, soil, path, and water.
- No required runtime entity falls back to a procedural rectangle.

## P1 - High-Value Interaction Polish

These assets make completed systems feel like a game after P0 establishes the visual language.

| Order | Deliverable | Contract | Strategy | Budget gate |
| --- | --- | --- | --- | --- |
| 1 | Robot work actions | Axe, hoe, water, plant, harvest; 4-6 frames each, initially south/east mirrored only when visually safe | Animate selected cleaned robot base with custom-action/advanced animation; generate one action at a time only after estimate | Stop if combined estimate exceeds $1.00 |
| 2 | Player work actions | Same action vocabulary and timing as robot | Extend selected player base; reuse tool/effect frames | Stop if combined estimate exceeds $1.00 |
| 3 | Robot idle/charging details | Idle blink/antenna, charging pulse, sleep/off state | Small loop or manual frame edits from base | Prefer manual/free edits |
| 4 | Tool/world VFX sheet | Leaves/chips, splash, soil puff, seed drop, harvest sparkle, transaction glint | Dedicated VFX sheet/animation; reuse P0 static cues as first frames | Estimate before generation |
| 5 | Farmhouse/market composition props | Windows, porch, mailbox/shipping box, awning, counter, sign variants | Compose Kenney tiles first; generate only identity props missing from CC0 base | Prefer $0 |
| 6 | Inventory/market presentation icons | Coin, buy/sell indicators, quantity controls, category markers | Reuse catalog and familiar UI symbols; generate only if a coherent sheet is cheaper | Prefer $0 |
| 7 | Object Inspector mini portraits | Player and robot portraits | Derive from gameplay sprites or one paired portrait sheet | Optional until gameplay sprites are final |

### P1 Acceptance

- Every farming verb has anticipation/contact/result feedback.
- Work frames synchronize with deterministic cooldown phases rather than wall-clock-only animation.
- Effects do not obscure tile targeting or crop/tree state.
- Player and robot have equivalent visual feedback for equivalent actions.
- UI icons use the same palette and source catalog as world sprites.

## P2 - Lower-Priority Atmosphere

Do not spend generation budget here until P0/P1 are integrated and browser-tested.

| Asset family | Examples | Default strategy |
| --- | --- | --- |
| Environmental variety | Flowers, weeds, mushrooms, pond reeds, stepping stones, seasonal grass variants | Reuse Kenney CC0 tiles and recolor manually |
| Ambient animation | Water shimmer, tree sway, drifting leaves, chimney smoke | Manual two-frame loops or VFX only after map layout stabilizes |
| Decorative interiors | Rug, table clutter, wall art, plant pots, robot tools | Reuse/compose Kenney; generate one coherent interior sheet only if gaps remain |
| Animals | Chicken/cow idle and walk | Deferred gameplay; existing Kenney animals are enough for decoration prototypes |
| Portrait expressions | Player/robot happy, tired, busy, error | Generate after final character silhouettes and UI layout |
| Seasonal/weather art | Rain, snow, fall foliage, winter terrain | Deferred system; no current gameplay contract |
| Additional crops/items | New produce, seeds, tools, crafting resources | Deferred until item definitions exist |
| Marketing art | Store/banner image, Devpost hero, video title card | Separate full-scene generation after the in-game art direction is final |

## Recommended Spend Sequence

1. Integrate and validate the zero-cost south-facing android recolor.
2. Manually extend the shared human/android directional contract as far as practical from Kenney source frames.
3. Extract only accepted cells from Fast/Plus sheets; source generic axe/log icons from cleared CC0 or draw them manually.
4. **$0.10:** generate the water/grass autotile sheet when the larger authored map is ready for pond validation.
5. Estimate one fixed animation contract only after manual direction frames reveal the remaining gap.
6. Keep at least **$4.00** reserved until map/camera/bed integration shows which animations materially improve play.

No P1 paid generation should begin merely because balance remains.

## RetroDiffusion Workflow Notes

### Static Collections

Use a sheet style at 256x256 when the organized collection is itself the deliverable. Prompt the exact item count, layout, isolated subjects, scale, and no labels.

Escalation order:

1. RD Fast `item_sheet`: **$0.028**. Cheapest coherent sheet; no reference-image support.
2. RD Plus `item_sheet`: **$0.058**. Better prompt following/detail; no reference-image support.
3. RD Pro `spritesheet`: **$0.18**. Use only when the Kenney mosaic reference is needed to achieve palette/style consistency.

The same 16-item request makes Pro roughly 3.1x the Plus cost and 6.4x the Fast cost.

Observed result: Fast was useful as a broad concept shotgun but missed layout and identities; Plus improved layout but still missed key subjects. The P0 collection will not escalate wholesale to Pro. Reuse accepted cells and solve remaining generic items through CC0/manual edits.

### Isolated 16x16 Assets

Measured estimate for one axe:

| Model/style | Cost | Reference support | Role |
| --- | ---: | --- | --- |
| RD Fast `low_res` | $0.017 | No | First draft/default for simple missing icons |
| RD Mini `topdown_item` | $0.023 | No | Alternate low-resolution silhouette if Fast misses |
| RD Plus `topdown_item` | $0.023 | No | Same price as Mini; prefer when its style output is stronger |
| RD Pro `simple` | $0.18 | Yes | Only for reference-dependent/high-identity assets |

Pro is about 10.6x the Fast cost for this isolated icon.

### Model Selection Ladder

1. Existing cleared CC0 frame or manual edit: $0.
2. Specialized contract model (`tileset`, fixed animation, VFX): use when it solves consistency/layout directly.
3. RD Fast: default first paid trial for sheets and simple low-resolution assets.
4. RD Mini/Plus: use when their dedicated low-resolution/top-down styles better fit the asset or Fast fails acceptance.
5. RD Pro: use for identity-defining concepts, per-inference Kenney reference support, or documented cheaper-model failure.

Always compare native output, not model reputation. A cheaper output that needs extensive redraw may cost more in implementation time, but that judgment must be based on a saved result.

### Character Animation

Use fixed animation contracts for consistency rather than asking a general image style to imitate a sheet:

- `rd_animation__small_sprites`: 4 directions with walking, action/arm raise, look, surprise, and laying-down states; 32x32 contract.
- `rd_animation__four_angle_walking_idle`: 4-direction walk and idle; 48x48 contract.
- Advanced/custom action tools should start from the selected cleaned base image for hoe/axe/water actions.

The animation styles currently report no reference-image support for the small/four-angle contracts, so palette matching becomes a post-process/manual cleanup responsibility.

Estimated robot small-sprites cost: **$0.07**.

### Terrain

Use `rd_tile__tileset` for one complete Wang-style transition family. Use `tile_variation` only to derive variations from an accepted base tile. Do not independently generate shoreline corners/edges because they will not connect reliably.

Estimated water/grass tileset cost: **$0.10**.

### Style Matching

A custom RD Pro style creation was attempted using `assets/game/experiments/retrodiffusion/kenney-style-reference.png`, but the call returned no output and no user style appeared in the style catalog. Treat it as not created and no-cost.

For reference-capable styles, pass that mosaic per inference. For styles without references:

1. Specify dark plum outlines, warm cream/tan materials, soft Kenney green, muted teal, amber accents, minimal two-to-four-tone shading.
2. Apply palette conversion using a Kenney palette image.
3. Manually clean silhouettes and frame alignment.
4. Compare at native scale and 3x nearest-neighbor scale.

## Cost Ledger Link

See [../art-generation-log.md](../art-generation-log.md) for actual requests and running balance. Estimates are not charges.
