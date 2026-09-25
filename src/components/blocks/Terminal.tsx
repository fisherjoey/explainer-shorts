import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT, Pill, TermShell, toneInk} from "./shared";

type Line = BlockProps<"terminal">["block"]["lines"][number];

const LineText: FC<{line: Line}> = ({line}) =>
  line.tone === "accent" ? (
    <span
      style={{
        background: C.accent,
        color: C.ink,
        borderRadius: 999,
        padding: "2px 12px",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
    >
      {line.text}
    </span>
  ) : (
    <span style={{color: toneInk(line.tone, true)}}>{line.text}</span>
  );

/**
 * Dark terminal panel. Plain lines stack; a line with `right` becomes an outlined row with the
 * right text in teal (a store's rows, say). `tag` adds an accent pill.
 */
export const Terminal: FC<BlockProps<"terminal">> = ({block, ctx}) => {
  const compact = ctx.width < COMPACT;
  const fontSize = compact ? 20 : 24;
  return (
    <TermShell title={block.title} width={ctx.width} minHeight={compact ? undefined : 300} fill={ctx.fill}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: F.mono,
          fontSize,
          lineHeight: 1.45,
          overflowWrap: "anywhere",
        }}
      >
        {block.lines.map((line, i) => {
          const text = (
            <>
              <LineText line={line} />
              {line.tag !== undefined && (
                <span style={{marginLeft: 12}}>
                  <Pill size={Math.round(fontSize * 0.75)}>{line.tag}</Pill>
                </span>
              )}
            </>
          );
          return line.right === undefined ? (
            <div key={i}>{text}</div>
          ) : (
            <div
              key={i}
              style={{
                display: "flex",
                // Compact rows put the right-hand value under the text: side by side, a narrow
                // cell leaves the text a sliver and it breaks letter by letter.
                flexDirection: compact ? "column" : "row",
                alignItems: compact ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: compact ? 2 : 16,
                minHeight: 65,
                boxSizing: "border-box",
                padding: compact ? "8px 14px" : "8px 19px",
                border: `1px solid ${C.termRow}`,
                borderRadius: 6,
              }}
            >
              <div style={{minWidth: 0, maxWidth: "100%"}}>{text}</div>
              <div style={{color: C.codeKey, textAlign: compact ? "left" : "right", flexShrink: 0, maxWidth: "100%"}}>
                {line.right}
              </div>
            </div>
          );
        })}
      </div>
    </TermShell>
  );
};
