// pnpm stills <slug> [frame=75]
// Renders out/stills/<slug>/<id>.png for every slide, then a contact sheet out/stills/<slug>/sheet.png.
import {spawnSync} from "node:child_process";
import {mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {ScriptSchema} from "../src/schema";
import {findNarratorImages} from "./render";

const [slug, frameArg] = process.argv.slice(2);
if (!slug) {
  console.error("usage: pnpm stills <slug> [frame=75]");
  process.exit(1);
}
const frame = Number((frameArg ?? "75").replace(/^(--)?frame=/, ""));
if (!Number.isInteger(frame) || frame < 0 || frame >= 90) {
  console.error(`frame must be an integer 0–89, got ${frameArg}`);
  process.exit(1);
}

const script = ScriptSchema.parse(JSON.parse(readFileSync(`videos/${slug}/script.json`, "utf8")));
const outDir = `out/stills/${slug}`;
const propsDir = `out/props/stills-${slug}`;
rmSync(outDir, {recursive: true, force: true});
mkdirSync(outDir, {recursive: true});
mkdirSync(propsDir, {recursive: true});

const run = (cmd: string, args: string[]) => {
  const res = spawnSync(cmd, args, {stdio: "inherit"});
  if (res.status !== 0) {
    console.error(`failed: ${cmd} ${args.join(" ")}`);
    process.exit(1);
  }
};

script.slides.forEach((slide, index) => {
  const props = `${propsDir}/${slide.id}.json`;
  writeFileSync(props, JSON.stringify({script, index, narratorImages: findNarratorImages()}));
  run("npx", ["remotion", "still", "src/index.ts", "SlideStill", `${outDir}/${slide.id}.png`, `--props=${props}`, `--frame=${frame}`]);
});

const rows = Math.ceil(script.slides.length / 6);
run("ffmpeg", [
  "-v", "error", "-y",
  "-pattern_type", "glob", "-i", `${outDir}/s*.png`,
  "-vf", `scale=270:-1,tile=6x${rows}`,
  "-frames:v", "1",
  `${outDir}/sheet.png`,
]);
console.log(`${outDir}/sheet.png (${script.slides.length} slides, frame ${frame})`);
