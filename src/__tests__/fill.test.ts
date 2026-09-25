import {describe, expect, it} from "vitest";
import fixture from "../../videos/_fixture/script.json";
import {fills, stretches} from "../fill";
import {ScriptSchema, type Block} from "../schema";

const term: Block = {type: "terminal", title: "T", lines: [{text: "x"}]};
const code: Block = {type: "code", code: "x"};
const fullCard: Block = {type: "card", label: "L", title: "Title", body: "Body text."};
const titleOnly: Block = {type: "card", label: "L", title: "Just a title."};
const bodyOnly: Block = {type: "card", label: "L", body: "Just a body."};
const note: Block = {type: "note", text: "n"};

describe("stretches", () => {
  it("stretches terminals, code, and cards with both a title and a body", () => {
    expect(stretches(term)).toBe(true);
    expect(stretches(code)).toBe(true);
    expect(stretches(fullCard)).toBe(true);
  });
  it("leaves short cards and other blocks at their natural height", () => {
    expect(stretches(titleOnly)).toBe(false);
    expect(stretches(bodyOnly)).toBe(false);
    expect(stretches(note)).toBe(false);
  });
});

describe("fills", () => {
  it("fills a column holding two or more stretching panels", () => {
    expect(fills([term, fullCard])).toBe(true);
    expect(fills([code, note, term])).toBe(true);
  });
  it("does not fill for one panel, or for short cards", () => {
    expect(fills([term])).toBe(false);
    expect(fills([term, titleOnly])).toBe(false);
    expect(fills([titleOnly, bodyOnly])).toBe(false);
    expect(fills([])).toBe(false);
  });
  it("is covered by a _fixture slide: a filled split column with a short card in it", () => {
    const slides = ScriptSchema.parse(fixture).slides;
    const covered = slides.filter(
      (s) => (s.layout ?? "split") === "split" && fills(s.visual ?? []) && (s.visual ?? []).some((b) => !stretches(b)),
    );
    expect(covered.length).toBeGreaterThan(0);
  });
});
