# Personal Website

A simple static personal website built with plain HTML, CSS, and JavaScript.

## Files

- `index.html` contains the page structure and content.
- `styles.css` contains the visual styling.
- `script.js` swaps visible pages from the navigation links.
- `assets/profile-placeholder.png` is a temporary profile image.
- `assets/resume.pdf` is a temporary resume PDF used by the download link.

## Customize

1. Replace `Your Name`, the lorem ipsum text, education details, work details, and footer links in `index.html`.
2. Replace `assets/profile-placeholder.png` with your own image, or update the `src` in `index.html` to point to your photo.
3. Replace `assets/resume.pdf` with your real resume PDF, keeping the same filename if you want the existing download link to work unchanged.

## Hosting

Upload these files to the web hosting attached to your GoDaddy domain. Because this is a static site, no server-side runtime or build step is needed.

## Life Atlas

Life Atlas is hosted separately on Cloudflare Pages. Its iframe has only a
`data-src` in the initial HTML; `script.js` assigns the real `src` when the
visitor opens `#life-atlas`. This keeps the Three.js bundle, map data, and atlas
JSON out of the personal website's normal page load.

The current Cloudflare origin is `https://life-atlas.pages.dev/`. If the Pages
project or custom domain changes, update the `data-src` on `#life-atlas-frame`
in `index.html`.

## Crossfit animations

The Crossfit page shows one continuously looping workout cycle beside the stats
on desktop. Its ten frames cover the start and end positions for Back Squat,
Deadlift, Bench Press, Pull Ups, and Push Ups. The animation is independent of
the selected workout and lives at `assets/workouts/workout-cycle.gif`.

The editable tldraw SDK generator is in `tools/workout-animations/`. See its
README for regeneration steps and the workflow for adding another movement.
