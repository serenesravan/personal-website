"use client";

import { useEffect, useId, useLayoutEffect, useRef, type PointerEvent } from "react";
import { seededRandom } from "../lib/seeded-random";
import { reachesSwipeEnd, recordSwipeSample, stepSwipeSpring, swipeReleaseSpeed, type SwipeSpring } from "../lib/swipe-physics";
import { SketchShape, sketchShapes, type SketchColor } from "./sketch-shapes";

const trackOutline = "M10 4 Q35 1.5 65 3.5 C103 5 133 1.8 169 3.2 S236 4.4 266 2.8 Q292 2 309 4.2 Q317 4.8 317.3 12.5 C316.5 23.1 319.2 34.7 316.2 46.9 Q314.3 51.6 306 52.3 C278 54 254 50.7 225 52.2 S168 53.6 139 52 C100 50.3 67 54.3 33 52.5 Q18 53 8.3 51.3 Q2.3 50.4 2.8 43 C3.4 32 1.3 20.3 3.3 12 Q4.1 6.2 10 4 Z";

const nextPencilValue = seededRandom("swipe-pencil-fill");
const pencilStrokes = Array.from({ length: 265 }, (_, index) => {
  const x = Math.round(index * 1.34) - 32 + nextPencilValue(3);
  const endX = x + 22 + nextPencilValue(10);
  const startY = 48 + nextPencilValue(14);
  const endY = -5 + nextPencilValue(13);
  return `M${x} ${startY} Q${x + 7 + nextPencilValue(8)} ${24 + nextPencilValue(9)} ${endX} ${endY}`;
}).join(" ");

function SwipeTrack() {
  const fillClip = useId();
  return (
    <svg className="swipe-track" viewBox="0 0 320 56" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <clipPath id={fillClip}><path d={trackOutline} /></clipPath>
      </defs>
      <path d={pencilStrokes} clipPath={`url(#${fillClip})`} fill="none"
        stroke="#f5ca0a" strokeWidth="1.38" strokeLinecap="round" />
      <path
        fill="none"
        stroke="#8b6200"
        strokeWidth="1.35"
        vectorEffect="non-scaling-stroke"
        d={trackOutline}
      />
      <g fill="none" strokeLinecap="round">
        <path stroke="#8b6200" strokeWidth=".75" opacity=".65" vectorEffect="non-scaling-stroke"
          d="M4.7 9.4 Q7 2.9 25 2.2 M50 54 Q75 54.4 94 52.8 M262 51.9 Q294 55.2 310 52.8 M318.5 33 Q319.6 42 316.1 48.3" />
      </g>
    </svg>
  );
}

function SwipeShapes({ className, colors, filled, hatched }: {
  className: string;
  colors: readonly SketchColor[];
  filled: boolean;
  hatched?: boolean;
}) {
  return (
    <span className={"swipe-shapes " + className} aria-hidden="true">
      {sketchShapes.map((shape, index) => (
        <SketchShape key={shape} shape={shape} className={"sketch-color--" + colors[index]} filled={filled} hatched={hatched} />
      ))}
    </span>
  );
}

export function SwipeCheckIn({ colors, completed, disabled, pending, onChange }: {
  colors: readonly SketchColor[];
  completed: boolean;
  disabled: boolean;
  pending: boolean;
  onChange: (done: boolean) => void;
}) {
  const motion = useRef<HTMLSpanElement>(null);
  const gesture = useRef<{
    pointerId: number;
    startX: number;
    distance: number;
    direction: number;
    samples: { x: number; time: number }[];
  } | null>(null);
  const animation = useRef<(SwipeSpring & { frame: number; distance: number }) | null>(null);
  const direction = completed ? -1 : 1;
  const label = pending ? "Saving…" : completed ? "Swipe left to undo" : "Swipe to mark done";

  useLayoutEffect(() => {
    const spring = animation.current;
    if (spring) spring.target = completed ? spring.distance : 0;
  }, [completed]);

  useEffect(() => () => {
    if (animation.current) cancelAnimationFrame(animation.current.frame);
  }, []);

  function start(event: PointerEvent<HTMLButtonElement>) {
    const layer = motion.current;
    if (disabled || !layer || gesture.current || animation.current || !event.isPrimary || event.button !== 0) return;

    const track = event.currentTarget;
    const { left, right } = track.getBoundingClientRect();
    const fromStart = completed ? right - event.clientX : event.clientX - left;
    const distance = layer.clientWidth;
    if (distance <= 0 || fromStart > track.clientWidth - distance) return;

    track.setPointerCapture(event.pointerId);
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      distance,
      direction,
      samples: [{ x: event.clientX, time: event.timeStamp }],
    };
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const active = gesture.current;
    if (active?.pointerId !== event.pointerId) return;

    recordSwipeSample(active.samples, { x: event.clientX, time: event.timeStamp });
    const travel = (event.clientX - active.startX) * active.direction;
    const progress = Math.min(1, Math.max(0, travel / active.distance));
    if (progress > 0) event.currentTarget.dataset.dragging = "";
    const offset = active.direction === 1 ? progress : 1 - progress;
    motion.current?.style.setProperty("--swipe-offset", `${offset * 100}%`);
  }

  function end(event: PointerEvent<HTMLButtonElement>, released = false) {
    const active = gesture.current;
    if (active?.pointerId !== event.pointerId) return;

    gesture.current = null;
    const track = event.currentTarget;
    const layer = motion.current;
    if (!layer) return;

    if (released) recordSwipeSample(active.samples, { x: event.clientX, time: event.timeStamp });
    const { x } = active.samples[active.samples.length - 1];
    const travel = (x - active.startX) * active.direction;
    const velocity = released ? swipeReleaseSpeed(active.samples) : 0;
    const accepted = released && !disabled && active.direction === direction
      && reachesSwipeEnd(travel, active.distance, velocity * direction);
    const destination = accepted ? !completed : completed;

    if ((travel > 0 || track.hasAttribute("data-dragging"))
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const dragged = Math.max(0, Math.min(active.distance, travel));
      const position = active.direction === 1 ? dragged : active.distance - dragged;
      const spring = {
        position,
        velocity,
        target: destination ? active.distance : 0,
        distance: active.distance,
        frame: 0,
      };
      track.dataset.dragging = "";
      layer.style.setProperty("--swipe-offset", `${position}px`);
      let lastFrame = performance.now();
      const animate = (now: number) => {
        const settled = stepSwipeSpring(spring, Math.max(0, now - lastFrame) / 1_000);
        lastFrame = now;
        if (settled) {
          animation.current = null;
          layer.style.removeProperty("--swipe-offset");
          delete track.dataset.dragging;
          return;
        }
        // Leave room for a small bounce while keeping the shapes inside the drawn track.
        const offset = Math.max(-8, Math.min(spring.distance + 8, spring.position));
        layer.style.setProperty("--swipe-offset", `${offset}px`);
        spring.frame = requestAnimationFrame(animate);
      };
      animation.current = spring;
      spring.frame = requestAnimationFrame(animate);
    } else {
      delete track.dataset.dragging;
      layer.style.removeProperty("--swipe-offset");
    }
    if (accepted) onChange(destination);
  }

  return (
    <button
      type="button"
      className="swipe-check-in"
      aria-label={label}
      disabled={disabled}
      data-completed={completed ? "" : undefined}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={(event) => end(event, true)}
      onPointerCancel={(event) => end(event)}
      onLostPointerCapture={(event) => end(event)}
      onClick={(event) => {
        if (event.detail !== 0) return;
        onChange(!completed);
      }}
    >
      <SwipeTrack />
      <SwipeShapes className="swipe-start" colors={colors} filled={!completed} />
      <SwipeShapes className="swipe-finish" colors={colors} filled={completed} />
      <span className="swipe-motion" ref={motion}>
        <SwipeShapes className="swipe-thumb" colors={colors} filled={false} hatched />
      </span>
    </button>
  );
}
