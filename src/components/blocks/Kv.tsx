import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT, Pill, surface, toneInk} from "./shared";

type Row = BlockProps<"kv">["block"]["rows"][number];

/** Value cell: an accent value is a pill (a highlighted token); a bare ✓ reads green. */
const Value: FC<{row: Row; dark: boolean}> = ({row, dark}) => {
  if (row.tone === "accent") {
    return (
      <Pill dark={dark} size={20}>
        {row.v}
      </Pill>
    );
  }
  const color = row.tone === undefined && row.v.trim() === "✓" ? (dark ? C.mintInk : C.good) : toneInk(row.tone, dark);
  return <span style={{color}}>{row.v}</span>;
};

/**
 * Key/value table on a beige card: optional mono header line, rows split by 1 px rules. Below
 * COMPACT the key sits over its value instead of beside it.
 */
export const Kv: FC<BlockProps<"kv">> = ({block, ctx}) => {
  const s = surface(ctx.dark);
  const stacked = ctx.width < COMPACT;
  return (
    <div
      style={{
        width: ctx.width,
        boxSizing: "border-box",
        background: s.card,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        padding: stacked ? "4px 18px 8px" : "4px 24px 8px",
      }}
    >
      {block.title !== undefined && (
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 18,
            lineHeight: 1.3,
            letterSpacing: "0.08em",
            color: s.label,
            padding: "18px 0 14px",
            borderBottom: `1px solid ${s.border}`,
            overflowWrap: "anywhere",
          }}
        >
          {block.title}
        </div>
      )}
      {block.rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: stacked ? "column" : "row",
            justifyContent: "space-between",
            alignItems: stacked ? "flex-start" : "center",
            gap: stacked ? 6 : 20,
            padding: stacked ? "12px 0" : "16px 0",
            borderTop: i > 0 ? `1px solid ${s.border}` : undefined,
            fontFamily: F.mono,
          }}
        >
          <div
            style={{
              fontSize: 20,
              lineHeight: 1.35,
              letterSpacing: "0.06em",
              color: s.body,
              flex: stacked ? undefined : "1 1 0",
              minWidth: 0,
              maxWidth: "100%",
              overflowWrap: "anywhere",
            }}
          >
            {row.k}
          </div>
          {row.v !== "" && (
            <div
              style={{
                fontSize: 22,
                lineHeight: 1.35,
                textAlign: stacked ? "left" : "right",
                minWidth: 0,
                maxWidth: stacked ? "100%" : "65%",
                overflowWrap: "anywhere",
              }}
            >
              <Value row={row} dark={ctx.dark} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
