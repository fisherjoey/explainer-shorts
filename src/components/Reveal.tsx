import type {FC, ReactNode} from "react";
import {interpolate, useCurrentFrame} from "remotion";

/**
 * Fades a block in and lifts it 12 px into place over 8 frames starting at `delay`. With `grow`
 * it is a stretched panel's slot: it takes an equal share of its column's free height (never less
 * than the block's own height), and the block inside fills it.
 */
export const Reveal: FC<{delay: number; grow?: boolean; children: ReactNode}> = ({delay, grow = false, children}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [delay, delay + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <div
      style={{
        opacity: t,
        transform: `translateY(${12 * (1 - t)}px)`,
        ...(grow ? {flex: "1 1 0", display: "flex", flexDirection: "column"} : {}),
      }}
    >
      {children}
    </div>
  );
};
