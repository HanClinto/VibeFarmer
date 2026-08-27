# Charging Station Concept Experiment

Experiment date: 2026-08-27

## Purpose

Explore a readable 32x32 world sprite for a placeable robot charging station that stores 40-50 stamina and transfers enough energy to top up the robot. The desired visual metaphor is a solar-powered gas pump or compact battery cabinet with visible charge state.

No candidate is promoted to the runtime catalog. These files are design experiments only and are excluded from the production site by `scripts/build-site.mjs`.

## PixelLab

- Model: Pixen
- Seed: 18427
- Cost: 1 generation
- Output: `pixellab-pixen.png`
- Result: cleanest small battery-cabinet silhouette and readable front controls. The blue top panel is visible, but the overall form reads more like a compact appliance than a farm charging pump.

## RetroDiffusion

- Model/style: RD Fast `rd_fast__low_res`
- Seed: 18427
- Cost: $0.067 for four candidates
- Outputs: `retrodiffusion-00.png` through `retrodiffusion-03.png`
- Comparison: `retrodiffusion-candidates.png`
- Result: candidates 00 and 01 communicate a solar charging pump most clearly. Candidate 00 has the strongest panel, socket, gauge, cable, and cream/teal farm-machine identity. Candidate 02 reads as a cabinet or heater. Candidate 03 reads as a small kiosk.

## Current Preference

Use RetroDiffusion candidate 00 as the strongest composition reference, but do not promote it directly. A production pass should simplify its silhouette, remove or shorten the loose cable, align its palette to the existing android farmhand, and derive charge-state variants from one accepted base composition.

Recommended state family:

1. Full: three bright teal/green bars and amber status light.
2. Medium: two bars.
3. Low: one amber bar.
4. Empty: dark gauge and muted status light.

Generate or edit the state family from one base image so shape, panel, and shadows remain identical. Independent generations will not preserve state consistency.
