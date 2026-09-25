import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT, Dots, Pill, surface} from "./shared";

/** Browser-window card: dots and a URL pill in the top bar, then mono rows (label pill, text, tag). */
export const Browser: FC<BlockProps<"browser">> = ({block, ctx}) => {
  const s = surface(ctx.dark);
  const compact = ctx.width < COMPACT;
  return (
    <div
      style={{
        width: ctx.width,
        boxSizing: "border-box",
        background: s.card,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 54,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: compact ? "0 14px" : "0 18px",
          borderBottom: `1px solid ${s.border}`,
        }}
      >
        <Dots color={ctx.dark ? C.darkRule : C.browserDots} />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            marginLeft: compact ? 2 : 10,
            height: 36,
            borderRadius: 18,
            background: s.inset,
            display: "flex",
            alignItems: "center",
            padding: compact ? "0 12px" : "0 16px",
            fontFamily: F.mono,
            fontSize: compact ? 17 : 20,
            color: s.muted,
          }}
        >
          {/* Its own block box: text-overflow does nothing on a flex container's bare text. */}
          <span style={{display: "block", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
            {block.url}
          </span>
        </div>
      </div>
      <div
        style={{
          padding: compact ? "16px 18px 24px" : "20px 24px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {block.rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: compact ? 8 : 12,
              fontFamily: F.mono,
              fontSize: compact ? 20 : 23,
              lineHeight: 1.4,
              color: s.body,
            }}
          >
            {row.label !== undefined && (
              <span
                style={{
                  fontSize: compact ? 16 : 18,
                  lineHeight: 1.35,
                  padding: "2px 10px",
                  borderRadius: 6,
                  background: s.inset,
                  border: `1px solid ${s.border}`,
                  color: s.ink,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  overflowWrap: "anywhere",
                }}
              >
                {row.label}
              </span>
            )}
            <span style={{minWidth: 0, maxWidth: "100%", overflowWrap: "anywhere"}}>{row.text}</span>
            {row.tag !== undefined && <Pill>{row.tag}</Pill>}
          </div>
        ))}
      </div>
    </div>
  );
};
