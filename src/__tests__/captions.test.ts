import {expect, it} from "vitest";
import {buildWindows} from "../captions";
const w = (text: string, start: number, slide = "s01") => ({text, start, end: start + 0.2, slide});
it("caps windows at 5 words", () => {
  const ws = ["a","b","c","d","e","f","g"].map((t, i) => w(t, i * 0.25));
  expect(buildWindows(ws).map(x => x.words.length)).toEqual([5, 2]);
});
it("breaks after punctuation", () => {
  const ws = [w("Both", 0), w("solve", .25), w("problems,", .5), w("keeping", .75), w("users", 1)];
  expect(buildWindows(ws).map(x => x.words.map(y => y.text).join(" "))).toEqual(["Both solve problems,", "keeping users"]);
});
it("breaks on long pauses and slide changes", () => {
  const ws = [w("a", 0), w("b", 1.2), w("c", 1.45, "s02")];
  expect(buildWindows(ws).length).toBe(3);
});
it("window end is the next window start; last gets +0.4", () => {
  const ws = [w("a.", 0), w("b", 0.5)];
  const out = buildWindows(ws);
  expect(out[0].end).toBe(0.5);
  expect(out[1].end).toBeCloseTo(1.1);
});
it("breaks before a word that would take the window past 30 characters", () => {
  const ws = [w("authentication", 0), w("authorization", 0.25), w("middleware", 0.5)];
  expect(buildWindows(ws).map(x => x.words.map(y => y.text).join(" "))).toEqual([
    "authentication authorization",
    "middleware",
  ]);
});
it("gives a word longer than 30 characters its own window", () => {
  const long = "a".repeat(35);
  const ws = [w("hi", 0), w(long, 0.25), w("there", 0.5)];
  expect(buildWindows(ws).map(x => x.words.map(y => y.text))).toEqual([["hi"], [long], ["there"]]);
});
