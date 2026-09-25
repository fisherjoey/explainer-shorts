import type {CSSProperties, FC} from "react";
import {AbsoluteFill} from "remotion";
import type {Slide} from "../schema";
import {C, F, FM, L, baselineTop} from "../theme";

export type Theme = NonNullable<Slide["theme"]>;

export type Palette = {page: string; ink: string; muted: string; kicker: string; rule: string; divider: string};

export const palette = (theme: Theme): Palette =>
  theme === "dark"
    ? {page: C.darkPage, ink: C.darkInk, muted: C.darkMuted, kicker: C.darkKicker, rule: C.darkRule, divider: C.darkDivider}
    : {page: C.page, ink: C.ink, muted: C.muted, kicker: C.kicker, rule: C.rule, divider: C.divider};

const pad2 = (n: number): string => String(n).padStart(2, "0");

const HEADER_SIZE = 26;

/** Full-frame page: background, header row (asterisk, section, counter) and the rule under it. */
export const Page: FC<{theme: Theme; slideIndex: number; slideCount: number; section: string}> = ({
  theme,
  slideIndex,
  slideCount,
  section,
}) => {
  const p = palette(theme);
  const header: CSSProperties = {
    position: "absolute",
    left: L.margin,
    right: L.margin,
    top: baselineTop(L.headerY, HEADER_SIZE, FM.mono),
    display: "flex",
    justifyContent: "space-between",
    fontFamily: F.mono,
    fontSize: HEADER_SIZE,
    lineHeight: 1,
    letterSpacing: "0.1em",
    color: p.muted,
    textTransform: "uppercase",
    whiteSpace: "pre",
  };
  return (
    <AbsoluteFill style={{backgroundColor: p.page}}>
      <div style={header}>
        <span>
          <span style={{color: C.accent}}>✱</span> {section}
        </span>
        <span>
          {pad2(slideIndex + 1)} / {pad2(slideCount)}
        </span>
      </div>
      <div
        style={{position: "absolute", left: L.margin, right: L.margin, top: L.ruleY, height: 1, backgroundColor: p.rule}}
      />
    </AbsoluteFill>
  );
};
