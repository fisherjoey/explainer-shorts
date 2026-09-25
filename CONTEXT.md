# Glossary

The words this project uses, in the code, the style guide and conversation.

**Video.** One explainer, kept in `videos/<slug>/`: the script, plus the generated timing manifest,
words file and audio. It renders to `out/<slug>.mp4` at 1080 × 1920, 30 fps.

**Slide.** One screen of a video and one entry in the script's `slides` list, with an id like
`s07`. It carries one idea and 9 to 15 words of narration.

**Section.** The chapter name in capitals, shown in the header of every slide in that chapter. It
changes only when the arc moves on.

**Kicker.** The small capitalised label above the headline, marked `✱`, naming this slide's step
(`FIX TWO`, `ON RETURN`). It changes on every slide.

**Headline.** The slide's claim in large serif type: at most 2 lines and 60 characters, with one
word in `*italics*` at most.

**Emphasis.** A headline flag (`"emphasis": true`) that sets it at 90 px, with an accent rule
under it on light slides. Chapter openers and the turn use it.

**Narration.** What the voice says on a slide, and what the captions show.

**Pronounce map.** The script-level `pronounce` field: respellings the voice uses instead of the
script's words (`"HttpOnly": "HTTP only"`). Keys are whole words or phrases, case-sensitive. The
captions keep the script's spelling.

**Block.** One visual element in a slide's `visual` list: terminal, code, card, compare, kv,
steps and so on.

**Panel.** A block that stretches when two or more share a column: a terminal, a code block, or a
card with both a title and a body.

**Cue.** A word of the slide's narration that makes a block appear the moment it is spoken.
Without one, a block appears on the default stagger at the start of the slide.

**Caption window.** The group of words the karaoke pill shows at once: up to 5 words and about 30
characters, broken at punctuation, long pauses and slide changes.

**Theme.** A slide's colour scheme: `light` (the default), `dark` (the turn, the video's core
weakness), or `accent` (the headline on a terracotta band, for the pivot into the practical
split).

**Layout.** How a slide places its blocks: `split` (the default; blocks in the right column
beside the narrator) or `full` (the first block across the whole page, the rest in the column).

**Narrator.** The optional picture bottom-left on each slide, supplied by you as
`public/narrator/idle.png` and, optionally, `public/narrator/look.png`. Without one, no picture is
drawn.

**Pose.** The narrator's state on a slide (the script's `narrator` field): `idle`, `look`, `big`
(larger, pushing the column right) or `hidden`. Left unset, the renderer alternates idle and look.

**Reference clip.** The 8 to 12 s voice sample the narration is cloned from: `voice/ref.wav`
(or `$EXPLAINER_REF`), plus its word-for-word transcript in `voice/ref.txt`. It stays out of git.

**Engine.** A text-to-speech backend in `explainer.engines`: `f5-tts` (the default), `chatterbox`,
`chatterbox-turbo`, or `fake` (a test tone).

**Stretch.** The pitch-preserving slow-down (`F5_STRETCH`) available on the engine's output. Off
by default (1.0): in listening tests it made the voice sound robotic. Pace comes from F5 itself:
`F5_SPEED = 0.88` and `F5_NFE = 64` (F5's `nfe_step`).

**Slide gap.** The pause after a slide, set by how its narration ends: 0.25 s after `.` `?` `!`,
0.12 s after `,` `;` `:` `—`, and 0.06 s otherwise.

**Timing manifest.** `videos/<slug>/timing.json`: the frame rate, the total length, and each
slide's start and end in seconds.

**Words file.** `videos/<slug>/words.json`: every narration word with its start and end time and
its slide, from alignment.

**Align ratio.** The share of a slide's narration words that Whisper hears back in the voiced
audio. `explainer align --report` prints it for every slide. The target is 90 % or more.
