# Third-Party Notices

## 98.css

Window and control styling loads [98.css](https://jdan.github.io/98.css/) version 0.1.20 from unpkg. 98.css is distributed under the MIT License.

## Needle 2 and needle-rs

The optional Local Agent downloads the [Needle 2](https://huggingface.co/Cactus-Compute/needle2) model from Cactus Compute after explicit user action. Needle 2 is distributed under the Apache License 2.0. The model remains in the browser cache and is not bundled in this repository.

Browser inference uses [needle-rs](https://github.com/Geekgineer/needle-rs) version 0.2.1. Its JavaScript and WebAssembly runtime are distributed under the MIT License and are copied from the pinned npm dependency into the deployment artifact.

## Downloaded Sprite References

The files under `assets/sprites/` and `assets/farm assets/` are local references from third-party asset packs. Several source licenses prohibit redistribution. These directories are not runtime dependencies and are excluded from version control.

The current runtime does not use these reference files. Its Canvas world and DOM inventory load only original or explicitly redistributable artwork from `assets/game/`.

## Kenney Runtime Art

The curated 16x16 runtime-art base under `assets/game/kenney/` comes from [Kenney Tiny Farm](https://kenney.nl/assets/tiny-farm), [Kenney Tiny Town](https://kenney.nl/assets/tiny-town), [Kenney Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon), [Kenney Tiny Battle](https://kenney.nl/assets/tiny-battle), and [Kenney Roguelike/RPG Pack](https://kenney.nl/assets/roguelike-rpg-pack). All five packs are dedicated to the public domain under Creative Commons Zero (CC0 1.0). Attribution is not required; source and frame provenance are retained in `assets/game/catalog.json` and `assets/game/README.md`.

## Kenney Source References

Official sheets, previews, samples, license copies, and generated labeled sheets under `assets/reference/kenney/` additionally include [Kenney Roguelike Indoors](https://kenney.nl/assets/roguelike-indoors) and [Kenney RPG Urban Pack](https://kenney.nl/assets/rpg-urban-pack). These packs are also CC0 1.0. Reference sheets are not runtime dependencies.