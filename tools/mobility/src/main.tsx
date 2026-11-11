import { createRoot } from "react-dom/client";
import { chevronColors } from "./app/mobility-plan";
import { MobilityTracker } from "./app/mobility-tracker";
import { sketchColors } from "./app/sketch-shapes";
import { shuffle } from "./lib/seeded-random";
import { deviceDay } from "./lib/tracker";

const randomIndex = (limit: number) => Math.floor(Math.random() * limit);

createRoot(document.getElementById("mobility-root")!).render(
  <MobilityTracker
    initialToday={deviceDay()}
    swipeColors={shuffle(sketchColors, randomIndex)}
    guideColors={shuffle(chevronColors, randomIndex)}
  />,
);
