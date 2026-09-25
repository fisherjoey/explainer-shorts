import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT, surface} from "./shared";

const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * Vertical list of steps, each behind its own thin bar (terracotta, or the rule colour when dim),
 * as in a pipeline list. `active` sits on a beige row, `dim` fades to 0.35.
 */
export const Steps: FC<BlockProps<"steps">> = ({block, ctx}) => {
  const s = surface(ctx.dark);
  const numbered = block.numbered !== false;
  const compact = ctx.width < COMPACT;
  return (
    <div style={{width: ctx.width, display: "flex", flexDirection: "column", gap: 12}}>
      {block.items.map((item, i) => {
        const state = item.state ?? "done";
        const active = state === "active";
        return (
          <div key={i} style={{display: "flex", alignItems: "stretch", opacity: state === "dim" ? 0.35 : 1}}>
            <div
              style={{
                width: 3,
                flexShrink: 0,
                borderRadius: 2,
                background: state === "dim" ? (ctx.dark ? C.darkRule : C.rule) : C.accent,
              }}
            />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                marginLeft: compact ? 8 : 12,
                boxSizing: "border-box",
                padding: compact ? "12px 12px" : "16px 20px",
                borderRadius: 6,
                background: active ? s.card : "transparent",
                border: `1px solid ${active ? s.border : "transparent"}`,
                display: "flex",
                alignItems: "baseline",
                gap: compact ? 10 : 18,
              }}
            >
              {numbered && (
                <div style={{fontFamily: F.mono, fontSize: compact ? 17 : 20, color: s.muted, flexShrink: 0}}>
                  {pad2(i + 1)}
                </div>
              )}
              <div style={{minWidth: 0, overflowWrap: "anywhere"}}>
                <div style={{fontFamily: F.sans, fontSize: compact ? 22 : 26, lineHeight: 1.35, color: s.ink}}>
                  {item.text}
                </div>
                {item.sub !== undefined && (
                  <div style={{fontFamily: F.sans, fontSize: compact ? 17 : 19, lineHeight: 1.4, color: s.muted, marginTop: 4}}>
                    {item.sub}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
