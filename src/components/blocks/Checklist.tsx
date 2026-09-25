import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT, CheckMark, surface} from "./shared";

/** One beige card per item: an outlined box (green check when done), mono text, sans sub-line. */
export const Checklist: FC<BlockProps<"checklist">> = ({block, ctx}) => {
  const s = surface(ctx.dark);
  const compact = ctx.width < COMPACT;
  const box = compact ? 36 : 46;
  return (
    <div style={{width: ctx.width, display: "flex", flexDirection: "column", gap: compact ? 12 : 16}}>
      {block.items.map((item, i) => (
        <div
          key={i}
          style={{
            boxSizing: "border-box",
            background: s.card,
            border: `1px solid ${s.border}`,
            borderRadius: 8,
            padding: compact ? "18px 16px" : "28px 24px",
            display: "flex",
            alignItems: "center",
            gap: compact ? 14 : 22,
          }}
        >
          <div
            style={{
              width: box,
              height: box,
              flexShrink: 0,
              boxSizing: "border-box",
              border: `2px solid ${ctx.dark ? C.darkMuted : C.checkBorder}`,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.checked && <CheckMark color={ctx.dark ? C.mintInk : C.good} size={Math.round(box * 0.74)} />}
          </div>
          <div style={{minWidth: 0}}>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: compact ? 21 : 26,
                lineHeight: 1.3,
                color: s.ink,
                overflowWrap: "anywhere",
              }}
            >
              {item.text}
            </div>
            {item.sub !== undefined && (
              <div
                style={{
                  fontFamily: F.sans,
                  fontSize: compact ? 17 : 20,
                  lineHeight: 1.4,
                  color: s.body,
                  marginTop: 2,
                  overflowWrap: "anywhere",
                }}
              >
                {item.sub}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
