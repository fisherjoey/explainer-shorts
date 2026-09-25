import {expect, it} from "vitest";
import {revealFrames} from "../cues";
const slide: any = {id: "s01", section: "A", headline: "h", narration: "x",
  visual: [{type: "note", text: "n"}, {type: "chips", items: [], cue: "token"}, {type: "arrow"}]};
it("uses cue word time minus 3 frames, else stagger", () => {
  const words = [{text: "the", start: 10.0, end: 10.1, slide: "s01"}, {text: "tokens,", start: 11.0, end: 11.3, slide: "s01"}];
  expect(revealFrames(slide, words, 10.0, 30)).toEqual([8, 27, 18]);
});
it("unmatched cue falls back to stagger", () => {
  expect(revealFrames(slide, [], 0, 30)).toEqual([8, 13, 18]);
});
