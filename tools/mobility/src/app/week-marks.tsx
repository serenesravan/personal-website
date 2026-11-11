import { seededRandom, shuffle } from "../lib/seeded-random";
import { SketchShape, sketchColors, sketchShapes } from "./sketch-shapes";

export function weeklyMarks(weekStart: string) {
  const next = seededRandom("week-marks:" + weekStart);
  // Give each shape and color two slots, then randomly pick the seventh.
  const weekShapes = shuffle([...sketchShapes, ...sketchShapes, sketchShapes[next(sketchShapes.length)]], next);
  const weekColors = shuffle([...sketchColors, ...sketchColors, sketchColors[next(sketchColors.length)]], next);
  return weekShapes.map((shape, index) => ({ shape, color: weekColors[index] }));
}

export function WeekMark({ shape, color, filled }: ReturnType<typeof weeklyMarks>[number] & { filled: boolean }) {
  return <SketchShape shape={shape} className={"week-mark sketch-color--" + color} filled={filled} />;
}
