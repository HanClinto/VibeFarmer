# Body_A Farmer Animation Feasibility

Investigation date: 2026-08-27

## Decision

Creating a farmer version of the complete `Body_A` animation set is feasible with a hybrid Pixen and Aseprite batch workflow. It does not require hand-authoring clothing templates or 42 independent animation generations.

Use cheap single-frame Pixen edits to establish the farmer design for each viewing direction. Submit original Body_A poses as individual images through PixelLab Pro's reference-edit API, with the approved farmer supplied through its separate reference-image field. Aseprite supplies ordered frame exports and timing metadata; deterministic post-processing restores anchors and recompiles sheets. Near-maximum montage images containing only the base or generated frames support organization and review; they are not model inputs.

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

The focused slice converted `Walk_Side.aseprite` into a farmer side-walk cycle:

- The archived artifacts now live under `assets/game/experiments/farmer_animated/archive/vertical-slice/`.
- A one-generation Pixen edit creates the side-facing farmer appearance reference.
- One Pixen contact-sheet edit applies that appearance to all six source poses in a single generation.
- A six-frame PixelLab Pro reference edit applies the same appearance through the supported multi-image API.
- The script aligns each result to its original foot row and compiles the normalized horizontal sheet.
- Outputs remain ignored under `assets/game/experiments/farmer_animated/`.
- All six frames retain their original 100 ms duration and 64x64 cells.
- The generated hat is approximately 28 pixels wide and reads clearly as a farmer hat.
- The Pixen sheet output requires zero- or one-pixel vertical corrections; automatic normalization restores every source foot row.

An earlier procedural Aseprite recolor was rejected because its tiny hat and rough clothing segmentation were not usable. Both PixelLab experiments were substantially better and require no hand-drawn clothing mask. PixelLab's documentation does not support contact-sheet pseudo-batching, however, so production should use Pro's individual-frame array with a separately supplied reference image. Native-scale review remains required for occasional limb or occlusion defects.

Build the organized action packages with:

```sh
node assets/game/experiments/farmer_animated/build-action-packages.mjs
```

Set `ASEPRITE_BIN` to override the default Steam installation path.

## Generator Findings

### PixelLab

PixelLab provides two complementary edit paths:

- `edit_image_pixen` edits one frame for one generation. It is suitable for creating the side, down, and up farmer design references.
- Pro `edit_image` accepts up to 16 text-edited 64x64 frames, or 15 frames when using an appearance reference. It applies one edit consistently across the batch while retaining the supplied poses. A complete four-, six-, or eight-frame directional sheet fits in one call.

Pixen officially accepts one image rather than a frame array. A 192x128 contact-sheet experiment happened to preserve six cells and produced a coherent farmer cycle, but PixelLab explicitly warns that grid inputs can cause cell bleeding, identity drift, and inconsistent shading. Treat it as an interesting experiment rather than the production contract.

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

Use PixelLab Pro's supported multi-image reference edit for production. Each call receives individual 64x64 target frames and one separately supplied direction reference. API request boundaries are internal metadata and must not determine the visual review layout.

1. Create one approved Pixen farmer reference for side, down, and up.
2. Export original Body_A frames as separate 64x64 PNGs while retaining Aseprite timing metadata.
3. Submit related frames through Pro `edit_image` as individual images, with the direction reference in the separate reference-image field.
4. Normalize returned frames to their source foot anchors and verify that no opaque pixels wrapped or touched a canvas edge.
5. Compile action-oriented 4x4 review pages: rows are down, left, right, up; columns are four consecutive frames. Six- and eight-frame actions use a second page.
6. Rerun failed Pro batches selectively, then pack approved sheets into one runtime atlas with Aseprite JSON metadata.

The external-generator package contains 25 review pages across 14 actions. Every page is a 256x256 PNG with sixteen 64x64 cells, plus a matching prompt and one separate 256x64 farmer direction reference. These montages can be tested with Grok, ChatGPT, or other image editors, but PixelLab Pro should receive the underlying individual frames rather than the montage.

## Production Estimate

A generator-assisted production pass no longer requires an experienced pixel artist, but it still requires review and selective reruns:

- Three Pixen calls establish side, down, and up references.
- Pro reference-edit calls process the 276 source frames in consistency-aware arrays.
- Aseprite and ImageMagick automate export, anchor normalization, review sheets, and final packing.
- Human work is selection and quality control: reject malformed hands, missing limbs, hat drift, tool occlusion, and palette changes, then rerun only affected Pro batches.

The estimate assumes the farmer stays close to the successful broad-hat, shirt, overalls, and boots reference. A long coat, large backpack, complex hair, or asymmetric equipment would increase pose drift and rerun frequency.

## Recommended Next Slice

Test the generated Idle and Watering packages with at least two external image editors. Compare their grid fidelity and consistency against PixelLab Pro before committing the full generation budget. Idle tests a complete one-page loop; Watering tests two full pages and tool occlusion.