import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT, TermShell} from "./shared";

type Tok = {text: string; color: string};

/** Splits `line` on `re`; each match is coloured by `pick`, everything between is `rest`. */
const paintWith =
  (re: RegExp, pick: (m: RegExpExecArray) => Tok[], rest: string) =>
  (line: string): Tok[] => {
    const out: Tok[] = [];
    const g = new RegExp(re.source, "g");
    let last = 0;
    for (let m = g.exec(line); m !== null; m = g.exec(line)) {
      if (m[0] === "") {
        g.lastIndex++;
        continue;
      }
      if (m.index > last) out.push({text: line.slice(last, m.index), color: rest});
      out.push(...pick(m));
      last = m.index + m[0].length;
    }
    if (last < line.length) out.push({text: line.slice(last), color: rest});
    return out;
  };

// JSON-ish: a quoted key before `:` is teal, other strings and literals orange, punctuation light.
const json = paintWith(
  /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/,
  (m) =>
    m[1] !== undefined
      ? m[2] !== undefined
        ? [
            {text: m[1], color: C.codeKey},
            {text: m[2], color: C.termText},
          ]
        : [{text: m[1], color: C.codeStr}]
      : [{text: m[0], color: C.codeStr}],
  C.termText,
);

// JS: keywords and strings orange, dotted member chains teal (`document.cookie`), comments muted.
const js = paintWith(
  /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|\b(const|let|var|function|return|await|async|new|if|else|for|of|import|from|export)\b|([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+)/,
  (m) => [
    {
      text: m[0],
      color: m[1] !== undefined ? C.termMuted : m[4] !== undefined ? C.codeKey : C.codeStr,
    },
  ],
  C.termText,
);

const text = (line: string): Tok[] => [{text: line, color: C.termText}];

/** Code in the terminal shell, split by lines and coloured by `lang` (JSON-ish by default). */
export const Code: FC<BlockProps<"code">> = ({block, ctx}) => {
  const compact = ctx.width < COMPACT;
  const paint = block.lang === "text" ? text : block.lang === "js" ? js : json;
  return (
    <TermShell title={block.title} width={ctx.width} minHeight={compact ? undefined : 300} fill={ctx.fill}>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: compact ? 20 : 26,
          lineHeight: compact ? "34px" : "46px",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          color: C.termText,
          marginTop: -4,
        }}
      >
        {block.code.split("\n").map((line, i) => (
          <div key={i}>
            {line === ""
              ? " "
              : paint(line).map((t, j) => (
                  <span key={j} style={{color: t.color}}>
                    {t.text}
                  </span>
                ))}
          </div>
        ))}
      </div>
    </TermShell>
  );
};
