import type {Slide, Word} from "./schema";
import {norm} from "./text";

export const revealFrames = (
  slide: Slide,
  slideWords: Word[],
  slideStartSec: number,
  fps: number,
): number[] => {
  const blocks = slide.visual ?? [];
  return blocks.map((block, index) => {
    const cue = (block as {cue?: string}).cue;
    if (cue) {
      const normCue = norm(cue);
      const match = slideWords.find((word) => norm(word.text).startsWith(normCue));
      if (match) {
        return Math.max(0, Math.round((match.start - slideStartSec) * fps) - 3);
      }
    }
    return 8 + index * 5;
  });
};
