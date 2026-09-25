import type {FC} from "react";
import {C, F} from "../../theme";
import {type BlockProps, COMPACT} from "./shared";

/**
 * A line of text between blocks. No spaces reads as a token or id (mono, deep accent, like the
 * raw JWT); anything with spaces is a sentence (sans, like a remark under a panel).
 */
export const Note: FC<BlockProps<"note">> = ({block, ctx}) =>
  /\s/.test(block.text) ? (
    <div
      style={{
        width: ctx.width,
        fontFamily: F.sans,
        fontSize: ctx.width < COMPACT ? 22 : 28,
        lineHeight: 1.45,
        color: ctx.dark ? C.darkBody : C.body,
        overflowWrap: "anywhere",
      }}
    >
      {block.text}
    </div>
  ) : (
    <div
      style={{
        width: ctx.width,
        fontFamily: F.mono,
        fontSize: ctx.width < COMPACT ? 18 : 22,
        lineHeight: 1.45,
        color: ctx.dark ? C.accent : C.accentDeep,
        overflowWrap: "anywhere",
      }}
    >
      {block.text}
    </div>
  );
