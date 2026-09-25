import {describe, expect, it} from "vitest";
import example from "../../videos/stack-vs-heap/script.json";
import {charBudget, scriptStats} from "../../scripts/stats";
import {ScriptSchema, type Block, type Script, type Slide} from "../schema";

const slide = (over: Partial<Slide>): Slide => ({
  id: "s01",
  section: "A",
  headline: "A short claim.",
  narration: "The server creates a session record and stores it in Redis.",
  ...over,
});
const script = (...slides: Slide[]): Script => ({slug: "t", title: "T", slides});
const issues = (...slides: Slide[]) => scriptStats(script(...slides)).issues.filter((i) => i.startsWith("s0"));

const term = (cue?: string): Block => ({type: "terminal", cue, title: "T", lines: [{text: "x"}]});

describe("scriptStats", () => {
  it("passes a slide that meets every target", () => {
    expect(issues(slide({visual: [term("session"), {type: "note", cue: "record", text: "n"}]}))).toEqual([]);
  });
  it("flags word counts outside 9 to 15", () => {
    expect(issues(slide({narration: "Too short to count."}))).toEqual(["s01: 4 narration words (target 9 to 15)"]);
  });
  it("states the cue limit exactly: before word floor(0.7 × words), never the last two", () => {
    // 11 words: limit min(11 - 2, floor(7.7)) = 7, so word 6 ("and") passes and word 7 ("stores") fails.
    expect(issues(slide({visual: [term("and")]}))).toEqual([]);
    expect(issues(slide({visual: [term("stores")]}))).toEqual([
      's01: cue "stores" is word 7, but a cue must sit before word 7 (counting from 0)',
    ]);
    expect(issues(slide({visual: [term("banana")]}))).toEqual(['s01: cue "banana" matches no narration word']);
  });
  it("flags cues out of stacking order, and uncued blocks below cued ones", () => {
    expect(issues(slide({visual: [term("record"), term("server")]}))).toEqual([
      's01: cue "server" (word 1) fires before the block above it (word 5)',
    ]);
    expect(issues(slide({visual: [term("server"), term()]}))).toEqual([
      "s01: block 2 has no cue but sits below a cued block, so it appears first",
    ]);
  });
  it("flags narration the voice cannot say", () => {
    const got = issues(
      slide({narration: "Add 3 + 4, then we call make_scores, which uses 8 MB or more of the stack, e.g. a lot."}),
    );
    expect(got.some((i) => /symbol "\+"/.test(i))).toBe(true);
    expect(got.some((i) => /identifier "make_scores,"/.test(i))).toBe(true);
    expect(got.some((i) => /unit "MB"/.test(i))).toBe(true);
    expect(got.some((i) => /"e\.g\."/.test(i))).toBe(true);
  });
  it("makes a name with a symbol a check to measure, and a pronounce entry clears it", () => {
    const s = slide({narration: "In C++ and Java, the new keyword allocates on the heap."});
    const raw = scriptStats(script(s));
    expect(raw.issues.filter((i) => i.startsWith("s01"))).toEqual([]);
    expect(raw.checks).toEqual(['s01: "C++" has a symbol in it; check its align ratio, or add a pronounce entry']);
    const covered = scriptStats({...script(s), pronounce: {"C++": "C plus plus"}});
    expect(covered.checks).toEqual([]);
    const bare = scriptStats({...script(slide({narration: "Take 3 + 4, and the stack keeps the result for you."}))});
    expect(bare.issues).toContain('s01: narration has symbol "+" (say it in words, or add a pronounce entry)');
  });
  it("checks keywords, headline shape and aside length", () => {
    const got = issues(
      slide({
        keywords: ["cookie"],
        headline: "A headline line that runs far too long.\n*Two* *italics*",
        aside: "x".repeat(71),
      }),
    );
    expect(got).toContain('s01: keyword "cookie" is not a narration word');
    expect(got).toContain('s01: headline line "A headline line that runs far too long." is 39 characters (about 30 fit)');
    expect(got).toContain("s01: headline italicises 2 words (at most 1)");
    expect(got).toContain("s01: headline does not end with a period or a question mark");
    expect(got).toContain("s01: aside is 71 characters (about 70 at most)");
  });
  it("flags block lines wider than their column", () => {
    const line = "ret               // w0 = 12, back to main"; // 42 characters
    const code: Block = {type: "code", title: "C", code: line};
    expect(issues(slide({visual: [code]}))).toEqual([
      `s01: code line "${line}" is 42 characters; 37 fit at 640 px`,
    ]);
    // The same line is fine as a full-width first block.
    expect(issues(slide({layout: "full", visual: [code]}))).toEqual([]);
  });
  it("summarises the arc targets", () => {
    const {summary, issues: all} = scriptStats(script(slide({})));
    expect(summary).toMatch(/^slides 1 · words 11 · per slide 11 to 11 · dark 0 · accent 0 · sections 1/);
    expect(all).toContain("script: 1 slides (target 40 to 48)");
    expect(all).toContain("script: 11 narration words (target 520 to 580)");
    expect(all).toContain("script: 0 dark slides (target 1 or 2)");
  });
  it("passes the finished stack-vs-heap example", () => {
    expect(scriptStats(ScriptSchema.parse(example)).issues).toEqual([]);
  });
});

describe("charBudget", () => {
  it("matches the kit's type sizes", () => {
    expect(charBudget("code", 640)).toBe(37);
    expect(charBudget("code", 960)).toBe(58);
    expect(charBudget("terminal", 640)).toBe(40);
    expect(charBudget("terminal", 482)).toBe(29);
  });
});
