// pnpm render <slug>
// Renders out/<slug>.mp4 from videos/<slug>/{script,timing,words}.json and audio/voice.wav, then
// checks the file with ffprobe (1080×1920, 30 fps, H.264 + AAC, duration within 3 % of timing.json).
import {spawnSync} from "node:child_process";
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {z} from "zod";
import {
  ScriptSchema,
  TimingSchema,
  WordSchema,
  type NarratorImages,
  type Script,
  type Timing,
  type VideoProps,
  type Word,
} from "../src/schema";

/**
 * The narrator pictures present under `publicDir`: narrator/idle.png and narrator/look.png, as
 * paths relative to it. Either may be missing; with neither, the video has no narrator.
 */
export const findNarratorImages = (publicDir = "public"): NarratorImages => {
  const images: NarratorImages = {};
  for (const pose of ["idle", "look"] as const) {
    if (existsSync(`${publicDir}/narrator/${pose}.png`)) images[pose] = `narrator/${pose}.png`;
  }
  return images;
};

/** The first way the three files disagree about slide ids, or null when they agree. */
export const idMismatch = (script: Script, timing: Timing, words: Word[]): string | null => {
  const ids = script.slides.map((s) => s.id);
  const timed = timing.slides.map((s) => s.id);
  for (let i = 0; i < Math.max(ids.length, timed.length); i++) {
    if (ids[i] !== timed[i]) {
      return `timing.json slide ${i + 1} is ${timed[i] ?? "missing"}, script.json slide ${i + 1} is ${ids[i] ?? "missing"}`;
    }
  }
  const known = new Set(ids);
  const stray = words.find((w) => !known.has(w.slide));
  if (stray) return `words.json has a word for slide ${stray.slide} ("${stray.text}"), which script.json does not have`;
  const spoken = new Set(words.map((w) => w.slide));
  const silent = ids.find((id) => !spoken.has(id));
  if (silent) return `words.json has no words for slide ${silent}`;
  return null;
};

export type Probe = {
  streams: {codec_type: string; codec_name?: string; width?: number; height?: number; r_frame_rate?: string}[];
  format: {duration?: string};
};

/** Every ffprobe check the rendered file fails (empty when it passes). */
export const probeFailures = (probe: Probe, total: number): string[] => {
  const failures: string[] = [];
  const video = probe.streams.find((s) => s.codec_type === "video");
  if (!video) {
    failures.push("no video stream");
  } else {
    if (video.codec_name !== "h264") failures.push(`video codec is ${video.codec_name}, expected h264`);
    if (video.width !== 1080) failures.push(`width is ${video.width}, expected 1080`);
    if (video.height !== 1920) failures.push(`height is ${video.height}, expected 1920`);
    const [num, den] = (video.r_frame_rate ?? "").split("/").map(Number);
    if (num / den !== 30) failures.push(`frame rate is ${video.r_frame_rate}, expected 30`);
  }
  const audio = probe.streams.find((s) => s.codec_type === "audio");
  if (!audio) failures.push("no audio stream");
  else if (audio.codec_name !== "aac") failures.push(`audio codec is ${audio.codec_name}, expected aac`);
  const duration = Number(probe.format.duration);
  if (!(Math.abs(duration - total) <= 0.03 * total)) {
    failures.push(`duration is ${probe.format.duration}s, not within 3 % of timing.json total ${total}s`);
  }
  return failures;
};

/** Message for a failed ffprobe spawn: the spawn error if it never ran, else stderr. */
export const probeFailureMessage = (probe: {error?: Error; stderr?: string}): string =>
  probe.error?.message ?? probe.stderr?.trim() ?? "unknown ffprobe failure";

/** Message for a failed render spawn: the spawn error, the signal that killed it, or the exit status. */
export const renderFailureMessage = (render: {error?: Error; signal?: NodeJS.Signals | null; status: number | null}): string =>
  render.error?.message ?? (render.signal ? `killed by signal ${render.signal}` : `exited with ${render.status}`);

const fail = (message: string): never => {
  console.error(`render: ${message}`);
  process.exit(1);
};

const readJson = <T>(path: string, schema: z.ZodType<T>): T => {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    return fail(`cannot read ${path}: ${(err as Error).message}`);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(`${path}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  return parsed.data;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const slug = process.argv[2];
  if (!slug) fail("usage: pnpm render <slug>");

  const dir = `videos/${slug}`;
  const script = readJson(`${dir}/script.json`, ScriptSchema);
  const timing = readJson(`${dir}/timing.json`, TimingSchema);
  const words = readJson(`${dir}/words.json`, z.array(WordSchema));

  const mismatch = idMismatch(script, timing, words);
  if (mismatch) fail(`slide ids do not match: ${mismatch}`);

  const voice = `${dir}/audio/voice.wav`;
  if (!existsSync(voice)) fail(`missing ${voice} (run the voice step first)`);
  mkdirSync(`public/_render/${slug}`, {recursive: true});
  copyFileSync(voice, `public/_render/${slug}/voice.wav`);

  const propsPath = `out/props/${slug}.json`;
  const props: VideoProps = {script, timing, words, audioSrc: `_render/${slug}/voice.wav`, narratorImages: findNarratorImages()};
  mkdirSync("out/props", {recursive: true});
  writeFileSync(propsPath, JSON.stringify(props));

  const out = `out/${slug}.mp4`;
  const render = spawnSync(
    "npx",
    ["remotion", "render", "src/index.ts", "ExplainerVideo", out, `--props=${propsPath}`, "--codec=h264"],
    {stdio: "inherit"},
  );
  if (render.status !== 0) fail(`remotion render ${renderFailureMessage(render)}`);

  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate:format=duration", "-of", "json", out],
    {encoding: "utf8"},
  );
  if (probe.status !== 0) fail(`ffprobe failed on ${out}: ${probeFailureMessage(probe)}`);
  const failures = probeFailures(JSON.parse(probe.stdout) as Probe, timing.total);
  if (failures.length > 0) fail(`${out} failed its checks:\n  ${failures.join("\n  ")}`);

  const duration = Number((JSON.parse(probe.stdout) as Probe).format.duration);
  console.log(`${out} (${duration.toFixed(1)}s)`);
}
