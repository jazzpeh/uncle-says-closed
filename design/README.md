# Design

The approved direction for Uncle Says Closed, and the throwaway prototype that proves it. The app in `src/` still has the old list/cards look; it gets rebuilt from this once the design is signed off.

## Links

Both are private to the repo owner.

- Playable prototype: https://claude.ai/artifact/A3xpXizGkpxnKZTcL8PC41
- Design canvas (round 1 options, logo concepts, mood board, final screens): https://claude.ai/artifact/4CvkHsJbG8dPtmHuKWVaYM

## Run the prototype locally

```sh
npm run proto          # writes design/prototype/out/data.js and uncle-says-closed.html
npm run proto:photos   # downloads the 123 NEA photos into out/photos (resized with sips on macOS)
open design/prototype/out/preview.html
```

`out/` is gitignored. Photos stay out of git because the licence for the images themselves is unverified; the closures CSV only links to them.

To republish the artifact, publish `out/uncle-says-closed.html` with `out/photos/*.jpg` as supporting files at `photos/<id>.jpg`.

## Where things are

- `prototype/page.html` is the whole prototype: tokens, components, placard text, cast, spinner and state. `build.py` inlines the data and logo.
- `prototype/make-data.ts` runs the real domain code (`scripts/parse.ts`, `src/domain/*`) over the fixture for 20 Oct and 7 Dec.
- `brand/` holds the four logo concepts. Peekaboo Shutter is the pick; Half-Shut reads best at 16px.
- `decisions.tsv` is the decision log, one row per call.

## Design rules

- Flat colour. Chilli `#E23B2E` (text-safe `#D22A1D`) means closed and nothing else. Pandan `#1F8A5B` (`#1C7E53`) is open and the primary action. Kaya `#F6C343` is closing soon, "Go here" and the floating button. Slate `#6A6F78` is unknown. Cream `#FFF4E0` ground, ink `#1E1B18` text. Teh, peranakan and sakura are accents only.
- Plus Jakarta Sans for UI. Bungee only on placards and the wordmark. Ma Shan Zheng only for Chinese. Noto Sans Tamil for Tamil. Gochi Hand only on the taped note.
- Placards carry all four official languages, English largest. The strings live in `PLACARD_TEXT` and need a native speaker before launch.
- The cast rotates per centre: a Chinese uncle, a Malay makcik, an Indian uncle and a younger auntie. No government logos, and nothing implies halal status.
- Home answers without scrolling: uncle headline with tappable counts, "Find makan near me", search, at most six tiles, "See all". "Eat where ah?" is the floating button.
- Tiles are each centre's real NEA photo as a taped polaroid. Closed goes black and white with the placard stamped across; closing soon is faded with a kaya stamp; open is full colour.

## Open items

- Owner: more distinctive layouts were requested after the polaroid wall. Next sketches are a swipe deck, kopitiam shelves (horizontal rails by status), and a stall row with lit signboards over roller shutters, behind a layout switch in the demo bar.
- Owner: approve the design and the logo.
- Native speaker check of the Malay, Chinese and Tamil placard strings.
- Confirm the photo licence, or hotlink `nea.gov.sg` (it sends `cross-origin-resource-policy: cross-origin`) with an NEA credit.
- Create a local `.env` with `DATA_GOV_SG_API_KEY` to verify the `x-api-key` header name.
- Confirm GitHub Pages source is "GitHub Actions" before the first deploy.
- After approval: codify as a Design System artifact, rebuild `src/` from it, update e2e, run an accessibility and Lighthouse pass, then a persona usability test.
