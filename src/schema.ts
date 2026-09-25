import {z} from "zod";

export const ToneSchema = z.enum([
  "default",
  "muted",
  "accent",
  "mint",
  "peach",
  "beige",
  "dark",
  "teal",
  "orange",
]);
export type Tone = z.infer<typeof ToneSchema>;

const SideSchema = z.object({
  label: z.string(),
  title: z.string(),
  body: z.string().optional(),
  tone: ToneSchema.optional(),
});

const TerminalBlockSchema = z.object({
  type: z.literal("terminal"),
  cue: z.string().optional(),
  title: z.string(),
  lines: z.array(
    z.object({
      text: z.string(),
      right: z.string().optional(),
      tone: ToneSchema.optional(),
      tag: z.string().optional(),
    }),
  ),
});

const CodeBlockSchema = z.object({
  type: z.literal("code"),
  cue: z.string().optional(),
  title: z.string().optional(),
  code: z.string(),
  lang: z.enum(["json", "js", "text"]).optional(),
});

const BrowserBlockSchema = z.object({
  type: z.literal("browser"),
  cue: z.string().optional(),
  url: z.string(),
  rows: z.array(
    z.object({
      label: z.string().optional(),
      text: z.string(),
      tag: z.string().optional(),
    }),
  ),
});

const CardBlockSchema = z.object({
  type: z.literal("card"),
  cue: z.string().optional(),
  label: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  accentBar: z.boolean().optional(),
});

const ChipsBlockSchema = z.object({
  type: z.literal("chips"),
  cue: z.string().optional(),
  items: z.array(
    z.object({
      text: z.string(),
      tone: ToneSchema.optional(),
    }),
  ),
});

const SegmentsBlockSchema = z.object({
  type: z.literal("segments"),
  cue: z.string().optional(),
  items: z.array(
    z.object({
      text: z.string(),
      tone: ToneSchema,
      flex: z.number().optional(),
    }),
  ),
  caption: z.string().optional(),
});

const ArrowBlockSchema = z.object({
  type: z.literal("arrow"),
  cue: z.string().optional(),
  label: z.string().optional(),
  direction: z.enum(["down", "right"]).optional(),
});

const StepsBlockSchema = z.object({
  type: z.literal("steps"),
  cue: z.string().optional(),
  items: z.array(
    z.object({
      text: z.string(),
      sub: z.string().optional(),
      state: z.enum(["done", "active", "dim"]).optional(),
    }),
  ),
  numbered: z.boolean().optional(),
});

const ChecklistBlockSchema = z.object({
  type: z.literal("checklist"),
  cue: z.string().optional(),
  items: z.array(
    z.object({
      text: z.string(),
      sub: z.string().optional(),
      checked: z.boolean(),
    }),
  ),
});

const CompareBlockSchema = z.object({
  type: z.literal("compare"),
  cue: z.string().optional(),
  left: SideSchema,
  right: SideSchema,
  caption: z.string().optional(),
});

const StatBlockSchema = z.object({
  type: z.literal("stat"),
  cue: z.string().optional(),
  value: z.string(),
  label: z.string(),
  sub: z.string().optional(),
});

const MeterBlockSchema = z.object({
  type: z.literal("meter"),
  cue: z.string().optional(),
  label: z.string(),
  value: z.number(),
  right: z.string().optional(),
  tone: ToneSchema.optional(),
});

const KvBlockSchema = z.object({
  type: z.literal("kv"),
  cue: z.string().optional(),
  title: z.string().optional(),
  rows: z.array(
    z.object({
      k: z.string(),
      v: z.string(),
      tone: ToneSchema.optional(),
    }),
  ),
});

const TilesBlockSchema = z.object({
  type: z.literal("tiles"),
  cue: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string(),
      sub: z.string().optional(),
    }),
  ),
  columns: z.number().optional(),
});

const NoteBlockSchema = z.object({
  type: z.literal("note"),
  cue: z.string().optional(),
  text: z.string(),
});

export type Block =
  | z.infer<typeof TerminalBlockSchema>
  | z.infer<typeof CodeBlockSchema>
  | z.infer<typeof BrowserBlockSchema>
  | z.infer<typeof CardBlockSchema>
  | z.infer<typeof ChipsBlockSchema>
  | z.infer<typeof SegmentsBlockSchema>
  | z.infer<typeof ArrowBlockSchema>
  | z.infer<typeof StepsBlockSchema>
  | z.infer<typeof ChecklistBlockSchema>
  | z.infer<typeof CompareBlockSchema>
  | z.infer<typeof StatBlockSchema>
  | z.infer<typeof MeterBlockSchema>
  | z.infer<typeof KvBlockSchema>
  | z.infer<typeof TilesBlockSchema>
  | z.infer<typeof NoteBlockSchema>
  | {type: "row"; cue?: string; blocks: Block[]};

const RowBlockSchema: z.ZodType<{type: "row"; cue?: string; blocks: Block[]}> = z.lazy(() =>
  z.object({
    type: z.literal("row"),
    cue: z.string().optional(),
    blocks: z.array(BlockSchema),
  }),
);

export const BlockSchema: z.ZodType<Block> = z.union([
  TerminalBlockSchema,
  CodeBlockSchema,
  BrowserBlockSchema,
  CardBlockSchema,
  ChipsBlockSchema,
  SegmentsBlockSchema,
  ArrowBlockSchema,
  StepsBlockSchema,
  ChecklistBlockSchema,
  CompareBlockSchema,
  StatBlockSchema,
  MeterBlockSchema,
  KvBlockSchema,
  TilesBlockSchema,
  NoteBlockSchema,
  RowBlockSchema,
]);

export const SlideSchema = z.object({
  id: z.string(),
  section: z.string(),
  kicker: z.string().optional(),
  headline: z.string(),
  theme: z.enum(["light", "dark", "accent"]).optional(),
  // A chapter or turn slide: the headline is set larger (and, on light slides, underlined).
  emphasis: z.boolean().optional(),
  layout: z.enum(["split", "full"]).optional(),
  aside: z.string().optional(),
  narrator: z.enum(["idle", "look", "big", "hidden"]).optional(),
  keywords: z.array(z.string()).optional(),
  narration: z.string(),
  visual: z.array(BlockSchema).optional(),
});
export type Slide = z.infer<typeof SlideSchema>;

export const ScriptSchema = z.object({
  slug: z.string(),
  title: z.string(),
  // Script word -> how the narrator says it ({"HttpOnly": "HTTP only"}). Applied by the voice
  // step before TTS only; the renderer ignores it (captions show the script's spelling). Keys are
  // whole-word and case-sensitive, and can be a phrase ({"JWT packs": "jay double-you tee packs"})
  // to respell one sentence only; the longest matching key wins.
  pronounce: z.record(z.string(), z.string()).optional(),
  slides: z.array(SlideSchema),
});
export type Script = z.infer<typeof ScriptSchema>;

export const TimingSchema = z.object({
  fps: z.number(),
  total: z.number(),
  slides: z.array(
    z.object({
      id: z.string(),
      start: z.number(),
      end: z.number(),
    }),
  ),
});
export type Timing = z.infer<typeof TimingSchema>;

export const WordSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  slide: z.string(),
});
export type Word = z.infer<typeof WordSchema>;

// Optional narrator pictures, as paths under public/ (the render and stills scripts fill this in
// when public/narrator/idle.png and look.png exist). Without them no narrator is drawn.
export const NarratorImagesSchema = z.object({
  idle: z.string().optional(),
  look: z.string().optional(),
});
export type NarratorImages = z.infer<typeof NarratorImagesSchema>;

export const VideoPropsSchema = z.object({
  script: ScriptSchema,
  timing: TimingSchema,
  words: z.array(WordSchema),
  audioSrc: z.string(),
  narratorImages: NarratorImagesSchema.optional(),
});
export type VideoProps = z.infer<typeof VideoPropsSchema>;
