import type {FC} from "react";
import {F} from "../../theme";
import {type BlockProps, COMPACT, surface} from "./shared";

/** Columns that fit: the requested count (default 4) from 600 px, at most 2 below, 1 below 300. */
const fitColumns = (requested: number, width: number): number =>
  width >= 600 ? requested : width >= 300 ? Math.min(requested, 2) : 1;

/** Grid of small beige tiles: mono title, mono sub-line. */
export const Tiles: FC<BlockProps<"tiles">> = ({block, ctx}) => {
  const s = surface(ctx.dark);
  const compact = ctx.width < COMPACT;
  const columns = fitColumns(Math.max(1, Math.round(block.columns ?? 4)), ctx.width);
  return (
    <div
      style={{
        width: ctx.width,
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: compact ? 12 : 16,
      }}
    >
      {block.items.map((item, i) => (
        <div
          key={i}
          style={{
            boxSizing: "border-box",
            minHeight: compact ? 90 : 110,
            background: s.card,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            padding: compact ? "14px 14px" : "16px 18px",
          }}
        >
          <div style={{fontFamily: F.mono, fontSize: 22, lineHeight: 1.3, color: s.ink, overflowWrap: "break-word"}}>
            {item.title}
          </div>
          {item.sub !== undefined && (
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 19,
                lineHeight: 1.35,
                color: s.muted,
                marginTop: 4,
                overflowWrap: "break-word",
              }}
            >
              {item.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
