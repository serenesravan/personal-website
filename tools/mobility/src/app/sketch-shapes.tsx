import { circleFill, circleStroke, greyHatching, whiteHatching } from "./swipe-circle";

export const sketchShapes = ["circle", "triangle", "square"] as const;
export const sketchColors = ["blue", "green", "red"] as const;
export type SketchColor = (typeof sketchColors)[number];

const shapePaths = {
  triangle: {
    grayHatch: "M13.8 12.9 Q15.8 11.3 17.6 10.9 M10.9 17.9 Q15.5 15.6 19.9 15.1 M7.8 22.8 Q14.5 19.8 22.3 19.1 M12.1 24.9 Q18.1 22.7 24.4 22.8",
    whiteHatch: "M12.6 15.2 Q15.8 13.7 18.5 13 M9.3 20.7 Q14.1 18.6 21.1 17.2 M8.7 24.6 Q14.2 22.2 20.6 21.4",
    outline: "M15.1 5.1 Q16 3.1 17.1 5.2 C19.8 10.3 21.4 12.9 23.7 16.7 Q26.8 21.5 28.7 26.1 Q29.2 27.6 27.3 27.4 C23 27.3 18.7 26.4 14 27 Q8.5 27.7 3.6 26.9 Q2.3 26.7 3.3 25.1 C7.2 18.4 10.4 14.4 15.1 5.1 Z",
    retrace: "M5.4 23 Q7.9 17.7 11.4 13.7 M19.4 26.3 Q24.7 26.1 27.9 27.2",
  },
  square: {
    grayHatch: "M7.1 10 Q14.4 7.7 22.9 6.9 M7 15 Q16.4 12 25.7 11.6 M7.1 20 Q16.3 16.8 25.9 16.9 M7.2 25 Q16.5 21.9 25.5 21.7 M16.5 25.9 Q21.4 25 25.7 24.5",
    whiteHatch: "M7.7 12.3 Q15.3 9.7 24.7 9.1 M7.7 17.5 Q15.2 14.7 24.7 14.1 M7.8 22.2 Q16.4 19.6 24.5 19.4",
    outline: "M5.3 4.6 Q10.7 3.2 16.3 4.1 Q22.7 5 27.1 3.9 Q28.4 3.7 28.3 5.9 C27.7 12.2 29.3 15.6 28.3 21 Q27.9 24.3 28.4 27.3 Q24.9 29.3 19.4 28.2 C13.1 27.2 9.3 29.5 4.5 28.1 Q3.3 27.4 4 23.2 C5 17.1 2.9 12.6 4 7.5 Q4.4 5.7 5.3 4.6 Z",
    retrace: "M3.1 15.4 Q2.2 10.3 3.6 6.5 M22.4 29.4 Q26.6 29.9 28.3 27.7",
  },
};

function SketchCircle({ className, filled = true, hatched = false, calendarStroke = false }: {
  className?: string;
  filled?: boolean;
  hatched?: boolean;
  calendarStroke?: boolean;
}) {
  if (calendarStroke) {
    return (
      <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
        <path className="calendar-circle-outline" d={circleFill} fill={filled ? "currentColor" : "none"} />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      {filled && <path className="sketch-shape-fill" d={circleFill} fill="currentColor" />}
      {hatched && (
        <g className="swipe-hatching">
          <path d={greyHatching} fill="#c5c7ce" />
          <path d={whiteHatching} fill="currentColor" />
        </g>
      )}
      <path d={circleStroke} fill="currentColor" />
    </svg>
  );
}

export function SketchShape({ shape = "circle", className, filled = true, hatched = false, calendarStroke = false }: {
  shape?: (typeof sketchShapes)[number];
  className?: string;
  filled?: boolean;
  hatched?: boolean;
  calendarStroke?: boolean;
}) {
  if (shape === "circle") return <SketchCircle className={className} filled={filled} hatched={hatched} calendarStroke={calendarStroke} />;

  const { outline, retrace, grayHatch, whiteHatch } = shapePaths[shape];
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true"
      fill="none" strokeLinecap="round" strokeLinejoin="round">
      {filled && <path className="sketch-shape-fill" d={outline} fill="currentColor" />}
      {hatched && (
        <g className="swipe-hatching">
          <path d={grayHatch} stroke="#c5c7ce" strokeWidth="1.5" />
          <path d={whiteHatch} stroke="currentColor" strokeWidth="1" />
        </g>
      )}
      <path d={outline} stroke="currentColor" strokeWidth="2.9" />
      <path d={retrace} stroke="currentColor" strokeWidth=".9" opacity=".6" />
    </svg>
  );
}
