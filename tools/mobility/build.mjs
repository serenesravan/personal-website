import { appendFile, readFile } from "node:fs/promises";
import { build } from "esbuild";

const output = "../../mobility/app.js";

await build({
  entryPoints: ["src/main.tsx"],
  outfile: output,
  bundle: true,
  format: "esm",
  minify: true,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "linked",
});

const [react, lucide] = await Promise.all([
  readFile("node_modules/react/LICENSE", "utf8"),
  readFile("node_modules/lucide-react/LICENSE", "utf8"),
]);

await appendFile(`${output}.LEGAL.txt`, `\nReact, React DOM and Scheduler\n\n${react}\nLucide\n\n${lucide}`);
