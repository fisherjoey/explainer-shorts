# explainer-shorts

Turn a JSON script into a vertical explainer video. A cloned narrator voice talks through an
editorial slide deck, and karaoke captions highlight each word as it is spoken. Videos are
1080 × 1920 at 30 fps, and a full script runs two and a half to three minutes.

You write the script. One command voices it with [F5-TTS](https://github.com/SWivid/F5-TTS),
times every word with [faster-whisper](https://github.com/SYSTRAN/faster-whisper), and renders the
mp4 with [Remotion](https://www.remotion.dev/).

`videos/stack-vs-heap/script.json` is a finished example: 44 slides comparing the stack and the
heap.

## Requirements

- An NVIDIA GPU with a CUDA build of torch for voicing. The lockfile resolves torch 2.14 with CUDA
  13; older cards may need a different torch build. F5-TTS will run on CPU, but slowly. Rendering
  and captions don't need a GPU.
- [uv](https://docs.astral.sh/uv/). The Python side is pinned to Python 3.11.
- Node 22 and [pnpm](https://pnpm.io/) for the renderer.
- ffmpeg, ideally built with the rubberband filter (`ffmpeg -filters | grep rubberband`). Without
  rubberband the optional time stretch falls back to ffmpeg's atempo filter.

The first voice run downloads the F5-TTS model (about 1.3 GB) and Whisper `small.en` from Hugging
Face.

## Setup

```bash
uv sync --extra tts
pnpm install
```

Then give it a voice (see "Voice cloning" below):

```bash
scripts/make_ref.sh my-recording.m4a 3.2 14.0 "Exactly what I say between those two timestamps."
```

That writes `voice/ref.wav` and `voice/ref.txt`. Both are gitignored. To keep the clip somewhere
else, set `EXPLAINER_REF=/path/to/clip.wav` and put the transcript next to it as `clip.txt`.

A narrator picture is optional. Put a PNG with a transparent background at
`public/narrator/idle.png`, and another at `public/narrator/look.png` if you want a second pose.
Each is drawn in a 351 × 570 box at the bottom left of the slide. With no picture, that corner
stays empty.

## Writing a script

A video lives in `videos/<slug>/`. You write `script.json`; the pipeline adds `timing.json`,
`words.json` and `audio/`. `src/schema.ts` is the full schema. The short version:

```json
{
  "slug": "tcp-vs-udp",
  "title": "TCP vs UDP",
  "pronounce": {"QUIC": "quick"},
  "slides": [
    {
      "id": "s01",
      "section": "TWO TRANSPORTS",
      "kicker": "THE SHARED JOB",
      "headline": "Both move bytes.\nOnly one *promises*.",
      "narration": "TCP and UDP both carry your data, but only one of them promises it arrives.",
      "keywords": ["promises"],
      "visual": [
        {"type": "compare", "cue": "TCP",
         "left": {"label": "TCP", "title": "Reliable."},
         "right": {"label": "UDP", "title": "Fast."}}
      ]
    }
  ]
}
```

| field | what it does |
|---|---|
| `narration` | What the voice says and the captions show. Aim for 9 to 15 words, one idea per slide. |
| `headline` | The slide's claim: 2 lines and 60 characters at most, `\n` for the break, one `*italic*` word. |
| `section`, `kicker` | The chapter name in the header, and the small label above the headline. |
| `visual` | Blocks: `terminal`, `code`, `browser`, `card`, `chips`, `segments`, `arrow`, `steps`, `checklist`, `compare`, `stat`, `meter`, `kv`, `tiles`, `note`, and `row` to put blocks side by side. |
| `cue` | On a block: a narration word that makes the block appear when it is spoken. |
| `theme` | `light` (default), `dark` for the turn, or `accent` for a headline on a coloured band. |
| `layout` | `split` (default, blocks in the right column) or `full` (the first block spans the page). |
| `narrator` | Pose: `idle`, `look`, `big` or `hidden`. |
| `aside`, `emphasis`, `keywords` | A grey note in the left column, a larger headline, and a word underlined in the captions. |
| `pronounce` | Script-level respellings for the voice only (`"HttpOnly": "HTTP only"`). Captions keep your spelling. |

`docs/style-guide.md` covers the rest: the six-part arc, word targets, choosing blocks, cues,
pronunciation and accuracy. `CONTEXT.md` defines the terms.

## Rendering

1. Check the script: `pnpm validate <slug>` enforces the hard limits, and `pnpm stats <slug>` checks
   the style guide's targets.
2. Preview the slides: `pnpm stills <slug>` renders every slide from the script alone into
   `out/stills/<slug>/`, with a contact sheet. No voice needed.
3. Make the video: `./make.sh <slug>`. It validates the script, voices it (`explainer voice`),
   aligns every word with Whisper (`explainer align --report`, which prints how well each slide
   matched), renders `out/<slug>.mp4`, and checks the file with ffprobe.
4. If a slide matches under 90 %, give the misheard word a `pronounce` entry and run `./make.sh`
   again. A change to blocks, headlines or layout only needs `pnpm render <slug>`.

`EXPLAINER_ENGINE=fake ./make.sh <slug>` runs the whole pipeline with a test tone instead of a
voice. It needs no GPU or reference clip (Whisper still downloads), so it's a quick way to check a
new machine. `pnpm studio` opens Remotion Studio on the test deck in `videos/_fixture/`; run
`scripts/fixture_audio.sh` and `pnpm render _fixture` once first so it has an audio track.

`explainer narrate notes.md --out notes.mp3` reads a markdown file aloud in the same voice.

## Voice cloning

The voice is cloned from the reference clip. **Only clone your own voice, or a voice whose owner
has given you explicit permission.**

- Don't use this to impersonate a real person, and don't clone voices of actors, public figures
  or copyrighted characters.
- Don't present generated narration as a real recording of someone.
- If you publish videos made with it, say that the narration is synthetic.
- Check the licence of the model you voice with (below) before any commercial use.

`scripts/make_ref.sh <recording> <start> <end> "<transcript>" [--demucs]` cuts the clip from your
own recording. Keep it to 8 to 12 seconds of clear, continuous speech, and make the transcript
match word for word. `--demucs` separates the voice from background music first; it needs
[Demucs](https://github.com/adefossez/demucs) installed (or `DEMUCS="uvx demucs"`).
`docs/voice.md` covers engines, pacing and how to compare engines on your clip.

## Tests

```bash
uv run pytest -q     # Python: fake engine only, no GPU or model downloads
pnpm test            # TypeScript: schema, captions, cues, timing, stats, render checks
pnpm typecheck
```

CI runs these on every push to main and on pull requests.

## Layout

```
make.sh              one video, start to finish: validate, voice, align, render
videos/<slug>/       script.json (yours); timing.json, words.json, audio/ (generated)
videos/_fixture/     a test deck that uses every block, theme, layout and pose
videos/_narrow/      a test deck of blocks at narrow widths
src/                 the Remotion kit: schema, composition, slides, blocks, captions, theme
scripts/             validate, stats, stills and render, plus make_ref.sh
py/explainer/        explainer voice / align / narrate (TTS engines, pacing, Whisper alignment)
tests/py/, src/__tests__/   pytest and vitest suites
docs/                style guide and voice notes
```

## Licence

The code in this repository is MIT licensed (see `LICENSE`). The tools it drives have their own
terms:

- Remotion uses the Remotion License, not an open-source licence. It is free for individuals,
  for-profit companies with up to 3 employees, non-profits, and for evaluation. Larger for-profit
  companies need a paid company licence. See [remotion.pro/license](https://www.remotion.pro/license).
- F5-TTS: the code is MIT, but the pretrained model weights are CC BY-NC 4.0, so voicing with
  them is non-commercial only.
- Chatterbox (optional engine) is MIT and watermarks its output.
- faster-whisper and the Whisper models are MIT.
- Demucs (optional) is MIT.
- The fonts (EB Garamond, JetBrains Mono, Inter) are loaded from Google Fonts under the SIL Open
  Font License.
