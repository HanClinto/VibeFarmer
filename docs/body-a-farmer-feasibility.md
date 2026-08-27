# Body_A Farmer Animation Feasibility

Investigation date: 2026-08-27

## Decision

Creating a farmer version of the complete `Body_A` animation set is feasible with a hybrid Pixen and Aseprite batch workflow. It does not require hand-authoring clothing templates or 42 independent animation generations.

Use cheap single-frame Pixen edits to establish the farmer design for each viewing direction. Place the approved reference and related Body_A poses into a bounded contact sheet, then use one Pixen edit to propagate the outfit across the sheet. Aseprite supplies ordered frame exports and timing metadata; deterministic post-processing splits the result, restores anchors, and recompiles sheets. PixelLab Pro reference batches remain a supported fallback for sheets Pixen mishandles.

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

- `scripts/generate-body-a-farmer-slice.zsh` exports six compact 64x64 inputs from Aseprite.
- A one-generation Pixen edit creates the side-facing farmer appearance reference.
- One Pixen contact-sheet edit applies that appearance to all six source poses in a single generation.
- A six-frame PixelLab Pro reference edit was also tested as the higher-cost fallback.
- The script aligns each result to its original foot row and compiles the normalized horizontal sheet.
- Outputs remain ignored under `assets/game/experiments/body-a-farmer-slice/`.
- All six frames retain their original 100 ms duration and 64x64 cells.
- The generated hat is approximately 28 pixels wide and reads clearly as a farmer hat.
- The Pixen sheet output requires zero- or one-pixel vertical corrections; automatic normalization restores every source foot row.

An earlier procedural Aseprite recolor was rejected because its tiny hat and rough clothing segmentation were not usable. Both PixelLab batches are substantially better, but the one-generation Pixen contact sheet is the strongest cost/quality result: it keeps the six distinct walk poses, produces a coherent outfit, and requires no hand-drawn clothing mask. Native-scale review is still required for occasional limb or occlusion defects.

Run the slice with:

```sh
zsh scripts/generate-body-a-farmer-slice.zsh
```

Set `ASEPRITE_BIN` to override the default Steam installation path.

## Generator Findings

### PixelLab

PixelLab provides two complementary edit paths:

- `edit_image_pixen` edits one frame for one generation. It is suitable for creating the side, down, and up farmer design references.
- Pro `edit_image` accepts up to 16 text-edited 64x64 frames, or 15 frames when using an appearance reference. It applies one edit consistently across the batch while retaining the supplied poses. A complete four-, six-, or eight-frame directional sheet fits in one call.

Pixen officially accepts one image rather than a frame array. A 192x128 contact sheet containing six 64x64 cells was nevertheless successful when its prompt explicitly named the grid and used the approved farmer as its top-left cell. It preserved all cell boundaries, produced six consistent farmers, required only zero- or one-pixel anchor corrections, and cost one generation. A 4x4 sheet of 16 frames fits Pixen's 256x256 limits but has not yet been validated.

The same side-walk was also processed through a supported six-frame Pro reference batch for approximately 20 generations. Its animation is coherent, but its frames require three- to five-pixel anchor corrections. Use Pro when a Pixen sheet fails, not as the default.

The current PixelLab trial contains 40 generations. This investigation used 23, leaving 17.

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

Use compact, cell-aligned contact sheets for Pixen's low-cost first pass. Keep each logical frame in a 64x64 cell, include an approved direction reference in the first cell, state the exact grid in the prompt, and split the returned image on the same boundaries. Use separate frame arrays with Pro when the contact-sheet edit merges cells, changes poses, or drifts visually.

1. Create one approved Pixen farmer reference for side, down, and up.
2. Export original Body_A frames as separate 64x64 PNGs while retaining Aseprite timing metadata.
3. Pack related frames into a contact sheet, with the approved reference as its first cell, and submit one Pixen edit.
4. Normalize returned frames to their source foot anchors and verify that no opaque pixels wrapped or touched a canvas edge.
5. Compile one review sheet per family with down, up, and side as three rows and up to eight frame columns.
6. Rerun failed groups through Pro as separate frame arrays, then pack approved sheets into one runtime atlas with Aseprite JSON metadata.

Family-aware packing requires approximately 25 Pixen sheet calls: three calls for the three four-frame families, eight calls for the four six-frame families, and fourteen calls for the seven eight-frame families. With three direction references, a clean first pass is approximately 28 PixelLab generations. Packing 16 cells per sheet could theoretically reduce this to 18 sheet calls plus references, but the 16-cell layout must be validated before relying on that estimate. Pro retries cost approximately 20 generations per batch.

## Production Estimate

A generator-assisted production pass no longer requires an experienced pixel artist, but it still requires review and selective reruns:

- Three Pixen calls establish side, down, and up references.
- Approximately 25 one-generation Pixen sheet calls cover all 276 frames in family-aware batches.
- Aseprite and ImageMagick automate export, anchor normalization, review sheets, and final packing.
- Human work is selection and quality control: reject malformed hands, missing limbs, hat drift, tool occlusion, and palette changes, then rerun only affected batches through Pixen or Pro.

The estimate assumes the farmer stays close to the successful broad-hat, shirt, overalls, and boots reference. A long coat, large backpack, complex hair, or asymmetric equipment would increase pose drift and rerun frequency.

## Recommended Next Slice

Before scaling to all 42 sheets, create down/up Pixen references and process the three-direction idle family as one 12-cell sheet. Then process watering to test an eight-frame tool interaction. If both pass native-scale review and anchor checks, the remaining families are primarily production volume rather than an unresolved technical risk.