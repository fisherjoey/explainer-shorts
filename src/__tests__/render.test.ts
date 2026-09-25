import {describe, expect, it} from "vitest";
import script from "../../videos/_fixture/script.json";
import timing from "../../videos/_fixture/timing.json";
import words from "../../videos/_fixture/words.json";
import {findNarratorImages, idMismatch, probeFailures, probeFailureMessage, renderFailureMessage, type Probe} from "../../scripts/render";
import {ScriptSchema, TimingSchema, WordSchema} from "../schema";

const s = () => ScriptSchema.parse(structuredClone(script));
const t = () => TimingSchema.parse(structuredClone(timing));
const w = () => WordSchema.array().parse(structuredClone(words));

describe("idMismatch", () => {
  it("accepts the fixture's three files", () => {
    expect(idMismatch(s(), t(), w())).toBeNull();
  });
  it("names a timing slide out of step with the script", () => {
    const bad = t();
    bad.slides[2].id = "s99";
    expect(idMismatch(s(), bad, w())).toBe("timing.json slide 3 is s99, script.json slide 3 is s03");
  });
  it("names a missing timing slide", () => {
    const bad = t();
    bad.slides.pop();
    expect(idMismatch(s(), bad, w())).toMatch(/slide 13 is missing/);
  });
  it("names words for an unknown slide and slides with no words", () => {
    const stray = w();
    stray[0].slide = "s77";
    expect(idMismatch(s(), t(), stray)).toMatch(/slide s77/);
    const silent = w().filter((x) => x.slide !== "s05");
    expect(idMismatch(s(), t(), silent)).toBe("words.json has no words for slide s05");
  });
});

describe("probeFailures", () => {
  const good: Probe = {
    streams: [
      {codec_type: "video", codec_name: "h264", width: 1080, height: 1920, r_frame_rate: "30/1"},
      {codec_type: "audio", codec_name: "aac"},
    ],
    format: {duration: "42.700000"},
  };
  it("passes a 1080×1920 30 fps h264 + aac file of the right length", () => {
    expect(probeFailures(good, 42.7)).toEqual([]);
    expect(probeFailures({...good, format: {duration: "41.5"}}, 42.7)).toEqual([]);
  });
  it("names each failed check", () => {
    const bad: Probe = {
      streams: [{codec_type: "video", codec_name: "h264", width: 1920, height: 1080, r_frame_rate: "60/1"}],
      format: {duration: "40.0"},
    };
    const failures = probeFailures(bad, 42.7).join("\n");
    expect(failures).toMatch(/width is 1920/);
    expect(failures).toMatch(/height is 1080/);
    expect(failures).toMatch(/frame rate is 60\/1/);
    expect(failures).toMatch(/no audio stream/);
    expect(failures).toMatch(/duration/);
  });
});

describe("probeFailureMessage", () => {
  it("reports the spawn error when ffprobe never ran", () => {
    expect(probeFailureMessage({error: new Error("ENOENT"), stderr: undefined})).toBe("ENOENT");
  });
  it("falls back to trimmed stderr when ffprobe ran and failed", () => {
    expect(probeFailureMessage({stderr: "  bad input\n"})).toBe("bad input");
  });
  it("never throws when both are missing", () => {
    expect(probeFailureMessage({})).toBe("unknown ffprobe failure");
  });
});

describe("renderFailureMessage", () => {
  it("reports the spawn error when the render process never ran", () => {
    expect(renderFailureMessage({error: new Error("ENOENT"), status: null})).toBe("ENOENT");
  });
  it("reports the signal instead of a null status", () => {
    expect(renderFailureMessage({signal: "SIGKILL", status: null})).toBe("killed by signal SIGKILL");
  });
  it("reports the exit status otherwise", () => {
    expect(renderFailureMessage({status: 1})).toBe("exited with 1");
  });
});

describe("findNarratorImages", () => {
  it("returns only the pictures that exist", async () => {
    const {mkdtempSync, mkdirSync, writeFileSync} = await import("node:fs");
    const {tmpdir} = await import("node:os");
    const dir = mkdtempSync(`${tmpdir()}/narrator-`);
    expect(findNarratorImages(dir)).toEqual({});
    mkdirSync(`${dir}/narrator`);
    writeFileSync(`${dir}/narrator/idle.png`, "");
    expect(findNarratorImages(dir)).toEqual({idle: "narrator/idle.png"});
  });
});
