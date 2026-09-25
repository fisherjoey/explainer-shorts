import type {FC} from "react";
import {AbsoluteFill} from "remotion";
import type {CaptionWindow} from "./captions";
import {CaptionPill} from "./components/CaptionPill";
import {Slide} from "./components/Slide";
import type {NarratorImages, Script, Word} from "./schema";

export type SlideStillProps = {script: Script; index: number; narratorImages?: NarratorImages};

/** One slide with the narrator and a static caption: its first 5 narration words, the 3rd current. */
export const SlideStill: FC<SlideStillProps> = ({script, index, narratorImages}) => {
  const slide = script.slides[index];
  const words: Word[] = slide.narration
    .split(/\s+/)
    .filter((w) => w !== "")
    .slice(0, 5)
    .map((text, i) => ({text, start: i, end: i + 1, slide: slide.id}));
  const win: CaptionWindow = {words, start: 0, end: words.length};
  const time = words[Math.min(2, words.length - 1)]?.start ?? 0;

  return (
    <AbsoluteFill>
      <Slide slide={slide} index={index} count={script.slides.length} words={[]} slideStartSec={0} showNarrator narratorImages={narratorImages} />
      {words.length > 0 && <CaptionPill window={win} time={time} keywords={slide.keywords ?? []} />}
    </AbsoluteFill>
  );
};
