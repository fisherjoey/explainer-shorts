import type {FC} from "react";
import {Composition} from "remotion";
import {z} from "zod";
import fixture from "../videos/_fixture/script.json";
import fixtureTiming from "../videos/_fixture/timing.json";
import fixtureWords from "../videos/_fixture/words.json";
import {ExplainerVideo} from "./ExplainerVideo";
import {ScriptSchema, TimingSchema, WordSchema, type VideoProps} from "./schema";
import {SlideStill} from "./SlideStill";

const fixtureScript = ScriptSchema.parse(fixture);

const fixtureVideo: VideoProps = {
  script: fixtureScript,
  timing: TimingSchema.parse(fixtureTiming),
  words: z.array(WordSchema).parse(fixtureWords),
  audioSrc: "_render/_fixture/voice.wav",
};

export const RemotionRoot: FC = () => {
  return (
    <>
      <Composition
        id="SlideStill"
        component={SlideStill}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{script: fixtureScript, index: 0}}
      />
      <Composition
        id="ExplainerVideo"
        component={ExplainerVideo}
        durationInFrames={Math.ceil(fixtureVideo.timing.total * 30)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={fixtureVideo}
        calculateMetadata={({props}) => ({durationInFrames: Math.ceil(props.timing.total * 30)})}
      />
    </>
  );
};
