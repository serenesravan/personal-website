# Workout animation generator

This small local app uses the tldraw SDK to export one start and one end pose
for every workout, then stitches the resulting frames into a single independent
640×640 looping GIF. Figures use only medium black stick lines, circles, and
blue equipment. The website only serves the finished GIF, so tldraw is never
part of the visitor-facing bundle.

## Regenerate the assets

1. Run `npm install` in this directory.
2. Run `npm run dev`.
3. Open the displayed local URL and wait for the status to say `Done`.

Frames are written to `assets/workouts/frames/workout-cycle/`; the final GIF is
written to `assets/workouts/workout-cycle.gif`.

## Add a workout

Add one entry to the `workouts` array in `src/main.jsx` with two poses. Each pose
defines a head circle, connected stick lines, joint circles, and optional blue
equipment. The generator automatically appends both poses to the shared loop.
