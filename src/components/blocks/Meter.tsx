import type {FC} from "react";
import type {Tone} from "../../schema";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT, labelStyle, surface} from "./shared";

const barFill = (tone: Tone): string => {
  switch (tone) {
    case "mint":
    case "teal":
      return C.good;
    case "peach":
    case "orange":
      return C.codeStr;
    case "muted":
      return C.meterGrey;
    case "dark":
      return C.term;
    case "beige":
      return C.beigeBorder;
    default:
      return C.accent;
  }
};

const rightInk = (tone: Tone, dark: boolean): string => {
  switch (tone) {
    case "mint":
    case "teal":
      return dark ? C.mintInk : C.good;
    case "muted":
      return dark ? C.darkMuted : C.muted;
    case "dark":
    case "beige":
      return dark ? C.darkInk : C.ink;
    default:
      return dark ? C.accent : C.accentDeep;
  }
};

/**
 * A labelled bar in a dashed frame (an exposure or a lifetime, say):
 * letter-spaced label, bold right-hand reading, 24 px pill track with the fill in the tone colour.
 */
export const Meter: FC<BlockProps<"meter">> = ({block, ctx}) => {
  const s = surface(ctx.dark);
  const tone = block.tone ?? "accent";
  const v = Math.min(1, Math.max(0, block.value));
  return (
    <div
      style={{
        width: ctx.width,
        boxSizing: "border-box",
        border: `1px dashed ${ctx.dark ? C.darkRule : C.dashed}`,
        borderRadius: 8,
        padding: ctx.width < COMPACT ? "18px 16px 22px" : "22px 24px 26px",
      }}
    >
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14}}>
        <div style={{...labelStyle(s.muted, ctx.width < COMPACT ? 17 : 20), minWidth: 0, overflowWrap: "anywhere"}}>
          {block.label}
        </div>
        {block.right !== undefined && (
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 20,
              lineHeight: 1.3,
              fontWeight: 500,
              letterSpacing: "0.06em",
              color: rightInk(tone, ctx.dark),
              flexShrink: 0,
            }}
          >
            {block.right}
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 18,
          height: 26,
          boxSizing: "border-box",
          borderRadius: 13,
          background: s.card,
          border: `1px solid ${s.border}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${v * 100}%`,
            minWidth: v > 0 ? 24 : 0,
            height: "100%",
            background: barFill(tone),
            borderRadius: 13,
          }}
        />
      </div>
    </div>
  );
};
