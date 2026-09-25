import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT, labelStyle, surface} from "./shared";

/**
 * Beige card: letter-spaced label, serif title, sans body. `accentBar` makes it a
 * callout card: page-coloured, with a 5 px terracotta bar down the left edge. With `ctx.fill` it
 * grows to its slot's height with the text centred, for stacked cards.
 * The slide passes `fill` only to cards with both a title and a body (`stretches` in src/fill.ts):
 * a one-line card keeps its natural height.
 */
export const Card: FC<BlockProps<"card">> = ({block, ctx}) => {
  const s = surface(ctx.dark);
  const callout = block.accentBar === true;
  const compact = ctx.width < COMPACT;
  const pad = compact ? {y: 18, x: 18} : {y: 22, x: 26};
  return (
    <div
      style={{
        width: ctx.width,
        boxSizing: "border-box",
        background: callout && !ctx.dark ? C.page : s.card,
        border: `1px solid ${s.border}`,
        borderLeft: callout ? `5px solid ${C.accent}` : `1px solid ${s.border}`,
        borderRadius: 8,
        padding: `${pad.y}px ${pad.x}px ${pad.y + 4}px ${callout ? pad.x + 2 : pad.x}px`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        overflowWrap: "anywhere",
        ...(ctx.fill ? {flex: "1 0 auto", justifyContent: "center"} : {}),
      }}
    >
      {block.label !== undefined && <div style={labelStyle(s.label, compact ? 18 : 21)}>{block.label}</div>}
      {block.title !== undefined && (
        <div
          style={{
            fontFamily: F.serif,
            fontSize: compact ? 34 : 40,
            lineHeight: 1.12,
            letterSpacing: "-0.01em",
            color: s.ink,
          }}
        >
          {block.title}
        </div>
      )}
      {block.body !== undefined && (
        <div style={{fontFamily: F.sans, fontSize: compact ? 19 : 22, lineHeight: 1.45, color: s.body}}>
          {block.body}
        </div>
      )}
    </div>
  );
};
