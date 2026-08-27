# Body_A Farmer Animation Feasibility

Investigation date: 2026-08-27

## Decision

Creating a farmer version of the complete `Body_A` animation set is feasible, but it should be treated as an Aseprite clothing-layer and cleanup project rather than 42 independent AI generations.

The source motion, frame timing, 64x64 cell, and foot placement are already correct. Preserving those properties and adding farmer clothing is both more reliable and less expensive than asking a generator to recreate every animation. Pixel-art generators remain useful for outfit concepts and difficult pose references.

Do not promote the result into tracked runtime assets until redistribution of Pixel Crawler derivatives in the public repository is explicitly approved. Keep generated outputs experimental until their output rights are also confirmed.

## Source Inventory

`Body_A` contains 14 animation families with down, up, and side exports: 42 directional sheets and 276 frames total.

| Contract | Families | Directional sheets | Frames per sheet | Total frames |
| --- | ---: | ---: | ---: | ---: |
| Four-frame | Idle, carry idle, hit | 9 | 4 | 36 |
| Six-frame | Walk, run, carry walk, carry run | 12 | 6 | 72 |
| Eight-frame | Watering, collect, crush, death, fishing, pierce, slice | 21 | 8 | 168 |
| Total | 14 | 42 | - | 276 |

Left-facing runtime frames can mirror the side sheets unless a held tool, handed pose, or asymmetric outfit makes mirroring visibly incorrect.

The source `.aseprite` documents are layered, but layer names and anatomy separation are inconsistent. Representative names include `Head`, `Chest`, `Legs`, `Arm_Back`, `Corpo`, `Cabeca`, and generic `Layer 1` through `Layer 7`. The side-walk source has six 64x64 frames at 100 ms each and no animation tags.

## Vertical Slice

The focused slice converts `Walk_Side.aseprite` into a farmer side-walk cycle:

- `scripts/aseprite/body-a-farmer-slice.lua` opens the source and adds a separate `Farmer Outfit` layer.
- `scripts/generate-body-a-farmer-slice.zsh` runs Aseprite headlessly and compiles PNG and JSON review outputs.
- Outputs remain ignored under `assets/game/experiments/body-a-farmer-slice/`.
- All six frames retain their original 100 ms duration and 64x64 cells.
- Horizontal opaque bounds and foot positions are unchanged.
- The straw hat expands each frame upward by three pixels without changing its anchor.

The treatment is intentionally procedural and rough. It demonstrates that exact source motion can be retained and batched, but production clothing masks must account for anatomy and depth. Sleeves, hands, trouser legs, and held tools need family-specific cleanup rather than a single global recolor rule.

Run the slice with:

```sh
zsh scripts/generate-body-a-farmer-slice.zsh
```

Set `ASEPRITE_BIN` to override the default Steam installation path.

## Generator Findings

### PixelLab

PixelLab does not provide direct frame-by-frame style transfer for an existing animation sheet. Its character-state workflow can create an outfit variant, but it creates a new character and costs 20-40 generations. Character animation then uses template or v3 motion rather than preserving the supplied Body_A frames exactly.

Use PixelLab for a farmer outfit/identity concept or a fresh coherent character set, not for exact Body_A conversion.

### RetroDiffusion

The reference-aware `rd_animation__any_animation` contract accepts a 64x64 input but costs $0.25 for this slice. The advanced animation styles accept an exact starting frame and are less expensive for movement:

| Advanced contract | Frames | Estimate per directional sheet |
| --- | ---: | ---: |
| Idle | 4 | $0.14 |
| Walking | 6 | $0.14 |
| Custom action | 8 | $0.25 |

Generating all 42 directional sheets at those rates would cost approximately $8.19 before retries and manual cleanup. It would also replace the original motion instead of applying clothing to every existing pose.

One six-frame advanced walking job was commissioned for $0.14 to compare generated motion with the exact-pose Aseprite baseline. It returned a 192x128 sheet containing a 3x2 grid of 64x64 frames.

The generated result is useful but does not preserve the Body_A animation contract exactly:

- The hat, teal shirt, brown trousers, transparency, and general character identity remain recognizable.
- The model redraws the gait and limb proportions instead of transferring clothing onto the six source poses.
- Opaque frame bounds remain compact, but their top and baseline vary by about one pixel.
- The output needs repacking from a 3x2 grid before it can use the source's horizontal metadata contract.

Use this output as motion reference or as a candidate alternate walk cycle. Do not use the model as the bulk conversion path when exact Body_A parity is the goal.

## Batching Strategy

Batching is valuable at the authoring and export boundaries, not as one giant generator request.

1. Keep one editable farmer `.aseprite` document per source direction. Preserve frame durations and the 64x64 canvas.
2. Normalize source layer roles through a small manifest because layer names are inconsistent. Do not rely on names alone.
3. Build reusable clothing masks for headwear, torso, front/back arms, and front/back legs. Apply them to an animation family, then clean crossings and occlusion manually.
4. Compile one review sheet per family with down, up, and side as three rows and up to eight frame columns. A complete family stays at or below 512x192.
5. Run geometry checks over every frame: canvas size, frame count, duration, foot anchor, opaque bounds, palette, and unexpected pixels at the cell edge.
6. Pack approved sheets into one runtime atlas with Aseprite JSON metadata. Keep the editable documents and review sheets out of the runtime payload.

A giant all-animation sheet would contain more than one million source pixels and mix unrelated contracts. It is useful as a final packed runtime atlas, but inefficient as a generator input and awkward for art review.

## Production Estimate

A reasonable first production pass is 4-7 focused artist-days:

- 0.5-1 day to settle the farmer design, palette, and layer conventions.
- 1-2 days for idle, walk, run, and carry families across three directions.
- 2-3 days for tool/action families, where arms, props, and depth crossings require manual cleanup.
- 0.5-1 day for compiled sheets, automated geometry checks, native-scale review, and corrections.

The estimate assumes the farmer stays close to the Body_A silhouette. A long coat, large backpack, complex hair, or asymmetric equipment would increase occlusion work and make side mirroring less reusable.

## Recommended Next Slice

Before scaling to all 42 sheets, complete a three-direction set containing idle, walk, and watering. This tests the three key difficulty classes: subtle loop, locomotion, and an eight-frame tool interaction. If those nine sheets pass native-scale review and anchor checks, the remaining families are primarily production volume rather than an unresolved technical risk.