import type {CSSProperties, FC, ReactNode} from "react";
import {AbsoluteFill, useVideoConfig} from "remotion";
import {revealFrames} from "../cues";
import {fills, stretches} from "../fill";
import type {Block, NarratorImages, Slide as SlideData, Word} from "../schema";
import {F, L} from "../theme";
import {renderBlock} from "./blocks";
import {Headline, headlineGap} from "./Headline";
import {Page, palette} from "./Page";
import {Narrator, narratorPose} from "./Narrator";
import {Reveal} from "./Reveal";

const FULL_W = 1080 - 2 * L.margin;

/**
 * A column of blocks in flow, `left` px in from the content edge (L.margin). With `fill`, an empty
 * L.fillSpacer share closes it, so the stretched panels stop short of the caption area.
 */
const Stack: FC<{left: number; width: number; fill: boolean; style?: CSSProperties; children: ReactNode}> = ({
  left,
  width,
  fill,
  style,
  children,
}) => (
  <div
    style={{
      marginLeft: left,
      width,
      display: "flex",
      flexDirection: "column",
      gap: L.blockGap,
      flex: "1 0 auto",
      ...style,
    }}
  >
    {children}
    {fill && <div style={{flex: `${L.fillSpacer} 1 0`, marginTop: -L.blockGap}} />}
  </div>
);

/**
 * One slide's layout shell: page, then one flow region from L.kickerY to L.fillBottom — kicker,
 * headline (and accent rule), blocks by layout (each revealed at its cue), the full layout's
 * stacked column after visual[0] — plus the aside fixed in the left column, and the narrator when
 * `showNarrator` (the video renders one persistent narrator instead). Nothing below the headline is
 * positioned from an estimate of how many lines it wraps to. A column with two or more stretching
 * panels (terminal, code, a card with a title and a body; see `stretches`) shares the height down
 * to L.fillBottom between them; content taller than that region still overflows downward as
 * before, never squashed.
 */
export const Slide: FC<{
  slide: SlideData;
  index: number;
  count: number;
  words: Word[];
  slideStartSec: number;
  showNarrator: boolean;
  narratorImages?: NarratorImages;
}> = ({slide, index, count, words, slideStartSec, showNarrator, narratorImages}) => {
  const {fps} = useVideoConfig();
  const theme = slide.theme ?? "light";
  const dark = theme === "dark";
  const p = palette(theme);
  const reveal = revealFrames(slide, words, slideStartSec, fps);
  const blocks = slide.visual ?? [];
  const pose = narratorPose(slide, index);
  const layout = slide.layout ?? "split";
  // A big narrator is wider than the left column, so the block column starts right of it and the
  // blocks re-flow to the narrower width. Keyed on the pose, not `showNarrator`: the video's
  // persistent narrator takes the same pose.
  const colX = pose === "big" ? L.colXBig : L.colX;
  const colW = L.colRight - colX;
  // Blocks start `gap` below the headline region, and never above the measured top for the
  // layout (a min-height on the region): a normal two-line headline leaves them exactly at
  // L.colTop / L.fullTop; band and emphasis headlines push them down by what they actually take.
  const anchor = layout === "split" ? L.colTop : L.fullTop;
  const gap = headlineGap(slide);

  const item = (block: Block, i: number, width: number, fill: boolean) => {
    const grow = fill && stretches(block);
    return (
      <Reveal key={i} delay={reveal[i]} grow={grow}>
        {renderBlock(block, {dark, width, fill: grow})}
      </Reveal>
    );
  };
  const splitFill = fills(blocks);
  const columnFill = fills(blocks.slice(1));

  return (
    <AbsoluteFill>
      <Page theme={theme} slideIndex={index} slideCount={count} section={slide.section} />
      <div
        style={{
          position: "absolute",
          left: L.margin,
          top: L.kickerY,
          width: FULL_W,
          height: L.fillBottom - L.kickerY,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{minHeight: anchor - L.kickerY - gap, flexShrink: 0}}>
          <Headline slide={slide} />
        </div>
        <div style={{marginTop: gap, flex: "1 0 auto", display: "flex", flexDirection: "column"}}>
          {layout === "split" ? (
            <Stack left={colX - L.margin} width={colW} fill={splitFill}>
              {blocks.map((block, i) => item(block, i, colW, splitFill))}
            </Stack>
          ) : (
            <>
              {blocks.length > 0 && item(blocks[0], 0, FULL_W, false)}
              {blocks.length > 1 && (
                <Stack left={colX - L.margin} width={colW} fill={columnFill} style={{marginTop: L.blockGap}}>
                  {blocks.slice(1).map((block, j) => item(block, j + 1, colW, columnFill))}
                </Stack>
              )}
            </>
          )}
        </div>
      </div>
      {/* The aside lives in the left column, above the narrator, at a fixed y whatever the
          headline takes (headlines are capped at two lines and end above ~y 500). The validator
          allows it only on split slides with a normal-size narrator, where that column is free. */}
      {slide.aside && (
        <div
          style={{
            position: "absolute",
            left: L.margin,
            top: L.asideTop,
            width: L.asideW,
            fontFamily: F.sans,
            fontSize: 30,
            lineHeight: 1.43,
            color: p.muted,
          }}
        >
          {slide.aside}
        </div>
      )}
      {showNarrator && pose !== "hidden" && <Narrator pose={pose} dark={dark} images={narratorImages} />}
    </AbsoluteFill>
  );
};
