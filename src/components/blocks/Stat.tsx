import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, labelStyle, surface} from "./shared";

/** Below this width the label goes under the figure instead of beside it. */
const STACK_BELOW = 520;
// EB Garamond figures advance ≤ 0.5 em; capping the size at width / (chars × 0.55) keeps the
// figure inside the column.
const FIGURE_EM = 0.55;

/** A big serif figure with a letter-spaced label beside it and an optional sans line above; ruled under. */
export const Stat: FC<BlockProps<"stat">> = ({block, ctx}) => {
  const s = surface(ctx.dark);
  const stacked = ctx.width < STACK_BELOW;
  const size = Math.min(110, Math.floor(ctx.width / (Math.max(1, [...block.value].length) * FIGURE_EM)));
  return (
    <div
      style={{
        width: ctx.width,
        boxSizing: "border-box",
        paddingBottom: 20,
        borderBottom: `1px solid ${ctx.dark ? C.darkRule : C.rule}`,
      }}
    >
      {block.sub !== undefined && (
        <div
          style={{
            fontFamily: F.sans,
            fontSize: 20,
            lineHeight: 1.4,
            color: s.muted,
            marginBottom: 4,
            overflowWrap: "anywhere",
          }}
        >
          {block.sub}
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: stacked ? "column" : "row",
          alignItems: stacked ? "flex-start" : "center",
          gap: stacked ? 6 : 28,
        }}
      >
        <div
          style={{
            fontFamily: F.serif,
            fontSize: size,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: s.ink,
            flexShrink: 0,
            maxWidth: "100%",
            overflowWrap: "anywhere",
          }}
        >
          {block.value}
        </div>
        <div
          style={{
            ...labelStyle(s.muted, 18),
            lineHeight: 1.55,
            minWidth: 0,
            maxWidth: "100%",
            flex: stacked ? undefined : "1 1 0",
            paddingTop: stacked ? 0 : 12,
            overflowWrap: "anywhere",
          }}
        >
          {block.label}
        </div>
      </div>
    </div>
  );
};
