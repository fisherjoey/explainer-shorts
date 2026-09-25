// pnpm stats <slug>
// Checks videos/<slug>/script.json against the style guide's targets (docs/style-guide.md). They are
// stricter than `pnpm validate` on purpose: words per slide and in total, cue placement and order,
// headline and aside shape, keywords, narration the voice can't say, and block lines too wide for
// their column. Prints every issue and a summary; exits 1 when there is any issue.
import {readFileSync} from "node:fs";
import {ScriptSchema, type Block, type Script, type Slide} from "../src/schema";
import {norm} from "../src/text";

const TARGET = {
  slides: [40, 48],
  words: [520, 580],
  perSlide: [9, 15],
  dark: [1, 2],
  accent: [0, 1],
  sections: [5, 7],
} as const;
const HEADLINE_LINE = 30;
const ASIDE = 70;

// Column widths and type sizes, from src/theme.ts (L) and the blocks. The charBudget test pins them.
const FULL_W = 960; // 1080 − 2 × L.margin
const COL_W = 640; // L.colRight − L.colX
const BIG_W = 482; // L.colRight − L.colXBig
const ROW_GAP = 12; // Row.tsx
const COMPACT = 420; // blocks/shared.tsx: narrower blocks step their type down
const MONO_EM = 0.6; // JetBrains Mono advance

type Kind = "code" | "terminal" | "terminalRow" | "kv" | "kvValue";

/** How many monospace characters fit on one line of a block `width` px wide before it wraps. */
export const charBudget = (kind: Kind, width: number): number => {
  const compact = width < COMPACT;
  const shell = compact ? 38 : 52; // TermShell body padding + 1 px borders
  switch (kind) {
    case "code":
      return Math.floor((width - shell) / ((compact ? 20 : 26) * MONO_EM));
    case "terminal":
      return Math.floor((width - shell) / ((compact ? 20 : 24) * MONO_EM));
    case "terminalRow": // a line with `right`: outlined row, 19 px padding, 16 px gap (compact: stacked)
      return compact
        ? Math.floor((width - shell - 30) / (20 * MONO_EM))
        : Math.floor((width - shell - 56) / (24 * MONO_EM));
    case "kv": // key (20 px, 0.06 em tracking) + value (22 px), 24 px padding, 20 px gap
      return compact ? Math.floor((width - 38) / 13.2) : Math.floor((width - 70) / 13.2);
    case "kvValue": // the value cell is capped at 65 % of the row
      return compact ? Math.floor((width - 38) / 13.2) : Math.floor((0.65 * (width - 50)) / 13.2);
  }
};

const words = (narration: string) => narration.trim().split(/\s+/).filter(Boolean);

/** Index of the first narration word that starts with the cue, as src/cues.ts matches it; −1 if none. */
const cueAt = (w: string[], cue: string) => w.findIndex((v) => norm(v).startsWith(norm(cue)));

const SYMBOLS = /[→/&%*#()+<>=\\|~^_]/g;
const UNIT = /^(KB|MB|GB|TB|KiB|MiB|GiB|TiB|ms|ns|µs|us)[.,;:!?]?$/;

const lineIssues = (id: string, block: Block, width: number): string[] => {
  const out: string[] = [];
  const over = (what: string, text: string, n: number, fit: number) =>
    n > fit ? [`${id}: ${what} "${text}" is ${n} characters; ${fit} fit at ${width} px`] : [];
  switch (block.type) {
    case "row": {
      const n = Math.max(1, block.blocks.length);
      const cell = Math.floor((width - ROW_GAP * (n - 1)) / n);
      for (const child of block.blocks) out.push(...lineIssues(id, child, cell));
      break;
    }
    case "code":
      for (const line of block.code.split("\n")) out.push(...over("code line", line, line.length, charBudget("code", width)));
      break;
    case "terminal":
      for (const line of block.lines) {
        const pill = line.tone === "accent" ? 2 : 0; // accent text sits in a padded pill
        if (line.right === undefined) {
          out.push(...over("terminal line", line.text, line.text.length + pill, charBudget("terminal", width)));
        } else if (width < COMPACT) {
          const fit = charBudget("terminalRow", width);
          out.push(...over("terminal line", line.text, line.text.length + pill, fit));
          out.push(...over("terminal value", line.right, line.right.length, fit));
        } else {
          const n = line.text.length + pill + line.right.length;
          out.push(...over("terminal line", `${line.text} | ${line.right}`, n, charBudget("terminalRow", width)));
        }
      }
      break;
    case "kv":
      for (const row of block.rows) {
        const pill = row.tone === "accent" ? 2 : 0;
        if (width < COMPACT) {
          out.push(...over("kv key", row.k, row.k.length, charBudget("kv", width)));
          out.push(...over("kv value", row.v, row.v.length + pill, charBudget("kvValue", width)));
        } else {
          out.push(...over("kv row", `${row.k} | ${row.v}`, row.k.length + row.v.length + pill, charBudget("kv", width)));
          out.push(...over("kv value", row.v, row.v.length + pill, charBudget("kvValue", width)));
        }
      }
      break;
    default:
      break;
  }
  return out;
};

/** The narration with every pronounce key taken out: the voice says those as respelled. */
const withoutKeys = (narration: string, pronounce: Record<string, string> | undefined): string => {
  const keys = Object.keys(pronounce ?? {}).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return narration;
  const esc = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return narration.replace(new RegExp(`(?<!\\w)(${keys.map(esc).join("|")})(?!\\w)`, "g"), " ");
};

const slideIssues = (s: Slide, pronounce: Record<string, string> | undefined, checks: string[]): string[] => {
  const out: string[] = [];
  const w = words(s.narration);
  const [lo, hi] = TARGET.perSlide;
  if (w.length < lo || w.length > hi) out.push(`${s.id}: ${w.length} narration words (target ${lo} to ${hi})`);

  // Cues: found, early enough, in stacking order; no uncued block below a cued one.
  const limit = Math.min(w.length - 2, Math.floor(w.length * 0.7));
  let above: {cue: string; at: number} | null = null;
  let cuedAbove = false;
  (s.visual ?? []).forEach((block, k) => {
    if (block.cue === undefined) {
      if (cuedAbove) out.push(`${s.id}: block ${k + 1} has no cue but sits below a cued block, so it appears first`);
      return;
    }
    cuedAbove = true;
    const at = cueAt(w, block.cue);
    if (at === -1) {
      out.push(`${s.id}: cue "${block.cue}" matches no narration word`);
      return;
    }
    if (at >= limit) {
      out.push(`${s.id}: cue "${block.cue}" is word ${at}, but a cue must sit before word ${limit} (counting from 0)`);
    }
    if (above !== null && at < above.at) {
      out.push(`${s.id}: cue "${block.cue}" (word ${at}) fires before the block above it (word ${above.at})`);
    }
    above = {cue: block.cue, at};
  });

  // Headline: about 30 characters a line, one italic word at most, ends with . or ?
  const lines = s.headline.split("\n").map((l) => l.replace(/\*/g, ""));
  for (const line of lines) {
    if (line.length > HEADLINE_LINE) {
      out.push(`${s.id}: headline line "${line}" is ${line.length} characters (about ${HEADLINE_LINE} fit)`);
    }
  }
  const italics = (s.headline.match(/\*[^*]+\*/g) ?? []).length;
  if (italics > 1) out.push(`${s.id}: headline italicises ${italics} words (at most 1)`);
  if (!/[.?]["”’)]*$/.test(lines.join(" ").trim())) {
    out.push(`${s.id}: headline does not end with a period or a question mark`);
  }
  if (s.aside !== undefined && s.aside.length > ASIDE) {
    out.push(`${s.id}: aside is ${s.aside.length} characters (about ${ASIDE} at most)`);
  }

  // Keywords: at most one, and it must be a narration word.
  const kws = s.keywords ?? [];
  if (kws.length > 1) out.push(`${s.id}: ${kws.length} keywords (at most 1)`);
  for (const k of kws) {
    if (!w.some((v) => norm(v) === norm(k))) out.push(`${s.id}: keyword "${k}" is not a narration word`);
  }

  // Narration the voice can't say, apart from words the pronounce map respells. A name with a
  // symbol in it (C++, C#) may be fine as it is, so it is a check to measure, not an issue.
  const spoken = withoutKeys(s.narration, pronounce);
  const nameWithSymbol = /^[A-Za-z][A-Za-z0-9]*[+#]+[.,;:!?]?$/;
  for (const v of words(spoken).filter((v) => nameWithSymbol.test(v))) {
    checks.push(`${s.id}: "${v.replace(/[.,;:!?]$/, "")}" has a symbol in it; check its align ratio, or add a pronounce entry`);
  }
  const bare = words(spoken).filter((v) => !nameWithSymbol.test(v)).join(" ");
  for (const sym of new Set(bare.match(SYMBOLS) ?? [])) {
    if (sym === "_") continue; // reported as an identifier below
    out.push(`${s.id}: narration has symbol "${sym}" (say it in words, or add a pronounce entry)`);
  }
  for (const v of words(spoken)) {
    if (v.includes("_")) out.push(`${s.id}: narration has code identifier "${v}" (show it in a block instead)`);
    if (UNIT.test(v)) out.push(`${s.id}: narration abbreviates a unit "${v.replace(/[.,;:!?]$/, "")}" (spell it out)`);
    if (/^vs\.?$/i.test(v)) out.push(`${s.id}: narration has "vs" (say "versus")`);
  }
  for (const abbr of s.narration.match(/\b(e\.g\.|i\.e\.)/gi) ?? []) {
    out.push(`${s.id}: narration has "${abbr}" (write "for example" or "say")`);
  }

  // Block lines against the width of the column they sit in.
  const split = (s.layout ?? "split") === "split";
  const colW = s.narrator === "big" ? BIG_W : COL_W;
  (s.visual ?? []).forEach((block, k) => {
    out.push(...lineIssues(s.id, block, !split && k === 0 ? FULL_W : colW));
  });
  return out;
};

/**
 * `issues` fail the check; `checks` are things to confirm after voicing (they don't fail it).
 */
export const scriptStats = (script: Script): {issues: string[]; checks: string[]; summary: string} => {
  const issues: string[] = [];
  const checks: string[] = [];
  for (const s of script.slides) issues.push(...slideIssues(s, script.pronounce, checks));

  const counts = script.slides.map((s) => words(s.narration).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const dark = script.slides.filter((s) => s.theme === "dark").length;
  const accent = script.slides.filter((s) => s.theme === "accent").length;
  const sections = new Set(script.slides.map((s) => s.section)).size;
  const range = (name: string, n: number, [lo, hi]: readonly [number, number], unit: string) => {
    if (n < lo || n > hi) issues.push(`script: ${n} ${unit} (target ${lo} ${hi - lo === 1 ? "or" : "to"} ${hi})`);
    return `${name} ${n}`;
  };
  const summary = [
    range("slides", script.slides.length, TARGET.slides, "slides"),
    range("words", total, TARGET.words, "narration words"),
    `per slide ${Math.min(...counts)} to ${Math.max(...counts)}`,
    range("dark", dark, TARGET.dark, "dark slides"),
    range("accent", accent, TARGET.accent, "accent slides"),
    range("sections", sections, TARGET.sections, "sections"),
  ].join(" · ");
  return {issues, checks, summary};
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const slug = process.argv[2];
  if (!slug) {
    console.error("usage: pnpm stats <slug>");
    process.exit(1);
  }
  const path = `videos/${slug}/script.json`;
  const parsed = ScriptSchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
  if (!parsed.success) {
    console.error(`${path} does not parse; run pnpm validate ${slug} first`);
    process.exit(1);
  }
  const {issues, checks, summary} = scriptStats(parsed.data);
  for (const issue of issues) console.log(issue);
  for (const check of checks) console.log(`check: ${check}`);
  console.log(summary);
  console.log(issues.length ? `${issues.length} issues` : "no issues");
  process.exit(issues.length ? 1 : 0);
}
