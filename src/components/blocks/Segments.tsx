import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT, fill} from "./shared";

const GAP = 8;
const MONO_ADVANCE = 0.6; // JetBrains Mono advances every glyph exactly 0.6 em
const MIN_SIZE = 9; // below this a label ellipsizes rather than shrink further

/**
 * One 64 px bar split into toned segments (the JWT header / payload / signature strip). The whole
 * strip shares one type size: 22 px, or the largest size at which every label fits its segment.
 */
export const Segments: FC<BlockProps<"segments">> = ({block, ctx}) => {
  const PAD_X = ctx.width < COMPACT ? 3 : 6;
  const total = block.items.reduce((n, item) => n + (item.flex ?? 1), 0) || 1;
  const avail = ctx.width - GAP * (block.items.length - 1);
  const fontSize = Math.max(
    MIN_SIZE,
    Math.min(
      22,
      ...block.items.map((item) =>
        Math.floor(((avail * (item.flex ?? 1)) / total - 2 * PAD_X) / (Math.max(1, item.text.length) * MONO_ADVANCE)),
      ),
    ),
  );
  return (
    <div style={{width: ctx.width}}>
      <div style={{display: "flex", gap: GAP}}>
        {block.items.map((item, i) => {
          const f = fill(item.tone, ctx.dark);
          return (
            <div
              key={i}
              style={{
                flex: `${item.flex ?? 1} 1 0`,
                minWidth: 0,
                height: 64,
                boxSizing: "border-box",
                borderRadius: 6,
                background: f.bg,
                color: f.fg,
                border: f.bg === "transparent" ? `1px solid ${f.border}` : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.mono,
                fontSize,
              }}
            >
              <span
                style={{
                  display: "block",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  padding: `0 ${PAD_X}px`,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
      {block.caption !== undefined && (
        <div
          style={{
            marginTop: 14,
            fontFamily: F.mono,
            fontSize: 20,
            lineHeight: 1.4,
            color: ctx.dark ? C.accent : C.accentDeep,
            overflowWrap: "anywhere",
          }}
        >
          {block.caption}
        </div>
      )}
    </div>
  );
};
