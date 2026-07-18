import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { Box, Tldraw, b64Vecs, createShapeId } from "tldraw";
import "tldraw/tldraw.css";
import "./styles.css";

const CANVAS_SIZE = 320;
const point = (x, y) => ({ x, y });
const line = (...points) => points;

const workouts = [
  {
    name: "Back Squat",
    equipment: "barbell",
    poses: [
      {
        head: { x: 160, y: 55, r: 14 },
        lines: [
          line(point(160, 69), point(158, 92), point(158, 160)),
          line(point(158, 92), point(187, 114), point(191, 92)),
          line(point(158, 160), point(176, 216), point(170, 270), point(191, 274)),
          line(point(156, 160), point(143, 215), point(134, 270), point(154, 274)),
        ],
        joints: [point(158, 92), point(187, 114), point(191, 92), point(158, 160), point(176, 216), point(170, 270), point(143, 215), point(134, 270)],
        bar: { y: 92, left: 84, right: 236 },
      },
      {
        head: { x: 190, y: 93, r: 14 },
        lines: [
          line(point(181, 106), point(171, 124), point(150, 180)),
          line(point(171, 124), point(202, 146), point(204, 121)),
          line(point(150, 180), point(193, 214), point(181, 268), point(203, 272)),
          line(point(148, 180), point(158, 216), point(128, 268), point(151, 272)),
        ],
        joints: [point(171, 124), point(202, 146), point(204, 121), point(150, 180), point(193, 214), point(181, 268), point(158, 216), point(128, 268)],
        bar: { y: 121, left: 98, right: 250 },
      },
    ],
  },
  {
    name: "Deadlift",
    equipment: "barbell",
    poses: [
      {
        head: { x: 205, y: 119, r: 14 },
        lines: [
          line(point(195, 130), point(181, 143), point(150, 184)),
          line(point(181, 143), point(190, 188), point(190, 235)),
          line(point(150, 184), point(171, 220), point(165, 273), point(188, 276)),
          line(point(148, 184), point(140, 222), point(130, 273), point(153, 276)),
        ],
        joints: [point(181, 143), point(190, 188), point(190, 235), point(150, 184), point(171, 220), point(165, 273), point(140, 222), point(130, 273)],
        bar: { y: 235, left: 74, right: 256 },
      },
      {
        head: { x: 160, y: 51, r: 14 },
        lines: [
          line(point(160, 65), point(160, 86), point(160, 164)),
          line(point(153, 88), point(154, 143), point(151, 194)),
          line(point(167, 88), point(170, 143), point(171, 194)),
          line(point(160, 164), point(174, 219), point(171, 273), point(194, 276)),
          line(point(158, 164), point(146, 219), point(137, 273), point(160, 276)),
        ],
        joints: [point(160, 86), point(153, 88), point(154, 143), point(151, 194), point(167, 88), point(170, 143), point(171, 194), point(160, 164), point(174, 219), point(171, 273), point(146, 219), point(137, 273)],
        bar: { y: 194, left: 74, right: 256 },
      },
    ],
  },
  {
    name: "Bench Press",
    equipment: "bench",
    poses: [
      {
        head: { x: 70, y: 164, r: 14 },
        lines: [
          line(point(84, 164), point(111, 160), point(201, 171)),
          line(point(116, 160), point(139, 130), point(159, 129)),
          line(point(201, 171), point(239, 204), point(249, 258), point(273, 261)),
        ],
        joints: [point(111, 160), point(139, 130), point(159, 129), point(201, 171), point(239, 204), point(249, 258)],
        bar: { y: 127, left: 55, right: 244 },
      },
      {
        head: { x: 70, y: 164, r: 14 },
        lines: [
          line(point(84, 164), point(111, 160), point(201, 171)),
          line(point(116, 160), point(129, 108), point(136, 70)),
          line(point(201, 171), point(239, 204), point(249, 258), point(273, 261)),
        ],
        joints: [point(111, 160), point(129, 108), point(136, 70), point(201, 171), point(239, 204), point(249, 258)],
        bar: { y: 68, left: 42, right: 231 },
      },
    ],
  },
  {
    name: "Pull Ups",
    equipment: "pullup-bar",
    poses: [
      {
        head: { x: 160, y: 105, r: 14 },
        lines: [
          line(point(160, 119), point(160, 137), point(160, 199)),
          line(point(145, 137), point(175, 137)),
          line(point(145, 137), point(128, 98), point(116, 55)),
          line(point(175, 137), point(192, 98), point(204, 55)),
          line(point(160, 199), point(146, 238), point(155, 279)),
          line(point(160, 199), point(174, 238), point(165, 279)),
        ],
        joints: [point(160, 137), point(128, 98), point(116, 55), point(192, 98), point(204, 55), point(160, 199), point(146, 238), point(155, 279), point(174, 238), point(165, 279)],
        bar: { y: 55, left: 68, right: 252, plates: false },
      },
      {
        head: { x: 160, y: 35, r: 14 },
        lines: [
          line(point(160, 49), point(160, 70), point(160, 147)),
          line(point(145, 73), point(175, 73)),
          line(point(145, 73), point(121, 88), point(116, 55)),
          line(point(175, 73), point(199, 88), point(204, 55)),
          line(point(160, 147), point(144, 192), point(155, 235)),
          line(point(160, 147), point(176, 192), point(165, 235)),
        ],
        joints: [point(160, 70), point(121, 88), point(116, 55), point(199, 88), point(204, 55), point(160, 147), point(144, 192), point(155, 235), point(176, 192), point(165, 235)],
        bar: { y: 55, left: 68, right: 252, plates: false },
      },
    ],
  },
  {
    name: "Push Ups",
    equipment: "floor",
    poses: [
      {
        head: { x: 72, y: 139, r: 14 },
        lines: [
          line(point(86, 143), point(108, 151), point(194, 176), point(281, 205), point(301, 205)),
          line(point(116, 154), point(119, 190), point(121, 228)),
        ],
        joints: [point(108, 151), point(194, 176), point(281, 205), point(116, 154), point(119, 190), point(121, 228)],
      },
      {
        head: { x: 72, y: 188, r: 14 },
        lines: [
          line(point(86, 190), point(108, 196), point(194, 181), point(281, 205), point(301, 205)),
          line(point(116, 198), point(153, 211), point(121, 228)),
        ],
        joints: [point(108, 196), point(194, 181), point(281, 205), point(116, 198), point(153, 211), point(121, 228)],
      },
    ],
  },
];

const frames = workouts.flatMap((workout) => workout.poses.map((pose) => ({ ...pose, workout })));

function densify(points) {
  return points.flatMap((start, index) => {
    if (index === points.length - 1) return [start];
    const end = points[index + 1];
    return [0, 0.25, 0.5, 0.75].map((progress) => point(
      start.x + (end.x - start.x) * progress,
      start.y + (end.y - start.y) * progress,
    ));
  });
}

function drawLine(editor, points, color = "black") {
  const rendered = densify(points);
  const minX = Math.min(...rendered.map(({ x }) => x));
  const minY = Math.min(...rendered.map(({ y }) => y));
  editor.createShape({
    id: createShapeId(),
    type: "draw",
    x: minX,
    y: minY,
    props: {
      color,
      fill: "none",
      dash: "solid",
      size: "m",
      segments: [{
        type: "free",
        path: b64Vecs.encodePoints(rendered.map(({ x, y }) => ({ x: x - minX, y: y - minY, z: 0.5 }))),
      }],
      isComplete: true,
      isClosed: false,
      isPen: false,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
    },
  });
}

function drawCircle(editor, center, radius, { color = "black", filled = false } = {}) {
  editor.createShape({
    id: createShapeId(),
    type: "geo",
    x: center.x - radius,
    y: center.y - radius,
    props: {
      geo: "ellipse",
      w: radius * 2,
      h: radius * 2,
      color,
      fill: filled ? "solid" : "none",
      dash: "solid",
      size: "m",
    },
  });
}

function drawBar(editor, bar, withPlates) {
  drawLine(editor, line(point(bar.left, bar.y), point(bar.right, bar.y)), "blue");
  if (!withPlates) return;
  drawCircle(editor, point(bar.left + 7, bar.y), 17, { color: "blue" });
  drawCircle(editor, point(bar.right - 7, bar.y), 17, { color: "blue" });
}

function renderPose(editor, frame) {
  const { workout } = frame;

  if (workout.equipment === "bench") {
    drawLine(editor, line(point(48, 190), point(244, 190)));
    drawLine(editor, line(point(72, 190), point(64, 252)));
    drawLine(editor, line(point(222, 190), point(234, 252)));
  }
  if (workout.equipment === "floor") {
    drawLine(editor, line(point(35, 232), point(305, 232)), "blue");
  }
  if (frame.bar) {
    drawBar(editor, frame.bar, frame.bar.plates !== false);
  }

  frame.lines.forEach((points) => drawLine(editor, points));
  drawCircle(editor, frame.head, frame.head.r);
}

async function saveImage(frame, dataUrl) {
  const response = await fetch("/__save-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ movement: "workout-cycle", frame, dataUrl }),
  });
  if (!response.ok) throw new Error(await response.text());
}

async function readPixels(dataUrl) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

async function encodeGif(frameDataUrls) {
  const gif = GIFEncoder();
  for (const dataUrl of frameDataUrls) {
    const { data, width, height } = await readPixels(dataUrl);
    const palette = quantize(data, 16, { format: "rgba4444", oneBitAlpha: true });
    const transparentIndex = Math.max(0, palette.findIndex((color) => color[3] === 0));
    gif.writeFrame(applyPalette(data, palette, "rgba4444"), width, height, {
      palette,
      delay: 500,
      repeat: 0,
      transparent: true,
      transparentIndex,
    });
  }
  gif.finish();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result), { once: true });
    reader.addEventListener("error", () => reject(reader.error), { once: true });
    reader.readAsDataURL(new Blob([gif.bytes()], { type: "image/gif" }));
  });
}

function Generator() {
  const hasStarted = useRef(false);
  const [status, setStatus] = useState("Preparing tldraw…");

  async function generate(editor) {
    if (hasStarted.current) return;
    hasStarted.current = true;

    try {
      const frameDataUrls = [];
      for (const [index, frame] of frames.entries()) {
        editor.deleteShapes([...editor.getCurrentPageShapeIds()]);
        renderPose(editor, frame);
        const exported = await editor.toImageDataUrl(editor.getCurrentPageShapes(), {
          format: "png",
          bounds: new Box(0, 0, CANVAS_SIZE, CANVAS_SIZE),
          padding: 0,
          pixelRatio: 2,
          background: false,
          darkMode: false,
        });
        frameDataUrls.push(exported.url);
        await saveImage(String(index).padStart(2, "0"), exported.url);
        setStatus(`Exported ${index + 1} / ${frames.length} frames`);
      }

      setStatus("Stitching complete workout cycle");
      await saveImage(null, await encodeGif(frameDataUrls));
      setStatus("Done — 10 stick-figure frames and 1 independent looping GIF exported");
      document.body.dataset.generationStatus = "done";
    } catch (error) {
      console.error(error);
      setStatus(`Failed: ${error.message}`);
      document.body.dataset.generationStatus = "failed";
    }
  }

  return (
    <main>
      <div className="status" role="status">{status}</div>
      <div className="canvas-shell">
        <Tldraw hideUi onMount={generate} />
      </div>
    </main>
  );
}

createRoot(document.querySelector("#root")).render(<Generator />);
