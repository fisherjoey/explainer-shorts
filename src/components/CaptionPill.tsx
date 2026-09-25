import {Fragment, type CSSProperties, type FC} from "react";
import type {CaptionWindow} from "../captions";
import {norm} from "../text";
import {C, F, L} from "../theme";

const underline: CSSProperties = {
  textDecorationLine: "underline",
  textDecorationColor: C.accent,
  textDecorationThickness: 3,
  textUnderlineOffset: 18, // below the baseline, clear of descenders
  textDecorationSkipInk: "none",
};

const FONT_SIZE = 64;
// A window is meant to stay under ~30 characters (≈ 830 px wide at 64 px). A longer
// window shrinks its type to that budget instead of running past the margins (at 64 px the
// serif averages ~24.5 px per character, up to ~28 with wide letters).
const MAX_CHARS = 30;

const isKeyword = (word: string, keys: Set<string>): boolean => {
  const w = norm(word);
  return w !== "" && (keys.has(w) || (w.endsWith("s") && keys.has(w.slice(0, -1))));
};

/**
 * Karaoke caption: spoken words ink, the current word (last one whose start has passed) deep
 * terracotta, upcoming words grey; keywords underlined in terracotta.
 */
export const CaptionPill: FC<{window: CaptionWindow; time: number; keywords: string[]}> = ({
  window: win,
  time,
  keywords,
}) => {
  const keys = new Set(keywords.map(norm));
  let current = -1;
  win.words.forEach((word, i) => {
    if (word.start <= time) current = i;
  });
  const chars = win.words.map((w) => w.text).join(" ").length;
  const fontSize = chars > MAX_CHARS ? (FONT_SIZE * MAX_CHARS) / chars : FONT_SIZE;

  return (
    <div style={{position: "absolute", left: 0, right: 0, top: L.pillTop, display: "flex", justifyContent: "center"}}>
      <div
        style={{
          fontFamily: F.serif,
          fontSize,
          lineHeight: "80px",
          wordSpacing: "0.05em",
          padding: "18px 36px",
          borderRadius: 8,
          border: `1px solid ${C.pillBorder}`,
          backgroundColor: C.pillBg,
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          whiteSpace: "pre",
        }}
      >
        {win.words.map((word, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <span
              style={{
                color: i < current ? C.ink : i === current ? C.accentDeep : C.upcoming,
                ...(isKeyword(word.text, keys) ? underline : {}),
              }}
            >
              {word.text}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
};
