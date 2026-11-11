import { drills } from "../lib/mobility";

export const chevronColors = ["yellow", "green", "red", "gray"] as const;
export type ChevronColor = (typeof chevronColors)[number];
const chevronStrokes = [
  [
    "M3 6.4 Q4.9 6.8 6.5 9.3 Q8.2 12 11.7 15.3",
    "M10.3 14.6 Q12.7 12.5 14.5 9.2 Q16.1 6.4 19.8 5.3",
    "M3.6 7.8 Q5 8.6 6.1 10.6 Q7.7 13 9.8 14.8",
  ],
  [
    "M2.6 5.9 Q5.4 7.5 7.2 10.6 Q8.6 13.2 10.7 15.5",
    "M9.9 15 Q13 13.7 15.7 9.8 Q18 6.8 20 6.4",
    "M12.6 14.6 Q14.8 13 16.3 10.5 Q18.3 8 19.5 7.7",
  ],
  [
    "M3 6.9 Q5.2 7.1 7.5 10.2 Q9.6 13.2 12.4 15.1",
    "M11.1 15.3 Q12.4 13.8 14.4 10.4 Q16.8 6.4 19.3 5.6",
    "M4.1 8.3 Q6 9.1 7.5 11.5 Q8.8 13.3 10.8 14.6",
  ],
] as const;

function SketchChevron({ index, color }: { index: number; color: ChevronColor }) {
  const [left, right, retrace] = chevronStrokes[index % chevronStrokes.length];
  return (
    <svg className={"sketch-color--" + color}
      aria-hidden="true" width="19" height="19" viewBox="0 0 22 22" fill="none"
      stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d={left} strokeWidth="1.85" />
      <path d={right} strokeWidth="1.55" />
      <path d={retrace} strokeWidth=".8" opacity=".48" />
    </svg>
  );
}

export function openDrill(anchor: string) {
  const drill = document.getElementById(anchor);
  if (!(drill instanceof HTMLDetailsElement)) return;

  drill.open = true;
  drill.querySelector("summary")?.focus({ preventScroll: true });
  drill.scrollIntoView({ block: "start" });
}

export function MobilityPlan({ colors }: { colors: readonly ChevronColor[] }) {
  return (
    <section id="plan" className="plan-section" aria-label="Guide">
      <section className="drill-list" aria-label="Drill instructions">
        {drills.map((drill, index) => (
          <details key={drill.id} id={drill.id}>
            <summary>
              <span className="drill-number">{index + 1}</span>
              <span className="drill-heading">
                <span>{drill.name}</span>
                <span className="muted small">{drill.dose}</span>
              </span>
              <SketchChevron index={index} color={colors[index % colors.length]} />
            </summary>
            <div className="drill-body">
              <p>{drill.text}</p>
              <a href={drill.source} target="_blank" rel="noreferrer">Exercise reference ↗</a>
            </div>
          </details>
        ))}
      </section>
    </section>
  );
}
