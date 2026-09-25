# Voice

How the narration is voiced, and how to compare engines on your own reference clip.

## The reference clip

The voice is cloned from one short clip: `voice/ref.wav` plus its transcript in `voice/ref.txt`
(or `$EXPLAINER_REF` and the `.txt` next to it). `scripts/make_ref.sh` cuts both from a longer
recording. What makes a good clip:

- 8 to 12 seconds of one person talking continuously, in the tone you want the videos to have.
  F5-TTS clips anything past 12 seconds, and the transcript then no longer matches the audio.
- Little background noise and no music. If the recording has a music bed, pass `--demucs` to
  `make_ref.sh` to separate the voice first.
- A transcript that matches the audio word for word. F5-TTS uses it to line the clip up with the
  text; a wrong transcript gives slurred or skipped words.
- F5-TTS copies the clip's speaking rate, so a clip read quickly gives a quick voice.

Only use a voice you own or have explicit permission to clone. See "Voice cloning" in the README.

## Engines

`explainer voice --engine <name>` picks one (`EXPLAINER_ENGINE` for `make.sh`):

| engine | notes |
|---|---|
| `f5-tts` | The default. F5-TTS v1 Base. Needs the transcript. Scored best on speaker similarity and word error rate when the engines were compared. |
| `chatterbox` | Resemble AI's Chatterbox. No transcript needed. Its output carries an inaudible watermark. |
| `chatterbox-turbo` | The faster Chatterbox variant. |
| `fake` | A 220 Hz test tone, 0.36 s per word. Needs no GPU, model or reference clip; the tests and a dry run of the pipeline use it. |

## Pacing

Pace comes from F5 itself, set in `py/explainer/engines.py`:

- `F5_SPEED = 0.88`: F5 divides the duration it derives from the reference's speaking rate by this.
  Lower is slower.
- `F5_NFE = 64`: F5's `nfe_step`, the number of denoising steps. More steps sound cleaner and
  take longer.
- `F5_STRETCH = 1.0`: a pitch-preserving slow-down through ffmpeg's rubberband filter (atempo if
  rubberband is missing). Off by default: in listening tests a stretched voice sounded robotic.

Between sentences the voice pauses 0.25 s, and after a slide it pauses by how the narration ends
(0.25 s after `.` `?` `!`, 0.12 s after `,` `;` `:` or a dash, 0.06 s otherwise). Those live in
`py/explainer/voice.py`.

## Comparing engines

`explainer.bakeoff` voices three fixed test lines with each engine and scores them on speaker
similarity to your reference clip (resemblyzer), word error rate against Whisper's transcription,
and real-time factor. It needs the `tts` extra and resemblyzer:

```bash
uv run --extra tts --with resemblyzer python -c \
  "from pathlib import Path; from explainer.bakeoff import run; print(run(['fake','chatterbox','chatterbox-turbo','f5-tts'], Path('voice/ref.wav'), Path('out/bakeoff')))"
```

The generated lines and `results.json` land in `out/bakeoff/`. `fake` is the floor for similarity.
Listen to the lines as well: the scores do not catch a voice that sounds flat or rushed.
