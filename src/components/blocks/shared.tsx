import type {CSSProperties, FC, ReactNode} from "react";
import type {Block, Tone} from "../../schema";
import {C, F, toneColor} from "../../theme";

/** `fill`: the block is a stretched panel, and its root grows to the height its slot is given. */
export type Ctx = {dark: boolean; width: number; fill?: boolean};
export type BlockOf<T extends Block["type"]> = Extract<Block, {type: T}>;
export type BlockProps<T extends Block["type"]> = {block: BlockOf<T>; ctx: Ctx};

/** Below this width (a half-width `row` cell) the mono type steps down so lines still fit. */
export const COMPACT = 420;

/** Light-surface colours (cards, tables, tiles); on dark slides they become dark cards. */
export type Surface = {
  card: string;
  border: string;
  ink: string;
  body: string;
  muted: string;
  label: string;
  inset: string;
};

export const surface = (dark: boolean): Surface =>
  dark
    ? {
        card: C.darkCard,
        border: C.darkRule,
        ink: C.darkInk,
        body: C.darkBody,
        muted: C.darkMuted,
        label: C.darkMuted,
        inset: C.darkPage,
      }
    : {card: C.beige, border: C.beigeBorder, ink: C.ink, body: C.body, muted: C.muted, label: C.kicker, inset: C.page};

/** Text colour for a tone, on a light surface (page, beige) or a dark one (terminal, dark card). */
export const toneInk = (tone: Tone | undefined, onDark: boolean): string => {
  const t = tone ?? "default";
  if (onDark) {
    switch (t) {
      case "muted":
        return C.termMuted;
      case "accent":
        return C.accent;
      case "teal":
        return C.codeKey;
      case "orange":
        return C.codeStr;
      case "mint":
        return C.mintInk;
      case "peach":
        return C.peachInk;
      default:
        return C.termText;
    }
  }
  switch (t) {
    case "muted":
      return C.muted;
    case "accent":
    case "orange":
      return C.accentDeep;
    case "teal":
    case "mint":
      return C.good;
    default:
      return C.ink;
  }
};

/**
 * Fill for a filled tone (chips, pills, segments). Fills carry ink text, accent included: the
 * accent pills and segments are dark type on terracotta.
 */
export const fill = (tone: Tone, dark: boolean): {bg: string; fg: string; border: string} => {
  const s = surface(dark);
  switch (tone) {
    case "dark":
      return {bg: C.term, fg: C.termText, border: C.termBorder};
    case "default":
    case "beige":
      return {bg: s.card, fg: s.ink, border: s.border};
    case "muted":
    case "teal":
    case "orange":
      return {bg: "transparent", fg: toneInk(tone, dark), border: s.border};
    default: {
      const bg = toneColor(tone).bg;
      return {bg, fg: C.ink, border: bg};
    }
  }
};

/** Mono, uppercase, letter-spaced label (card labels, table headers, meter labels). */
export const labelStyle = (color: string, fontSize = 21): CSSProperties => ({
  fontFamily: F.mono,
  fontSize,
  lineHeight: 1.3,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color,
});

/** Small fully-rounded pill: accent unless a tone says otherwise (tags, highlighted values). */
export const Pill: FC<{tone?: Tone; dark?: boolean; size?: number; children: ReactNode}> = ({
  tone = "accent",
  dark = false,
  size = 18,
  children,
}) => {
  const f = fill(tone, dark);
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: F.mono,
        fontSize: size,
        lineHeight: 1.35,
        padding: "3px 12px",
        borderRadius: 999,
        background: f.bg,
        color: f.fg,
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowWrap: "anywhere",
        verticalAlign: "middle",
      }}
    >
      {children}
    </span>
  );
};

/** The three window dots of terminal and browser title bars (9 px, 19 px pitch). */
export const Dots: FC<{color: string}> = ({color}) => (
  <div style={{display: "flex", gap: 10, flexShrink: 0}}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{width: 9, height: 9, borderRadius: 5, background: color}} />
    ))}
  </div>
);

/** A drawn check mark (the fonts have no ✓ of their own). */
export const CheckMark: FC<{color: string; size: number}> = ({color, size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: "block"}}>
    <path d="M4.5 12.5 L9.5 17.5 L19.5 6" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Dark panel shared by terminal and code: 1 px frame, a 49 px title bar (dots + letter-spaced
 * title) over a lighter 1 px rule, body padded 22/25. With
 * `fill` it grows to its slot's height, lines staying at the top.
 */
export const TermShell: FC<{title?: string; width: number; minHeight?: number; fill?: boolean; children: ReactNode}> = ({
  title,
  width,
  minHeight,
  fill = false,
  children,
}) => {
  const compact = width < COMPACT;
  return (
    <div
      style={{
        width,
        minHeight,
        flex: fill ? "1 0 auto" : undefined,
        boxSizing: "border-box",
        background: C.term,
        border: `1px solid ${C.termBorder}`,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      {title !== undefined && (
        <div
          style={{
            height: 49,
            background: C.termHeader,
            borderBottom: `1px solid ${C.termRule}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 18px",
          }}
        >
          <Dots color={C.termDots} />
          <div
            style={{
              fontFamily: F.mono,
              fontSize: compact ? 17 : 20,
              lineHeight: 1,
              letterSpacing: "0.12em",
              color: C.termTitle,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {title}
          </div>
        </div>
      )}
      <div style={{padding: compact ? "18px 18px" : "22px 25px"}}>{children}</div>
    </div>
  );
};
