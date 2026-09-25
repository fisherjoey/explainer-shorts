import {Audio} from "@remotion/media";
import {useMemo, type FC} from "react";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {buildWindows} from "./captions";
import {CaptionPill} from "./components/CaptionPill";
import {Narrator, narratorPose} from "./components/Narrator";
import {Slide} from "./components/Slide";
import type {VideoProps, Word} from "./schema";
import {slideFrames} from "./timing";

const PILL_FADE = 3;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

// First frame at or after time `t` (the epsilon keeps 3.6 s at frame 108, not 109).
const frameAt = (t: number, fps: number) => Math.ceil(t * fps - 1e-6);

/**
 * The full video. Layers, bottom to top: slides (one Sequence each, tiled by timing.json), one
 * persistent narrator picture in the active slide's pose (so it never jumps between slides that
 * share a pose), the karaoke caption for the current window, and the narration audio.
 *
 * Slides cut: the new page is fully there on its first frame and the old slide is gone; only the
 * content animates in (the headline's grey-to-ink fade, block reveals).
 */
export const ExplainerVideo: FC<VideoProps> = ({script, timing, words, audioSrc, narratorImages}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const frames = useMemo(() => slideFrames(timing, fps), [timing, fps]);
  const windows = useMemo(() => buildWindows(words), [words]);
  const wordsBySlide = useMemo(() => {
    const by = new Map<string, Word[]>();
    for (const word of words) {
      const list = by.get(word.slide);
      if (list) list.push(word);
      else by.set(word.slide, [word]);
    }
    return by;
  }, [words]);

  let active = 0;
  frames.forEach((f, i) => {
    if (f.from <= frame) active = i;
  });
  const activeSlide = script.slides[active];
  const pose = narratorPose(activeSlide, active);

  const win = windows.find((w) => frameAt(w.start, fps) <= frame && frame < frameAt(w.end, fps));
  const winStart = win ? frameAt(win.start, fps) : 0;
  // The first frame of a window already shows the pill at 1/3, so a window change never blanks it.
  const pillOpacity = interpolate(frame, [winStart - 1, winStart - 1 + PILL_FADE], [0, 1], clamp);
  const winSlide = win && script.slides.find((s) => s.id === win.words[0].slide);

  return (
    <AbsoluteFill>
      {frames.map((f, i) => {
        const slide = script.slides[i];
        // The last slide runs to the composition's end: ceil(total * fps) can be a frame past
        // slideFrames' round(end * fps), and that frame must not be blank.
        const duration = i === frames.length - 1 ? Math.max(f.duration, durationInFrames - f.from) : f.duration;
        return (
          <Sequence key={slide.id} name={slide.id} from={f.from} durationInFrames={duration}>
            <Slide
              slide={slide}
              index={i}
              count={script.slides.length}
              words={wordsBySlide.get(slide.id) ?? []}
              slideStartSec={timing.slides[i].start}
              showNarrator={false}
            />
          </Sequence>
        );
      })}
      {pose !== "hidden" && <Narrator pose={pose} dark={activeSlide.theme === "dark"} images={narratorImages} />}
      {win && (
        <AbsoluteFill style={{opacity: pillOpacity}}>
          <CaptionPill window={win} time={frame / fps} keywords={winSlide?.keywords ?? []} />
        </AbsoluteFill>
      )}
      <Audio src={staticFile(audioSrc)} />
    </AbsoluteFill>
  );
};
