import {expect, it} from "vitest";
import {slideFrames} from "../timing";
it("tiles frames without gaps and starts at 0", () => {
  const f = slideFrames({fps: 30, total: 7.2, slides: [
    {id: "a", start: 0.1, end: 2.35}, {id: "b", start: 2.35, end: 5.6}, {id: "c", start: 5.6, end: 7.2}]}, 30);
  expect(f[0].from).toBe(0);
  for (let i = 1; i < f.length; i++) expect(f[i].from).toBe(f[i - 1].from + f[i - 1].duration);
  expect(f.at(-1)!.from + f.at(-1)!.duration).toBe(216);
});
