"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Check, Info } from "lucide-react";
import { deviceDay, formatDay, monday, monthCells, shiftDay, shiftMonth, trackerStats, WEEKLY_GOAL } from "../lib/tracker";
import { checkInsKey, loadCheckIns, updateCheckIns } from "../lib/check-ins";
import { dailyDrills, isDrillAnchor } from "../lib/mobility";
import { seededRandom } from "../lib/seeded-random";
import { CheckInImport } from "./check-in-import";
import { MobilityPlan, openDrill, type ChevronColor } from "./mobility-plan";
import { SwipeCheckIn } from "./swipe-check-in";
import { SketchShape, sketchColors, type SketchColor } from "./sketch-shapes";
import { streakDigitPaths } from "./streak-digits";
import { WeekMark, weeklyMarks } from "./week-marks";

const longDate = { weekday: "long", day: "numeric", month: "long" } as const;
const monthDate = { month: "long", year: "numeric" } as const;
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const calendarColors = [...sketchColors, "yellow"] as const;

const navigation = [
  { id: "today", label: "Today" },
  { id: "activity", label: "Activity" },
  { id: "plan", label: "Guide" },
] as const;
type View = (typeof navigation)[number]["id"];

const monthButtonSymbols = {
  previous: "M30.2 21.5 C26.4 22.8 23.2 21.2 20.4 22 Q17.2 22.6 13.7 22.3 M20.9 15.9 Q17.5 19.8 13.7 22.3 Q17.9 24.7 20.3 28.4",
  next: "M13.8 22.7 C17.3 21.8 21 23 24.6 21.9 Q27.4 21.1 30.1 21.5 M23.3 15.7 Q26.4 19.2 30.1 21.5 Q26.5 24.3 23.8 27.8",
  mark: "M13.6 22.3 Q16.8 24.3 19.5 28.4 Q22.2 25.6 24.6 21.6 Q27.6 17 30.7 15.8",
  remove: "M15.6 15.6 Q21.1 20.6 24 24.1 Q26.2 26.8 28.6 28.6 M28.7 15.4 Q25.9 18.7 22 21.8 Q18.4 25.2 15.8 28.7",
};

function MonthButtonIcon({ kind }: { kind: keyof typeof monthButtonSymbols }) {
  const fillId = useId();
  const previous = kind === "previous";
  const color = kind === "mark" ? "sketch-color--green" : kind === "remove" ? "sketch-color--red" : undefined;
  return (
    <svg className={color && `month-button-action-icon ${color}`} viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
      {color && (
        <defs>
          <linearGradient id={fillId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity=".08" />
            <stop offset="100%" stopColor="currentColor" stopOpacity=".24" />
          </linearGradient>
        </defs>
      )}
      <path
        className="month-button-border"
        fill={color ? `url(#${fillId})` : "var(--paper)"}
        d={previous
          ? "M5.3 4.8 C13 1.9 20.4 4.3 26 3.6 Q35 2.4 39.1 3.5 Q40.8 3.9 40.7 7 C40.1 16.2 42.6 22 40.6 31.3 Q40 35.8 40.8 39.8 Q37.3 41.9 27.7 40.5 C20.1 39.5 12 42.6 4.2 40.3 Q2.4 38.7 3.7 29.8 C4.5 22.2 1.7 14.3 3.4 7.7 Q3.8 5.8 5.3 4.8 Z"
          : "M4.8 3.4 Q11.4 4.7 19 3.3 C25.7 2.1 32.3 4.8 38.7 3.9 Q41.2 4.3 40.8 9.8 C39.6 18 42 23.2 40.5 30.4 Q39.8 35.1 40.2 39.3 C35.6 42.1 26.5 39.3 20.9 40.2 Q10.5 42.2 3.8 40 Q2 35.6 3.9 27.4 C4.9 21.6 2.1 16.1 3.4 9.8 Q4.3 5.9 4.8 3.4 Z"}
      />
      <path
        className="month-button-pen-mark"
        d={previous
          ? "M2.4 13 Q1.6 7.2 4.9 5 M30.5 41.9 Q38.4 42.9 41.2 40.1"
          : "M5.2 2.4 Q9.1 3.4 15.6 2.8 M41.4 29.6 Q40.8 34.5 41.2 38.5"}
      />
      <path className="month-button-symbol" d={monthButtonSymbols[kind]} />
      <path
        className="month-button-hatching"
        d="M6.9 14.2 Q10.8 10.3 14.9 6.7 M6.9 21.4 Q13.9 14 22.1 6.8 M7.4 29.3 Q18.8 17.6 29.6 7.3 M7.7 36.4 Q22 21.4 36.4 7.9 M15.7 37 Q26.4 25.6 36.7 15.8 M23.5 37.1 Q30.2 29.8 36.8 23.7 M31.1 36.7 Q33.7 33.6 36.9 30.9"
      />
    </svg>
  );
}

function StreakNumber({ value }: { value: number }) {
  const digits = String(value);
  const width = digits.length * 14;
  return (
    <>
      <span className="sr-only">{digits}</span>
      <svg className="streak-digits" width={`${width / 22}em`} viewBox={`0 0 ${width} 22`} aria-hidden="true">
        {Array.from(digits, (digit, index) => (
          <path key={index} d={streakDigitPaths[Number(digit)]} transform={`translate(${index * 14} 0)`} />
        ))}
      </svg>
    </>
  );
}

export function MobilityTracker({ anchor, swipeColors, guideColors }: {
  anchor: string;
  swipeColors: readonly SketchColor[];
  guideColors: readonly ChevronColor[];
}) {
  const linkedDrill = isDrillAnchor(anchor);
  const view = linkedDrill ? "plan" : navigation.find(({ id }) => id === anchor)?.id ?? "today";
  const content = useRef<HTMLDivElement>(null);
  const previousView = useRef<View>("today");
  const [today, setToday] = useState(deviceDay);
  const [days, setDays] = useState<Set<string> | null>(null);
  const [monthOverride, setMonthOverride] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [writeError, setWriteError] = useState<"today" | "calendar">();
  const [announcement, setAnnouncement] = useState("");
  const [pendingDay, setPendingDay] = useState<string>();
  const saving = useRef(false);

  useEffect(() => {
    if (linkedDrill) {
      openDrill(anchor);
    } else if (view !== previousView.current) {
      window.scrollTo(0, 0);
      content.current?.focus({ preventScroll: true });
    }
    previousView.current = view;
  }, [anchor, linkedDrill, view]);

  useEffect(() => {
    const update = () => setToday(deviceDay());
    update();
    const interval = window.setInterval(update, 30_000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
    };
  }, []);

  useEffect(() => {
    function refresh() {
      try {
        setDays(loadCheckIns());
        setLoadError(false);
      } catch {
        setDays(null);
        setLoadError(true);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.storageArea === localStorage && (event.key === checkInsKey || event.key === null)) refresh();
    }

    refresh();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadAttempt]);

  async function save(day: string, done: boolean, origin: "today" | "calendar" = "today") {
    if (!days || day > deviceDay() || saving.current) return;
    saving.current = true;
    setPendingDay(day);
    setWriteError(undefined);
    setAnnouncement("");
    const previous = days;
    const updated = new Set(days);
    if (done) updated.add(day);
    else updated.delete(day);
    setDays(updated);

    try {
      const saved = await updateCheckIns((current) => {
        if (done) current.add(day);
        else current.delete(day);
      });
      setDays(saved);
      setAnnouncement(done ? "Session saved." : "Check-in removed.");
    } catch {
      setDays(previous);
      setWriteError(origin);
    } finally {
      saving.current = false;
      setPendingDay(undefined);
    }
  }

  async function mergeCheckIns(imported: Set<string>) {
    const merged = await updateCheckIns((current) => {
      for (const day of imported) current.add(day);
    });
    setDays(merged);
  }

  const month = monthOverride ?? today.slice(0, 7);
  const { streak, bestStreak } = trackerStats(days ?? new Set<string>(), today);
  const session = dailyDrills(today);
  const weekStart = monday(today);
  const weekMarks = weeklyMarks(weekStart);
  const todayDone = days?.has(today) ?? false;
  const selectedDone = selected !== undefined && (days?.has(selected) ?? false);
  const ready = days !== null;
  const busy = pendingDay !== undefined;
  const monthLabel = formatDay(month + "-01", monthDate);

  function changeMonth(direction: number) {
    setMonthOverride(shiftMonth(month, direction));
    setSelected(undefined);
  }

  function retryLoad() {
    setLoadError(false);
    setLoadAttempt((attempt) => attempt + 1);
  }

  const loadMessage = loadError ? (
    <p className="message" role="alert">
      Couldn’t load check-ins. <button type="button" className="text-button" onClick={retryLoad}>Retry</button>
    </p>
  ) : !ready ? <p className="message" role="status">Loading check-ins…</p> : null;

  return (
    <>
      <nav className="mobility-tabs" aria-label="Mobility">
        {navigation.map(({ id, label }) => (
          <a key={id} href={id === "today" ? "#mobility" : `#mobility/${id}`} aria-current={view === id ? "page" : undefined}>
            {label}
            {view === id && (
              <svg className="mobility-tab-outline" viewBox="0 0 96 44" preserveAspectRatio="none"
                fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 4.6 C19 2.3 33 5.1 48 3.5 Q72 1.9 88 4.1 Q92.3 4.7 92 10.1 C91.2 18.4 93.7 27.3 91.3 37.8 Q89.9 40.8 84.2 40.2 C68.4 39.2 58.3 42.1 43.8 40.2 Q24.4 38.9 7.1 40.6 Q2.8 39.8 3.8 34.1 C4.9 25.2 2 16 3.6 9 Q4.2 6.2 6 4.6 Z"
                  strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
                <path d="M2.2 15.9 Q1.2 8.9 4.7 5.7 M77.6 41.9 Q86.7 42.9 91 39.3"
                  strokeWidth=".65" opacity=".65" vectorEffect="non-scaling-stroke" />
              </svg>
            )}
          </a>
        ))}
      </nav>

      <div ref={content} className="mobility-content" tabIndex={-1}>
        <div className="sr-only" role="status">{announcement}</div>
        {view === "today" && (
          <section className="today-view" aria-label="Today">
            <section className="daily-mix" aria-labelledby="routine-title">
              <div className="section-row">
                <h3 id="routine-title">Today’s mix</h3>
                <a className="inline-link" href="#mobility/plan">Guide <ArrowRight aria-hidden="true" size={15} /></a>
              </div>
              <ul className="routine-list" role="list">
                {session.map((drill) => (
                  <li key={drill.id}>
                    <SketchShape className="routine-bullet" filled={false} />
                    <a href={`#mobility/${drill.id}`}>{drill.name}</a>
                  </li>
                ))}
              </ul>
            </section>

            <div className="check-in-row">
              <div className="desktop-check-in">
                {todayDone && pendingDay !== today ? (
                  <>
                    <span className="done-label"><Check aria-hidden="true" size={18} /> Done today</span>
                    <button type="button" className="text-button" disabled={busy} onClick={() => save(today, false)}>Undo</button>
                  </>
                ) : (
                  <button type="button" className="primary-button" onClick={() => save(today, true)} disabled={!ready || busy}>
                    <Check aria-hidden="true" size={18} />
                    {pendingDay === today ? "Saving…" : "Mark today done"}
                  </button>
                )}
              </div>
              <SwipeCheckIn
                colors={swipeColors}
                completed={todayDone}
                disabled={!ready || busy}
                pending={pendingDay === today}
                onChange={(done) => save(today, done)}
              />
            </div>
            {loadMessage}
            {writeError === "today" && <p className="message error" role="alert">That change didn’t save. Try again.</p>}

            <section className="journal-section" aria-labelledby="week-title">
              <svg className="journal-divider" viewBox="0 0 555 8" preserveAspectRatio="none"
                fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
                <path d="M1.2 4.2 C25 2.3 52 4.7 78 3.5 S119 3 147 3.9 C174 4.8 204 2.6 233 3.4 S280 4.7 310 3.8 C346 2.7 373 4.7 403 3.9 S446 2.6 476 3.8 C504 4.9 530 3 553.6 4.1"
                  strokeWidth="1.05" vectorEffect="non-scaling-stroke" />
                <path d="M4.4 4.9 Q18 3.9 34 4.4 M517 4.4 Q537 4.1 550.8 4.9"
                  strokeWidth=".65" opacity=".55" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="section-row">
                <h3 id="week-title">This week</h3>
                <a className="inline-link" href="#mobility/activity">Calendar <ArrowRight aria-hidden="true" size={15} /></a>
              </div>
              <ol className="week-strip">
                {weekdays.map((label, index) => {
                  const day = shiftDay(weekStart, index);
                  const done = days?.has(day) ?? false;
                  return (
                    <li key={label} className={day === today ? "week-today" : undefined}>
                      <span className="week-day">{label}</span>
                      <WeekMark {...weekMarks[index]} filled={done} />
                      <span className="sr-only">{day === today ? "Today, " : ""}{done ? "completed" : "no check-in"}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="streak-stats" aria-label="Streaks">
              <dl>
                <div>
                  <dt className="streak-label">
                    Current streak
                    <details className="streak-info">
                      <summary>
                        <Info aria-hidden="true" size={17} />
                        <span className="sr-only">How streaks work</span>
                      </summary>
                      <p>At least <StreakNumber value={WEEKLY_GOAL} /> check-ins from Monday to Sunday count toward your streak.</p>
                    </details>
                  </dt>
                  <dd>{ready ? <StreakNumber value={streak} /> : "–"} <span className="stat-unit">{streak === 1 ? "week" : "weeks"}</span></dd>
                </div>
                <div>
                  <dt>Best streak</dt>
                  <dd>{ready ? <StreakNumber value={bestStreak} /> : "–"} <span className="stat-unit">{bestStreak === 1 ? "week" : "weeks"}</span></dd>
                </div>
              </dl>
            </section>
          </section>
        )}

        {view === "activity" && (
          <section className="activity-view" aria-label="Activity">
            {loadMessage}
            <section className="calendar" aria-label="Check-in calendar">
              <div className="month-row">
                <h3 aria-live="polite">{monthLabel}</h3>
                <div className="month-controls">
                  <button type="button" className="month-button" aria-label="Previous month" onClick={() => changeMonth(-1)}>
                    <MonthButtonIcon kind="previous" />
                  </button>
                  <button type="button" className="month-button" aria-label="Next month" onClick={() => changeMonth(1)} disabled={month >= today.slice(0, 7)}>
                    <MonthButtonIcon kind="next" />
                  </button>
                  {selected && (
                    <button
                      type="button"
                      className="month-button"
                      aria-label={pendingDay === selected ? "Saving check-in" : selectedDone ? "Remove check-in" : "Mark done"}
                      onClick={() => save(selected, !selectedDone, "calendar")}
                      disabled={!ready || busy}
                    >
                      <MonthButtonIcon kind={selectedDone ? "remove" : "mark"} />
                    </button>
                  )}
                </div>
              </div>

              <div className="calendar-grid" role="group" aria-label={monthLabel}>
                {weekdays.map((day) => <span className="weekday" aria-hidden="true" key={day}>{day}</span>)}
                {monthCells(month).map((day, index) => {
                  if (!day) return <span key={"space-" + index} aria-hidden="true" />;
                  const done = days?.has(day) ?? false;
                  const fillColor = done ? calendarColors[seededRandom("calendar-fill:" + day)(calendarColors.length)] : undefined;
                  return (
                    <button
                      type="button"
                      key={day}
                      className={fillColor ? "day done sketch-color--" + fillColor : "day"}
                      aria-label={formatDay(day, { ...longDate, year: "numeric" }) + (done ? ", completed" : "")}
                      aria-current={day === today ? "date" : undefined}
                      aria-pressed={selected === day}
                      disabled={day > today}
                      onClick={() => {
                        setSelected(day);
                        if (writeError === "calendar") setWriteError(undefined);
                      }}
                    >
                      <SketchShape className="day-circle" filled={done} calendarStroke />
                      {selected === day && <SketchShape className="day-selection" filled={false} calendarStroke />}
                      <span className="day-number">{Number(day.slice(-2))}</span>
                    </button>
                  );
                })}
              </div>

              {writeError === "calendar" && selected && <p className="message error" role="alert">That change didn’t save. Try again.</p>}
            </section>
            <CheckInImport merge={mergeCheckIns} />
          </section>
        )}

        {view === "plan" && <MobilityPlan colors={guideColors} />}
      </div>
    </>
  );
}
