import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const generatedFramesDirectory = path.resolve(import.meta.dirname, "../../assets/workouts/frames");

export default defineConfig({
  plugins: [
    react(),
    {
      name: "save-workout-frame",
      configureServer(server) {
        server.middlewares.use("/__save-image", async (request, response) => {
          if (request.method !== "POST") {
            response.statusCode = 405;
            response.end("POST required");
            return;
          }

          const chunks = [];
          for await (const chunk of request) chunks.push(chunk);

          try {
            const { movement, frame, dataUrl } = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            if (!/^[a-z-]+$/.test(movement) || (frame !== null && !/^\d{2}$/.test(frame))) {
              throw new Error("Invalid image name");
            }

            const expectedType = frame === null ? "gif" : "png";
            const match = new RegExp(`^data:image/${expectedType};base64,(.+)$`).exec(dataUrl);
            if (!match) throw new Error(`Expected a ${expectedType.toUpperCase()} data URL`);

            const outputDirectory = frame === null
              ? path.dirname(generatedFramesDirectory)
              : path.join(generatedFramesDirectory, movement);
            const filename = frame === null ? `${movement}.gif` : `${frame}.png`;
            await mkdir(outputDirectory, { recursive: true });
            await writeFile(path.join(outputDirectory, filename), Buffer.from(match[1], "base64"));
            response.setHeader("content-type", "application/json");
            response.end(JSON.stringify({ ok: true }));
          } catch (error) {
            response.statusCode = 400;
            response.end(error.message);
          }
        });
      },
    },
  ],
});
