import type {FC} from "react";
import {Img, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {NarratorImages, Slide} from "../schema";
import {C, L} from "../theme";

export type Pose = "idle" | "look" | "big";

/** A slide's narrator pose; when unset, alternates idle/look every 2 slides. */
export const narratorPose = (slide: Slide, index: number): Pose | "hidden" =>
  slide.narrator ?? (Math.floor(index / 2) % 2 === 0 ? "idle" : "look");

/** The image for a pose, or null when the user supplied none. `look` falls back to `idle`. */
export const narratorSrc = (images: NarratorImages | undefined, pose: Pose): string | null =>
  (pose === "look" ? images?.look ?? images?.idle : images?.idle) ?? null;

/**
 * The optional narrator picture bottom-left, plus the 1 px divider to its right. The image is
 * user-supplied (public/narrator/idle.png and, optionally, look.png); without one, nothing is
 * drawn and the left column stays empty. The picture stands on L.colBottom so its base stays put
 * when the pose changes; `big` scales up from there and drops the divider, which it would cover.
 */
export const Narrator: FC<{pose: Pose; dark: boolean; images?: NarratorImages}> = ({pose, dark, images}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const src = narratorSrc(images, pose);
  if (src === null) return null;
  const bob = 4 * Math.sin(((frame / fps) * 2 * Math.PI) / 2.5);
  const height = L.colBottom - L.narratorY;

  return (
    <>
      {pose !== "big" && (
        <div
          style={{
            position: "absolute",
            left: L.dividerX,
            top: L.narratorY,
            width: 1,
            height,
            backgroundColor: dark ? C.darkDivider : C.divider,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: L.narratorX,
          top: L.narratorY,
          width: L.narratorW,
          height,
          display: "flex",
          alignItems: "flex-end",
          transform: `translateY(${bob}px)`,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            display: "block",
            width: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            objectPosition: "bottom left",
            transform: pose === "big" ? "scale(1.35)" : undefined,
            transformOrigin: "bottom left",
          }}
        />
      </div>
    </>
  );
};
