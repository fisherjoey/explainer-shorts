import type {Timing} from "./schema";

export const slideFrames = (
  timing: Timing,
  fps: number,
): {id: string; from: number; duration: number}[] => {
  return timing.slides.map((slide, i) => {
    const from = i === 0 ? 0 : Math.round(slide.start * fps);
    const to = Math.round(slide.end * fps);
    return {id: slide.id, from, duration: to - from};
  });
};
