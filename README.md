# Vice City Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/muhamadyusufseptian6-lab/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/muhamadyusufseptian6-lab/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline cover-art maker in the style of a Vice City sunset poster: load your
own photos, arrange them in multi-panel layouts, add a bold caption, pick a
colour grade, and download the cover as a PNG to share.

## How to use

1. Double-click `app/index.html` — it opens in Chrome and works with no
   server, no install and no network. (It also works from any static server.)
2. Load a photo with the file picker, drop image files onto the preview, or
   press **Try a sample photo** to use one of the two built-in sample photos.
3. Pick a layout: Single hero, Hero + 3, 2-panel split, 3-panel strip, or
   4-panel grid. Click a panel to select it, then choose its photo, zoom and
   position — drag the photo right on the preview. One photo can fill several
   panels.
4. Edit the big title and the neon script line, and set their size, height
   and colour.
5. Pick a colour grade — Sunset, Neon Night, Golden Hour or Mono Noir — and
   its strength. The grade is drawn onto the cover, so the download carries it.
6. Press **Download 1080 x 1080**, **1080 x 1350** or **1920 x 1080**, or
   **Download all three sizes** to save every size at once.

Your layout, caption and grades are saved in the browser (localStorage), so
the cover is still there when you come back. Photos are never saved or
uploaded — they stay on your machine; load them again, or use the samples.

## What is inside

- `app/index.html` + `app/style.css` + `app/js/state.js` (settings, layouts,
  saved state) + `app/js/cover.js` (canvas renderer: panels, grades, caption)
  + `app/js/app.js` (editor wiring) — plain classic scripts, system fonts
  only, no libraries, no network requests.
- `app/samples/boulevard.jpg` and `app/samples/pier.jpg` — sample photos made
  with an image model for this kit, free to use.
- `main.ts` — copies `app/` and `screenshots/` to the output directory and
  writes `dossier.json` with the kit's `buildDossier`.
- `screenshots/` — 3 or 4 renders of the app at work (added by the maker).

Everything here is original: no Rockstar Games logo, artwork or font is used,
and the app is not affiliated with Rockstar Games.

## Try make.fun

Sign up with my referral code **515temp1** — https://make.fun/r/515temp1
