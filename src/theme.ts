import {loadFont as loadSerif} from "@remotion/google-fonts/EBGaramond";
import {loadFont as loadMono} from "@remotion/google-fonts/JetBrainsMono";
import {loadFont as loadSans} from "@remotion/google-fonts/Inter";

import type {Tone} from "./schema";

const serif = loadSerif("normal", {weights: ["400", "500"], subsets: ["latin"]});
loadSerif("italic", {weights: ["400"], subsets: ["latin"]});
const mono = loadMono("normal", {weights: ["400", "500"], subsets: ["latin"]});
const sans = loadSans("normal", {weights: ["400"], subsets: ["latin"]});

export const F = {
  serif: serif.fontFamily,
  mono: mono.fontFamily,
  sans: sans.fontFamily,
};

export const C = {
  page: "#FAF8F4",
  ink: "#13110D",
  muted: "#7B7975",
  kicker: "#706E6A",
  rule: "#DDDBD7",
  pillBorder: "#DBD9D5",
  divider: "#E1DFDB",
  accent: "#D07F57",
  accentDeep: "#A35636",
  upcoming: "#767470",
  mint: "#C9E2DD",
  peach: "#F6DFC5",
  beige: "#EFE8DE",
  beigeBorder: "#D5CEC5",
  body: "#433F3A", // secondary text on page and cards (sentences under panels, card bodies)
  good: "#1E573E", // check marks and "safe" readings (✓ true, LOWER)
  checkBorder: "#B0A79C",
  browserDots: "#BEB8B1",
  dashed: "#C9C4BC", // the meter's dashed frame
  meterGrey: "#B4B3AE",
  term: "#181614",
  termHeader: "#23211D",
  termBorder: "#363430", // 1 px frame round the panel
  termRule: "#42403C", // under the title bar
  termRow: "#3D3B39", // outline of a row with a right-hand value
  termTitle: "#B8B6B2",
  termDots: "#666460",
  termText: "#E8E4DC",
  termMuted: "#8F8A82",
  codeKey: "#5EAA9C",
  codeStr: "#CF846A",
  arrow: "#A09E9A",
  // Dark "turn" slide.
  darkPage: "#181614",
  darkInk: "#FAF8F4",
  darkMuted: "#A8A6A4",
  darkKicker: "#B9B7B5",
  darkRule: "#3E3C3A",
  darkDivider: "#363432",
  darkCard: "#1E1C18", // the dark slide's compare cards (measured #1E1C18–#1F1D18)
  darkBody: "#C9C7C4",
  mintInk: "#77C69C", // mint as type on dark ("Scale.")
  peachInk: "#EE9671", // peach as type on dark ("Revocation.")
  // Caption pill fill: the page colour on both themes.
  pillBg: "#FAF8F4",
};

export const L = {
  margin: 60,
  headerY: 121, // header baseline (caps span y 103–120)
  ruleY: 150,
  kickerY: 216, // top of the kicker's line box (caps span y 218–234)
  headlineY: 248, // top of the headline's first line box (first baseline ≈ y 305)
  narratorX: 2,
  narratorY: 790,
  narratorW: 351, // the narrator picture's box width; the image is scaled to fit it
  dividerX: 360,
  colX: 380,
  // Block column beside a `big` narrator: the picture's right edge (x ≈ 476 at scale 1.35) plus
  // a 62 px gap.
  colXBig: 538,
  colRight: 1020,
  colTop: 440, // first block top on split slides
  colBottom: 1360,
  fullTop: 470, // full-width visual top (x 60–1020)
  blockGap: 32, // between stacked blocks
  // Emphasis and band headlines: blocks start this far below the headline's lowest mark (JWT
  // video: 98 below the chapter slide's rule, 93 below the dark turn's last baseline).
  headGap: 95,
  // Normal headlines: blocks sit at colTop / fullTop, or this far below the headline when a long
  // one wraps past them.
  headGapMin: 40,
  bandTop: 270, // accent band top: ~30 px clear of the kicker
  asideTop: 560,
  asideW: 300,
  pillTop: 1416,
  // The bottom of the slide's flow region. A column holding two or more stretching panels
  // (terminal, code, a card with a title and a body) shares the height down to here between them
  // and an L.fillSpacer share left empty, so the panels themselves end higher: on a split slide
  // with a normal headline, two panels end near y 1142 and three near y 1195.
  fillBottom: 1310,
  // The empty share left under stretched panels, where one panel's share is 1. At 0.5, three cards
  // come out 230 px tall and two terminals 335 px (theirs: 230 at 2:34, 345 at 1:24).
  fillSpacer: 0.5,
};

// Font vertical metrics (em), used to put a line's baseline at an exact y.
export const FM = {
  mono: {ascent: 1.02, descent: 0.3},
};

// Top of a `lineHeight: 1` box whose baseline should sit at `y`.
export const baselineTop = (y: number, fontSize: number, m: {ascent: number; descent: number}) =>
  y - (fontSize * (1 + m.ascent - m.descent)) / 2;

export const toneColor = (tone: Tone): {bg: string; fg: string} => {
  switch (tone) {
    case "default":
      return {bg: C.beige, fg: C.ink};
    case "muted":
      return {bg: "transparent", fg: C.muted};
    case "accent":
      return {bg: C.accent, fg: "#FFF7F0"};
    case "mint":
      return {bg: C.mint, fg: C.ink};
    case "peach":
      return {bg: C.peach, fg: C.ink};
    case "beige":
      return {bg: C.beige, fg: C.ink};
    case "dark":
      return {bg: C.term, fg: "#E8E4DC"};
    case "teal":
      return {bg: "transparent", fg: C.codeKey};
    case "orange":
      return {bg: "transparent", fg: C.codeStr};
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
};
