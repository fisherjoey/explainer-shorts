import {Fragment, type CSSProperties, type FC, type ReactNode} from "react";
import {Easing, interpolate, interpolateColors, useCurrentFrame} from "remotion";
import type {Slide} from "../schema";
import {C, F, L} from "../theme";
import {palette} from "./Page";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

type Type = {size: number; lineHeight: number; dy: number};

const BASE: Type = {size: 64, lineHeight: 1.08, dy: 0};
// Emphasis headlines (chapter openers and the dark turn): 90 px at a 94 px pitch, first baseline
// at y 333 (hence the 6 px drop).
export const EMPHASIS: Type = {size: 90, lineHeight: 1.04, dy: 6};
// The accent band: 76 px in EB Garamond, one line for ~30 characters.
export const BAND: Type = {size: 76, lineHeight: 1.04, dy: 0};
const MAX_W = 800;
const BAND_PAD = {y: 35, x: 60}; // a one-line band is 150 px tall
const KICKER_H = 24; // the kicker's line box (24 px mono, line-height 1)
// First baseline below the top of a line box, in em: half the line height plus the font's
// (ascent − descent) / 2, calibrated at 64 px to put the first baseline at 305.5.
const baselineEm = (lineHeight: number) => lineHeight / 2 + 0.358;
// Line box bottom below its baseline, in px.
const belowBaseline = ({size, lineHeight}: Type) => (lineHeight - baselineEm(lineHeight)) * size;
// The accent rule under a light emphasis headline (the JWT chapter slides): 400 × 4 px with its
// top 0.38 em below the last baseline, drawn in after the headline has faded up.
const RULE = {w: 400, h: 4, gapEm: 0.38};
const RULE_MARGIN = Math.round(RULE.gapEm * EMPHASIS.size - belowBaseline(EMPHASIS));

const isBand = (slide: Slide) => slide.theme === "accent";
const hasRule = (slide: Slide) => slide.emphasis === true && (slide.theme ?? "light") === "light";
const typeOf = (slide: Slide): Type => (isBand(slide) ? BAND : slide.emphasis === true ? EMPHASIS : BASE);

/**
 * Space between the headline region (kicker, headline, rule) and the first block. Band and
 * emphasis headlines: L.headGap below their lowest mark (band edge, rule, or last baseline).
 * Normal headlines: at least L.headGapMin; the slide also holds their blocks at the measured tops.
 */
export const headlineGap = (slide: Slide): number => {
  if (isBand(slide) || hasRule(slide)) return L.headGap;
  if (slide.emphasis === true) return Math.round(L.headGap - belowBaseline(EMPHASIS));
  return L.headGapMin;
};

// `*word*` renders italic.
const renderLine = (line: string, key: number): ReactNode[] =>
  line
    .split(/(\*[^*]+\*)/g)
    .filter((part) => part !== "")
    .map((part, i) =>
      part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
        <em key={`${key}-${i}`} style={{fontStyle: "italic"}}>
          {part.slice(1, -1)}
        </em>
      ) : (
        <Fragment key={`${key}-${i}`}>{part}</Fragment>
      ),
    );

/**
 * Kicker plus headline, in normal flow from the top of a container placed at L.kickerY: the
 * kicker's line box, then the headline at L.headlineY (the band at L.bandTop), then — for a light
 * emphasis headline — the accent rule straight under its last line. Fades in (opacity, and colour
 * muted → ink) over frames 0–10. `emphasis` sets EMPHASIS size; the accent band uses BAND.
 */
export const Headline: FC<{slide: Slide}> = ({slide}) => {
  const frame = useCurrentFrame();
  const theme = slide.theme ?? "light";
  const p = palette(theme);
  const opacity = interpolate(frame, [0, 10], [0, 1], clamp);
  const color = interpolateColors(frame, [0, 10], [p.muted, p.ink]);
  const ruleW = interpolate(frame, [12, 30], [0, RULE.w], {...clamp, easing: Easing.out(Easing.cubic)});
  const {size, lineHeight, dy} = typeOf(slide);

  const text = slide.headline.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {renderLine(line, i)}
    </Fragment>
  ));
  const type: CSSProperties = {
    fontFamily: F.serif,
    fontSize: size,
    fontWeight: 400,
    lineHeight,
    letterSpacing: "-0.0175em",
  };

  return (
    <>
      <div
        style={{
          height: KICKER_H,
          fontFamily: F.mono,
          fontSize: 24,
          lineHeight: 1,
          letterSpacing: "0.12em",
          color: p.kicker,
          textTransform: "uppercase",
          whiteSpace: "pre",
          opacity,
        }}
      >
        {slide.kicker ? `✱ ${slide.kicker}` : null}
      </div>
      {isBand(slide) ? (
        <div
          style={{
            marginTop: L.bandTop - L.kickerY - KICKER_H,
            backgroundColor: C.accent,
            padding: `${BAND_PAD.y}px ${BAND_PAD.x}px`,
            opacity,
          }}
        >
          <div style={{...type, color: "#FFF7F0"}}>{text}</div>
        </div>
      ) : (
        <div style={{marginTop: L.headlineY - L.kickerY - KICKER_H + dy, maxWidth: MAX_W, ...type, color, opacity}}>
          {text}
        </div>
      )}
      {hasRule(slide) && (
        <div style={{marginTop: RULE_MARGIN, width: ruleW, height: RULE.h, backgroundColor: C.accent}} />
      )}
    </>
  );
};
