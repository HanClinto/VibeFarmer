# Experiment 005 Notes

- Style: RD Plus `item_sheet`
- Native sheet size: 256x256
- Seed: 62013
- Cost: $0.058
- Purpose: shotgun generation of two complete turnip lifecycle variants
- Output 01: background-removed request return
- Output 02: original-background return

The model returned a 4x3 collection rather than two 6-cell rows, but the focused subject produced enough coherent candidates to select:

- seed bag: component 00
- stage 0: component 05
- stage 1: component 04
- stage 2: component 07
- mature stage 3: component 03
- harvested turnip: component 08

All first-pass grid crops, connected-component crops, review sheets, and normalized frames are preserved. Selected frames were trimmed, nearest-neighbor resized to fit within 14x14, and centered on transparent 16x16 canvases under `normalized/`.

Decision: visually accepted as production candidates. Do not add to the runtime catalog until generated-output ownership and public redistribution rights are verified from RetroDiffusion's terms.
