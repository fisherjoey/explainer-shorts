import type {CSSProperties, FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT} from "./shared";

const stroke = {fill: "none", stroke: C.arrow, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round"} as const;

const Down: FC = () => (
  <svg width={24} height={46} viewBox="0 0 24 46" style={{display: "block", flexShrink: 0}}>
    <path d="M12 1 V44 M3 34 L12 44 L21 34" {...stroke} />
  </svg>
);

/**
 * Thin connector arrow centred in the column (drawn as a hairline ↓: 44 px
 * shaft, open 20 px head). A down arrow keeps its centre with the label wrapping in the space to
 * its right, or under it when that space is too narrow; a right arrow's shaft shortens to leave
 * its label room.
 */
export const Arrow: FC<BlockProps<"arrow">> = ({block, ctx}) => {
  const label: CSSProperties = {
    fontFamily: F.mono,
    fontSize: ctx.width < COMPACT ? 16 : 18,
    lineHeight: 1.3,
    letterSpacing: "0.08em",
    color: ctx.dark ? C.darkMuted : C.muted,
    minWidth: 0,
    overflowWrap: "anywhere",
  };
  if (block.direction === "right") {
    const w = Math.round(Math.min(80, Math.max(36, ctx.width * 0.22)));
    return (
      <div style={{width: ctx.width, display: "flex", justifyContent: "center", alignItems: "center", gap: 14}}>
        <svg width={w} height={24} viewBox={`0 0 ${w} 24`} style={{display: "block", flexShrink: 0}}>
          <path d={`M1 12 H${w - 2} M${w - 12} 3 L${w - 2} 12 L${w - 12} 21`} {...stroke} />
        </svg>
        {block.label !== undefined && <div style={label}>{block.label}</div>}
      </div>
    );
  }
  if (block.label === undefined) {
    return (
      <div style={{width: ctx.width, display: "flex", justifyContent: "center"}}>
        <Down />
      </div>
    );
  }
  const side = (ctx.width - 24) / 2 - 20;
  return side >= 130 ? (
    <div
      style={{
        width: ctx.width,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 24px minmax(0, 1fr)",
        columnGap: 20,
        alignItems: "center",
      }}
    >
      <div />
      <Down />
      <div style={label}>{block.label}</div>
    </div>
  ) : (
    <div style={{width: ctx.width, display: "flex", flexDirection: "column", alignItems: "center", gap: 8}}>
      <Down />
      <div style={{...label, textAlign: "center", maxWidth: "100%"}}>{block.label}</div>
    </div>
  );
};
