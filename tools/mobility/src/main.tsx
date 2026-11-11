import { createRoot, type Root } from "react-dom/client";
import { chevronColors } from "./app/mobility-plan";
import { MobilityTracker } from "./app/mobility-tracker";
import { sketchColors } from "./app/sketch-shapes";
import { shuffle } from "./lib/seeded-random";

const randomIndex = (limit: number) => Math.floor(Math.random() * limit);
const swipeColors = shuffle(sketchColors, randomIndex);
const guideColors = shuffle(chevronColors, randomIndex);
let root: Root | undefined;

export function renderMobility(container: HTMLElement, anchor: string) {
  root ??= createRoot(container);
  root.render(<MobilityTracker anchor={anchor} swipeColors={swipeColors} guideColors={guideColors} />);
}
