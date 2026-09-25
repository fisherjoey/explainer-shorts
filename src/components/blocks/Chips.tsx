import type {FC} from "react";
import {F} from "../../theme";
import {type BlockProps, COMPACT, fill} from "./shared";

/** Wrapping row of mono chips, coloured by tone (beige with a border by default). */
export const Chips: FC<BlockProps<"chips">> = ({block, ctx}) => {
  const compact = ctx.width < COMPACT;
  return (
    <div style={{width: ctx.width, display: "flex", flexWrap: "wrap", gap: compact ? 10 : 14}}>
      {block.items.map((item, i) => {
        const f = fill(item.tone ?? "default", ctx.dark);
        return (
          <div
            key={i}
            style={{
              maxWidth: "100%",
              boxSizing: "border-box",
              fontFamily: F.mono,
              fontSize: compact ? 20 : 24,
              lineHeight: 1.3,
              padding: compact ? "10px 14px" : "14px 22px",
              borderRadius: 6,
              background: f.bg,
              color: f.fg,
              border: `1px solid ${f.border}`,
              overflowWrap: "anywhere",
            }}
          >
            {item.text}
          </div>
        );
      })}
    </div>
  );
};
