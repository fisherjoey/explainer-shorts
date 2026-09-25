import {describe, expect, it} from "vitest";
import fixture from "../../videos/_fixture/script.json";
import {ScriptSchema} from "../schema";
import {checkScript} from "../../scripts/validate";

describe("schema", () => {
  it("accepts the fixture", () => {
    expect(ScriptSchema.safeParse(fixture).success).toBe(true);
    expect(checkScript(fixture).errors).toEqual([]);
  });
  it("rejects unknown block types", () => {
    const bad = structuredClone(fixture) as any;
    bad.slides[0].visual = [{type: "hologram"}];
    expect(checkScript(bad).errors.length).toBeGreaterThan(0);
  });
  it("rejects duplicate ids, empty narration and 3-line headlines", () => {
    const bad = structuredClone(fixture) as any;
    bad.slides[1].id = bad.slides[0].id;
    bad.slides[2].narration = "";
    bad.slides[3].headline = "a\nb\nc";
    const {errors} = checkScript(bad);
    expect(errors.join("\n")).toMatch(/duplicate/i);
    expect(errors.join("\n")).toMatch(/narration/i);
    expect(errors.join("\n")).toMatch(/headline/i);
  });
  it("takes emphasis as an optional boolean", () => {
    const ok = structuredClone(fixture) as any;
    ok.slides[0].emphasis = true;
    expect(ScriptSchema.parse(ok).slides[0].emphasis).toBe(true);
    const bad = structuredClone(fixture) as any;
    bad.slides[0].emphasis = "yes";
    expect(ScriptSchema.safeParse(bad).success).toBe(false);
  });
  it("puts an aside only on a split slide with a non-big narrator", () => {
    const id = (i: number) => (fixture as any).slides[i].id;
    const bad = structuredClone(fixture) as any;
    bad.slides[1].aside = "a remark";
    bad.slides[1].layout = "full";
    bad.slides[1].narrator = "idle";
    bad.slides[2].aside = "a remark";
    bad.slides[2].layout = "split";
    bad.slides[2].narrator = "big";
    const {errors} = checkScript(bad);
    expect(errors).toContain(`${id(1)}: aside needs layout split and a non-big narrator`);
    expect(errors).toContain(`${id(2)}: aside needs layout split and a non-big narrator`);
    const ok = structuredClone(fixture) as any;
    ok.slides[1].aside = "a remark";
    delete ok.slides[1].layout;
    ok.slides[1].narrator = "look";
    expect(checkScript(ok).errors).toEqual([]);
  });
  it("puts a big narrator only on a split slide", () => {
    const id = (i: number) => (fixture as any).slides[i].id;
    const bad = structuredClone(fixture) as any;
    delete bad.slides[1].aside;
    bad.slides[1].layout = "full";
    bad.slides[1].narrator = "big";
    expect(checkScript(bad).errors).toEqual([`${id(1)}: big narrator needs layout split`]);
    const ok = structuredClone(fixture) as any;
    delete ok.slides[1].aside;
    delete ok.slides[1].layout;
    ok.slides[1].narrator = "big";
    expect(checkScript(ok).errors).toEqual([]);
  });
  it("fixture covers aside, big narrator (split), full layout and a dark theme", () => {
    const slides = (fixture as any).slides as any[];
    const asides = slides.filter((s) => s.aside);
    const bigs = slides.filter((s) => s.narrator === "big");
    expect(asides.length).toBeGreaterThan(0);
    expect(bigs.length).toBeGreaterThan(0);
    expect(asides.some((s) => s.narrator === "big")).toBe(false);
    expect(bigs.every((s) => (s.layout ?? "split") === "split")).toBe(true);
    expect(slides.some((s) => s.layout === "full")).toBe(true);
    expect(slides.some((s) => s.theme === "dark")).toBe(true);
  });
  it("takes pronounce as an optional word-to-spoken-form map", () => {
    expect(ScriptSchema.parse(fixture).pronounce).toEqual({HttpOnly: "HTTP only"});
    const none = structuredClone(fixture) as any;
    delete none.pronounce;
    expect(ScriptSchema.safeParse(none).success).toBe(true);
    const bad = structuredClone(fixture) as any;
    bad.pronounce = {HttpOnly: 3};
    expect(ScriptSchema.safeParse(bad).success).toBe(false);
  });
  it("warns (not errors) on total length", () => {
    const {errors, warnings} = checkScript(fixture);
    expect(errors).toEqual([]);
    expect(warnings.join("\n")).toMatch(/words/);
  });
});
