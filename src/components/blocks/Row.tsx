import type {FC, ReactNode} from "react";
import type {Block} from "../../schema";
import type {BlockOf, Ctx} from "./shared";

const GAP = 12;

/**
 * Child blocks side by side, 12 px apart, each given an equal share of the width. `render` is the
 * dispatcher (passed in rather than imported, to keep the module graph acyclic).
 */
export const Row: FC<{block: BlockOf<"row">; ctx: Ctx; render: (block: Block, ctx: Ctx) => ReactNode}> = ({
  block,
  ctx,
  render,
}) => {
  const n = Math.max(1, block.blocks.length);
  const width = Math.floor((ctx.width - GAP * (n - 1)) / n);
  return (
    <div style={{width: ctx.width, display: "flex", gap: GAP, alignItems: "flex-start"}}>
      {block.blocks.map((child, i) => (
        <div key={i} style={{width, flexShrink: 0}}>
          {render(child, {dark: ctx.dark, width})}
        </div>
      ))}
    </div>
  );
};
