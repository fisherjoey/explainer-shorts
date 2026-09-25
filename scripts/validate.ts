import {readFileSync} from "node:fs";
import {ScriptSchema, type Slide} from "../src/schema";

const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

const headlineOk = (headline: string): {lines: boolean; length: boolean} => {
  const lines = headline.split("\n");
  return {
    lines: lines.length <= 2,
    length: headline.length <= 60,
  };
};

export const checkScript = (script: unknown): {errors: string[]; warnings: string[]} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = ScriptSchema.safeParse(script);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    return {errors, warnings};
  }

  const data = parsed.data;
  const seenIds = new Set<string>();
  let totalWords = 0;

  data.slides.forEach((slide: Slide, index: number) => {
    if (seenIds.has(slide.id)) {
      errors.push(`slide ${index} (${slide.id}): duplicate slide id`);
    }
    seenIds.add(slide.id);

    if (slide.narration.trim().length === 0) {
      errors.push(`slide ${slide.id}: narration is empty`);
    }

    const {lines, length} = headlineOk(slide.headline);
    if (!lines) {
      errors.push(`slide ${slide.id}: headline has more than 2 lines`);
    }
    if (!length) {
      errors.push(`slide ${slide.id}: headline exceeds 60 characters`);
    }

    // An aside never sits beside a full-width visual or a big narrator, and a big narrator
    // paints over a full layout's full-width first block (only split slides move the column).
    const split = (slide.layout ?? "split") === "split";
    if (slide.aside !== undefined && (!split || slide.narrator === "big")) {
      errors.push(`${slide.id}: aside needs layout split and a non-big narrator`);
    }
    if (slide.narrator === "big" && !split) {
      errors.push(`${slide.id}: big narrator needs layout split`);
    }

    const wordCount = countWords(slide.narration);
    totalWords += wordCount;
    if (wordCount > 40) {
      errors.push(`slide ${slide.id}: narration has more than 40 words (${wordCount})`);
    }
  });

  if (totalWords < 300 || totalWords > 600) {
    warnings.push(`total narration words is ${totalWords}, outside the expected 300-600 range`);
  }

  return {errors, warnings};
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const slug = process.argv[2];
  if (!slug) {
    console.error("usage: pnpm validate <slug>");
    process.exit(1);
  }

  const path = `videos/${slug}/script.json`;
  let script: unknown;
  try {
    script = JSON.parse(readFileSync(path, "utf-8"));
  } catch (err) {
    console.error(`failed to read ${path}: ${(err as Error).message}`);
    process.exit(1);
  }

  const {errors, warnings} = checkScript(script);

  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }
  for (const error of errors) {
    console.error(`error: ${error}`);
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  console.log(`${path} is valid`);
}
