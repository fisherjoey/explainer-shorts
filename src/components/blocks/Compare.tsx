import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, labelStyle, surface, toneInk} from "./shared";

type Side = BlockProps<"compare">["block"]["left"];
type Look = {bg: string; border: string; label: string; title: string; body: string};

/** Below this width the two sides stack instead of sitting side by side. */
const STACK_BELOW = 560;
/** At or above this width the compare is a full-width first block (960 px). */
const FULL_FROM = 900;

/**
 * The sides' minimum height. In the split column (640 px) they keep a fixed proportion,
 * 0.34 × width. At full width that would be 326 px, which runs a first block into the narrator picture
 * (it starts at y ≈ 799 and full-width blocks at y 470), so full-width sides take their content's
 * height. Stacked sides always do.
 */
const sideMinHeight = (width: number, stacked: boolean): number | undefined =>
  stacked || width >= FULL_FROM ? undefined : Math.round(width * 0.34);

/**
 * A side's surface and type colours. On light slides the left side is a terminal-dark panel and
 * the right a beige card unless a tone says otherwise (mint/peach/accent fill the card). On dark
 * slides both are dark cards and the tone colours the title (a mint
 * "Scale." against a peach "Revocation.", say).
 */
const look = (side: Side, index: number, dark: boolean): Look => {
  const termPanel: Look = {bg: C.term, border: C.termBorder, label: C.termTitle, title: C.termText, body: C.darkBody};
  if (side.tone === "dark") return termPanel;
  if (dark) {
    const s = surface(true);
    const tone = side.tone === "default" || side.tone === "beige" ? undefined : side.tone;
    return {bg: s.card, border: s.border, label: s.label, title: tone ? toneInk(tone, true) : s.ink, body: s.body};
  }
  const s = surface(false);
  switch (side.tone) {
    case undefined:
      return index === 0 ? termPanel : {bg: s.card, border: s.border, label: s.label, title: s.ink, body: s.body};
    case "mint":
      return {bg: C.mint, border: C.mint, label: s.label, title: s.ink, body: s.body};
    case "peach":
      return {bg: C.peach, border: C.peach, label: s.label, title: s.ink, body: s.body};
    case "accent":
      return {bg: C.accent, border: C.accent, label: C.ink, title: C.ink, body: C.ink};
    default:
      return {bg: s.card, border: s.border, label: s.label, title: toneInk(side.tone, false), body: s.body};
  }
};

/**
 * Two columns set against each other, with an optional letter-spaced caption under both. Full
 * width is set for the dark turn slide: 36 px apart, 64 px serif titles, 21 px body. Narrow
 * columns stack the sides and step the title down.
 */
export const Compare: FC<BlockProps<"compare">> = ({block, ctx}) => {
  const stacked = ctx.width < STACK_BELOW;
  const gap = stacked ? 16 : ctx.width >= FULL_FROM ? 36 : 20;
  const colW = stacked ? ctx.width : Math.floor((ctx.width - gap) / 2);
  const wide = colW >= 400;
  const titleSize = wide ? 64 : colW >= 300 ? 44 : 34;
  return (
    <div style={{width: ctx.width}}>
      <div style={{display: "flex", flexDirection: stacked ? "column" : "row", gap}}>
        {[block.left, block.right].map((side, i) => {
          const l = look(side, i, ctx.dark);
          return (
            <div
              key={i}
              style={{
                width: colW,
                minHeight: sideMinHeight(ctx.width, stacked),
                boxSizing: "border-box",
                background: l.bg,
                border: `1px solid ${l.border}`,
                borderRadius: 8,
                padding: wide ? "24px 25px 28px" : "20px 18px 22px",
              }}
            >
              <div style={{...labelStyle(l.label, wide ? 21 : 17), overflowWrap: "anywhere"}}>{side.label}</div>
              <div
                style={{
                  fontFamily: F.serif,
                  fontSize: titleSize,
                  lineHeight: 1.1,
                  letterSpacing: "-0.015em",
                  color: l.title,
                  marginTop: wide ? 14 : 10,
                  overflowWrap: "anywhere",
                }}
              >
                {side.title}
              </div>
              {side.body !== undefined && (
                <div
                  style={{
                    fontFamily: F.sans,
                    fontSize: wide ? 21 : 19,
                    lineHeight: 1.45,
                    color: l.body,
                    marginTop: wide ? 9 : 7,
                    overflowWrap: "anywhere",
                  }}
                >
                  {side.body}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {block.caption !== undefined && (
        <div
          style={{
            ...labelStyle(ctx.dark ? C.darkMuted : C.muted, 18),
            textAlign: "center",
            marginTop: 22,
            overflowWrap: "anywhere",
          }}
        >
          {block.caption}
        </div>
      )}
    </div>
  );
};
