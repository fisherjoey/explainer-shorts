# Script style guide

This is how to write `videos/<slug>/script.json` for a video. The renderer, the
voice and the captions are fixed. The script is the part that decides whether a video is worth
watching: the facts are right, each slide carries one idea, and the talk has a clear arc.

Read the schema in `src/schema.ts` alongside this guide. The finished example is
`videos/stack-vs-heap/script.json` (two things that complement each other).

## Targets

A video runs two and a half to three minutes, with a new slide every 3.6 seconds or so. At the
default voice settings (`docs/voice.md`) that is 520 to 580 words of narration.

| thing | target |
|---|---|
| slides | 40 to 48 |
| narration words, total | 520 to 580 |
| narration words, per slide | 9 to 15, averaging about 12.5 |
| dark slides | 1 or 2 |
| accent slides | 0 or 1 |
| sections | 5 to 7 |
| keywords per slide | 0 or 1 |
| headline | 2 lines at most, 60 characters at most including `\n` and `*`, about 30 per line |

The per-slide range is a limit, not a target. Fill every slide to 14 or 15 words and the total
overshoots: 44 slides at 12.5 words is 550. Most slides should land at 11 to 14.

`pnpm validate <slug>` enforces the hard limits: unique slide ids, non-empty narration, headline
of at most 2 lines and 60 characters, at most 40 narration words per slide, and the two layout
rules under "Layout, narrator and aside". It warns when the total falls outside 300 to 600 words.
`pnpm stats <slug>` checks the stricter targets in this guide. A finished script passes both (see
"Before rendering").

## The arc

Every video follows the same six parts, in this order.

| part | slides | what it does |
|---|---|---|
| 1. Hook | 2 to 3 | Name the pair, X versus Y. Then the problem both of them solve, in one sentence. Then a one-line contrast. |
| 2. Chapter X | 12 to 15 | X's defining property in one sentence ("Session authentication keeps state on the server."). Then the mechanism, step by step. At least one worked example with real numbers or values. One real-world case. |
| 3. Chapter Y | 12 to 15 | The same shape as chapter X, in the same order, so the viewer can line them up. |
| 4. The turn | 1 to 2, dark | The core weakness or trade-off, stated flatly. Usually opens with "But". |
| 5. Workarounds | 5 to 7 | Each fix on its own slide. Give a fix's cost its own slide when it changes the decision (an arena frees everything at once); otherwise put it in an aside on the fix's slide. |
| 6. The practical split | 5 to 7 | When to use which. The last slide is a one-line trade-off. |

The hook contrast is one line that holds the whole video: "A race gives a wrong answer. A
deadlock gives no answer at all." Or: "Sessions keep your identity on the server. JWT packs it
into the token itself."

Signpost each chapter out loud when it starts: "Start with the stack." "The heap is different."
"JWT keeps no state on the server." The section label changes on the same slide.

A second, smaller cost can sit between the workarounds and the split, as 2 to 4 slides. A
sessions-versus-JWT video might do this with token storage. It can also be how each one fails, mirrored: "The stack fails
at once…", then "The heap fails slowly…". Take those slides from the chapters so the total stays
in range.

The arc bends to fit three kinds of pair:

- **An approach and its rival** (sessions versus JWT): the arc as above.
- **Peers** (deadlock versus race condition), with no weakness to turn on. The turn is then the
  first slide of chapter Y ("Deadlock fails in a different way."), and the workarounds become the
  fixes for each.
- **Complements** (stack and heap, TCP and UDP): each covers what the other can't. Turn on the
  cost of the more flexible one ("the heap's freedom has a price"), and make the workarounds the
  ways people cut that cost (arenas, data layout, escape analysis). If the cost has two sides
  (slower to get, slower to reach), the turn can take a third slide from the workarounds, so parts
  4 and 5 still come to 6 to 9 slides between them.

A single subject ("how TLS works") has no pair, so give it one. Set it against what it replaces or
the naive way to do the same job (TLS versus plain HTTP, a B-tree versus a sorted array), then
follow the arc.

End on the trade-off. Do not add an outro, a summary slide, a call to action, or a question to the
audience.

## Narration

Narration is what the voice says and what the captions show.

- Give each slide 9 to 15 words and one idea. A slide lasts about 3.6 seconds, so a slide that
  needs two ideas becomes two slides.
- Put slide boundaries only at a sentence end or a clause break: a comma, "and", "so",
  "because", "which". Never split inside a phrase. A long sentence can run across two slides if
  each half reads on its own as a caption. Two short sentences can share a slide when they are one
  idea, such as a contrast.
- Name the real thing, spoken form: Redis, HttpOnly, HS256, a mutex, the expiry claim. Use real numbers:
  "at least 64 bits", "say 15 minutes", "both write 11, the counter should be 12". Each chapter gets
  one real-world case (banking, ticket booking, microservices).
- Keep code identifiers out of the narration unless they read as words (`main`, `area`,
  `malloc`). `make_scores` sounds wrong aloud, and a variable called `a` can't be fixed with a
  `pronounce` entry without also respelling every article "a". Show those in blocks.
- Keep the voice plain and confident: present tense, short words, no hype. Hedge only where the
  fact itself is conditional ("usually marked HttpOnly"), never to sound humble.
- Leave out jokes, filler and talk about the video itself. Never write "basically",
  "essentially", "in this video", "let's dive in", "it's important to note", or "as we saw".
  No call to action.
- Write for the ear:
  - Numbers as digits: "10", "64 bits", "15 minutes", "HS256". Whisper transcribes digits, so the
    caption timing lines up. Spell a number out only where the digit would read wrong aloud
    ("each one keeps you logged in").
  - Spell units out: "8 megabytes", "1 kilobyte", "100 nanoseconds". "8 MB" is read as "eight M
    B". Abbreviate units in blocks, where nothing is spoken.
  - Say "versus", never "vs".
  - No symbols the voice cannot say: no `→`, `/`, `&`, `%`, `*`, `#`, `+`, `_`, `=`, no
    parentheses, no markdown, no code. Write "server side", not "server/side". Hyphens in compound
    words are fine ("short-lived", "32-byte"). A name that contains a symbol, like C++, needs a
    `pronounce` entry (`"C++": "C plus plus"`), or a measured check that the voice says it right.
  - Avoid "e.g." and "i.e."; write "for example" or "say".
- Punctuation shapes the captions. A caption window holds up to 5 words and about 30 characters.
  It breaks after a word that ends in `.` `,` `;` `:` `?` `!` or `—`, and at a pause of more than
  0.6 seconds. Punctuation inside a number (1,000 or 3.6) does not break a caption. Put the commas
  where a speaker would pause.
- Mirror the chapters. If chapter X has "At login, the server creates a session record", then
  chapter Y opens with "At login, the server writes nothing down." Repeated structure lets the
  viewer see the difference.

### Splitting narration into slides

One long draft passage, then the same content as slides:

> At login the server makes a session record holding the user's identity and whatever else the app
> needs, keeps it in memory or a database or a shared store like Redis when there are several
> servers, then makes up a random session ID and hands it to the browser in a cookie, usually
> marked HttpOnly so JavaScript can't read it.

| slide | narration | words |
|---|---|---|
| s05 | At login, the server creates a session record and stores it. | 11 |
| s06 | That record holds who you are, plus anything else the app needs. | 12 |
| s07 | It lives in memory, a database, or commonly Redis once several servers need it. | 14 |
| s08 | Next comes a session ID: at least 64 random bits, new for every login. | 14 |
| s09 | The ID means nothing on its own. It only points to the record. | 13 |
| s10 | The ID goes back to the browser in a cookie, usually marked HttpOnly. | 13 |
| s11 | HttpOnly means JavaScript can't read the cookie, so injected scripts can't copy it. | 13 |

Each row is one step of the mechanism, and each could stand alone as a caption. The rewrite also
adds a number (64 bits) and a fact the draft skipped (the ID is only a pointer).

### Pronunciation

The voice reads the narration as written. A script-level `pronounce` map respells words for the
voice only. Captions and alignment keep the script's spelling.

```json
"pronounce": {"HttpOnly": "HTTP only", "HS256": "H-S 256", "JWT packs": "jay double-you tee packs"}
```

- Keys are whole words and case-sensitive: a `JWT` key never touches `JWTs` or `jwt`. The longest
  matching key wins.
- A key can be a phrase. `"JWT packs"` respells only the sentence with that phrase in it, so a word
  the voice gets right in most sentences and wrong in one is fixed in that one only.
- Start with no map. Voice the script, then run `explainer align --report` (see "After rendering") and
  look at every slide under 90 %, not only the ones `explainer align` warns about (under 80 %).
- Respell only what measurably breaks, and keep an entry only if its slide's match ratio goes up.
  Entries guessed in advance mostly change nothing, and some make their slides worse.
- Forms that worked with the voice this kit was tuned on (yours may differ): "HTTP only", "H-S 256", "base 64", "H.MAC", "E-C-D-S-A",
  "B-R-K", "M-map", "J-E-malloc", "glib-C", "assigner" (for "assignor"; the raw word came out as
  three syllables of noise), "JSON R-P-C", "post" (for "POST", which was heard as "plus"). Hyphens and joined dots beat letters separated by
  spaces ("J W T" made its slides worse).
- A comma or colon can add a pause the voice was skipping: "Say, 4" and "heap, lasts" fixed
  clipped words, and "fix is: layout" worked where a comma alone did not. Some slides only reach
  90 % with a combination of entries where every entry alone scores lower. Keep an entry, or a
  combination, only if `explainer align --report` shows its slide's ratio go up.
- Two things the voice cannot read at all: a spelled-out URL path ("GET api v1 games" came back
  as "GTAP EV1") and a very short standalone sentence ("There are 11." was dropped entirely).
  Rewrite the narration instead of respelling.
- Never put ". " (a period, then a space) inside a respelling. The sentence splitter cuts there,
  which leaves a pause mid-phrase or an empty clip.
- Each sentence is voiced on its own at a fixed seed, so a respelling changes only the sentence it
  is in, and you can test one on its sentence without re-voicing the script. Changing the seed,
  the engine, the reference clip or the pace means checking the map again.

## Headlines

The headline is the slide's claim in plain words. It is not a copy of the narration: the narration
carries the detail, and the headline says what the slide proves.

- 2 lines at most, 60 characters at most counting `\n` and `*`. Keep each line to about 30
  characters so it fits the 800 px headline width (`MAX_W` in `src/components/Headline.tsx`).
- Break the line with `\n` at a natural phrase boundary: `"Delete one row,\nand that login is over."`
- End with a period. A two-part claim can use a comma or a second sentence:
  `"It shrinks the problem.\nIt doesn't remove it."` A question mark is fine for a real question
  that the slide goes on to answer, but a claim is usually
  stronger, and the video never ends on one.
- Italicise at most one word with `*word*`: the one that carries the contrast
  (`"Session auth is\n*stateful*."`, `"Encoded is not *encrypted*.\nKeep secrets out of it."`).
- Chapter openers and turn slides can be short: "Statelessness has a price." Give them
  `"emphasis": true`: the headline is set at 90 px, with an accent rule under it on light slides.

## Section and kicker

- `section` is the chapter name in capitals. It appears in the header on every slide of that
  chapter, so it changes only when the arc moves on. Plan 5 to 7 sections per video. Ours:
  KEEPING A USER LOGGED IN, SESSION AUTH, JWT, THE COST OF STATELESSNESS, WHERE THE TOKEN LIVES,
  THE PRACTICAL SPLIT.
- `kicker` is a small capitalised label above the headline, 1 to 4 words, naming this slide's
  step: CHAPTER ONE, ON LOGIN, PART TWO, WHY IT SCALES, THE TURN, FIX TWO, THE CATCH. It changes on
  every slide and never repeats the section.

## Layout, narrator and aside

The page is 1080 × 1920. The numbers below come from `src/theme.ts`.

- `layout: "split"` is the default. The left column holds the aside and the optional narrator
  picture, which stands bottom-left behind a thin divider, from about y 800 down to y 1360. Every block stacks in the right column: 640 px wide from
  x 380, with the first block at y 440. The slide's flow region ends at y 1310 and the caption
  pill starts at y 1416, so a column fits about 3 blocks.
- `layout: "full"` puts the first block across the whole page (960 px) from y 470. Any further
  blocks stack in the right column directly under it, beside the narrator. The first block has to
  end 24 px or more above the top of the narrator picture, by y 775, so keep it under about 300 px tall: a compare, one
  or two rows of tiles, or a row of short terminals. A terminal or code panel is at least 300 px
  tall by itself. Use full for things that are wide by nature: a row of servers, a grid of
  services, a side-by-side comparison.
- `narrator`: leave it out and the renderer alternates the `idle` and `look` pictures (`look`
  falls back to `idle` when you only supply one). Use `"big"` on the dark turn and the accent
  slide. `"hidden"` drops the picture on that slide. Without narrator pictures, the pose still
  sets the column width.
- A big narrator needs the split layout, so leave `layout` out on those slides. It pushes the block
  column right to x 538 to 1020 (482 px wide, from y 440), so give those slides 1 or 2 compact
  blocks. A compare stacks its two sides below 560 px, so a compare works there (a mint "Scale."
  over a peach "Revocation.", say), and so do two stacked cards. A slide with an `aside` must be
  split and must not use a big narrator. The validator enforces both rules.
- `aside` is a grey paragraph in the left column, above the narrator, at a fixed y 560. Use it only on
  split slides, keep it under about 70 characters, and use it for the caveat or the definition
  the narration has no time for: "Bearer means whoever holds the token is treated as you." It is a
  good home for an accuracy footnote.

### Filling the column

A slide looks finished when its stack reaches down toward the bottom of the column: 3 or 4 blocks,
or panels that share the height. A column with two or more stretching panels
(terminal, code, and a card with both a title and a body) shares its height between them, so two
panels end near y 1142 and three near y 1195. A card with only a title or only a body keeps its
natural height, because stretched it turns into a tall, empty box. A column with one panel lays out
at natural height.

So a slide with a single block leaves the lower right empty. Where the narration supports it, give
it a second block: a closing `note` with the one-sentence takeaway, a `kv` of the values the first
block produced, or a card with a title and a body.

## Blocks

Blocks show the mechanism. They do not repeat the narration as bullet points. A viewer who mutes
the video should still be able to follow the steps from the blocks alone.

### Picking a block

| the beat is... | use |
|---|---|
| something happening on a server, a store, a log, a request or a response | `terminal` (title bar plus lines; rows appear line by line) |
| a data structure or a formula: a JSON payload, a function | `code` |
| what the client or browser sees: a page, a cookie jar, requests going out | `browser` |
| a sequence of steps in order | `steps` |
| parts of one whole (header, payload, signature) | `segments` |
| two things side by side, or what something buys versus what it costs | `compare` |
| a set of conditions, met or not met | `checklist` |
| many peers: services, servers, storage options | `tiles` |
| a short set of alternatives or labels | `chips` |
| one number that matters | `stat` |
| a level, a lifetime, an exposure | `meter` |
| a record with fields, or a lookup table | `kv` |
| one takeaway, a named case, "what it doesn't do" | `card` (`accentBar` marks the one that matters) |
| a token, an ID, or one short sentence | `note` (mono when the text has no spaces) |
| flow between two blocks | `arrow` |
| two or three blocks side by side | `row` |

`code` colours `lang: "json"` (the default) and `"js"`. Use `lang: "text"` for C, Go, assembly,
shell and anything else; it prints the code uncoloured.

### Size limits

Monospace text wraps at the column edge, so count characters. These budgets come from the kit's
type sizes, and `pnpm stats` checks them:

| block | split column (640 px) | full width (960 px) | beside a big narrator (482 px) |
|---|---|---|---|
| `code` line | 37 | 58 | 27 |
| `terminal` line | 40 | 63 | 29 |
| `terminal` line with `right`, both parts | 36 | 59 | 25 |
| `kv` row, key plus value | 43 | 67 | 31 |

- A line in the accent tone sits in a pill and fits 2 fewer characters. A half-width `row` cell in
  the full layout is 474 px wide: 27 characters of code, 29 of terminal, and 25 for a terminal line
  with `right`. Truncate long values with `…`.
- Use 1 to 3 blocks per slide. Terminal and code panels are at least 300 px tall. A code line takes
  46 px and a terminal line about 50 (80 with `right`), so a 10-line code block is about 550 px,
  and a code block plus a terminal fills a split column.
- Tiles default to 4 columns and wrap text that doesn't fit. Keep `title` to 1 or 2 words. In the
  split column `sub` fits about 9 characters at 4 columns, 14 at 3 and 24 at 2. At full width it
  fits 16 at 4 columns and 23 at 3.
- Block titles are set in capitals. Keep case-sensitive text, such as a command or a flag, in the
  block body, not the title.

### Continuity and real values

- Reuse the same objects across slides so the viewer can track them. In a sessions-versus-JWT
  video, one session ID (`8f4a2c9e1b7d4a06`) and one user (`1481`) would run through the whole
  sessions chapter, and one real token through the JWT chapter. In stack-vs-heap, one function
  (`area`, called with 3 and 4) and one 12-byte allocation run through the chapters.
- Make values real. A JWT's header segment should be the actual base64url encoding of
  `{"alg":"HS256","typ":"JWT"}`, its signature computed with HMAC-SHA256, and `exp` exactly `iat`
  plus 900 if you say 15 minutes. A viewer who pauses should find nothing fake.
- For systems topics (a compiler, the OS, an ISA), run the example and quote its output: compile
  it with `gcc -O0 -S`, read `/proc/self/maps`, `strace` it, `go build -gcflags=-m`. Every value on
  screen comes from compiling and running exactly the code on screen. Put the ISA, the compiler and
  the flags in the block title ("AREA · AARCH64 · GCC -O0"). Mind leaf functions, the optimisation
  level and the ABI: at -O0 an AArch64 leaf function never saves x30, and at -O2 the whole frame
  lives in registers. If you trim the output, title the block as an excerpt.
- Block text is not spoken, so it can use symbols (`→`, `✓`, `/orders`), code and lowercase.

## Cues

`cue` makes a block appear the moment the narration says a word, instead of on the default stagger
(8 frames after the slide starts, then 5 frames apart).

- The cue is one word from this slide's narration. Matching lowercases both sides, strips
  everything except letters and digits, and takes the first narration word that starts with the
  cue. `"session"` matches "sessions,"; `"ID"` matches "ID"; `"the"` would match
  "they". Pick a word that appears only once or first in the slide.
- Cue the noun that introduces the block: the session-store terminal on "session" in
  "creates a session record", the full token on "JSON" in "JSON Web Token", the storage tiles on
  "memory".
- Cues fire in the order the blocks stack, top to bottom. Once a block has a cue, every block
  below it needs a later cue. An uncued block appears on the default stagger, right at the start
  of the slide, which is before the cued block above it.
- A cue must sit before word number min(words − 2, floor(0.7 × words)), counting the slide's
  narration words from 0. For a 12-word slide, that means before word 8. The slide ends a quarter
  second after its audio, so a block cued on the last words is gone again in well under a second.
- Leave the cue off when the block belongs on screen from the start, like the first block of a
  slide whose subject is its first word.
- A cue with no matching word falls back silently to the stagger. `pnpm stats` checks every cue.
- A cue only works on a top-level block in `slide.visual`. A block inside a `row`'s `children` is
  ignored for cues; it reveals with the row itself.

## Themes

- Light is the default. Leave `theme` out.
- `"dark"`: 1 or 2 slides, and only for the turn, the core weakness. The inverted page tells the
  viewer the story changed direction. On the first dark slide, pair it with `narrator: "big"` (so a
  split layout) and `"emphasis": true`, and show the trade-off as a compare with `mint` and `peach`
  tones.
- `"accent"`: 0 or 1 slide. The headline sits on a terracotta band. Use it for the pivot into the
  practical split ("The practical split.") or for the moment the second idea arrives ("Enter the
  cache."). Give it a very short headline and few or no blocks.

## Keywords

- At most one per slide: the term the slide teaches (`stateful`, `HttpOnly`, `claims`,
  `revocation`). It gets a terracotta underline in the captions.
- It has to be a single word exactly as it appears in the narration, apart from case and
  punctuation.
- Most slides have none. Underline the first time a term is taught, not every mention.

## Accuracy

A wrong fact in a teaching video is worse than no video.

- Check every claim you are not sure of against a primary source: the RFC, MDN, the OWASP cheat
  sheets, the library's own docs (context7).
- Say what a mechanism does and what it does not. HttpOnly stops scripts reading a cookie. It does
  not stop injected code from sending requests the browser attaches that cookie to. Revoking a
  refresh token stops new access tokens. It does not end the access token already issued.
- Keep claims only as broad as they are true. Deleting one session record ends that one session.
  Logging a user out everywhere means deleting all of their records.
- Watch what the blocks imply as well as what the narration says. With an HS256 example running,
  a card saying "every service holds the key" tells the viewer to hand the signing secret to
  every service, which lets each one forge tokens. When services only verify, say public key.
- If the spoken line has to simplify, put the caveat in an `aside` or a block.

## Before rendering

1. Walk the arc: are the six parts there, with slide counts in range?
2. Read the narration aloud start to finish. It should flow as one talk, with no slide that only
   makes sense with its picture.
3. Run the validator and the stats check, and fix everything they report:

```bash
pnpm validate <slug>   # the hard limits the renderer needs
pnpm stats <slug>      # this guide's targets: words, cues, headlines, keywords, symbols, line widths
```

4. Look at the slides before voicing them. `pnpm stills <slug>` renders every slide from the script
   alone into `out/stills/<slug>/`, with a contact sheet at `sheet.png`. Fix any block that wraps
   badly, overflows, or runs into the narrator.

## After rendering

- `explainer align` should match at least 90 % of every slide's words.
  `uv run --extra tts explainer align videos/<slug> --report` lists each slide's ratio next to what
  Whisper heard. See "Pronunciation" for what to do about a low one.
- Duration and pace (words ÷ `total` in `videos/<slug>/timing.json`) are reported, not targets.
  The voice runs at F5's own pace: speed 0.88, nfe 64, no stretch. With the voice this kit was
  tuned on that came to about 215 to 230 words a minute overall, and 2.5 to 3 minutes for a 40
  to 48 slide deck; your reference clip sets its own pace. Short words raise words-per-minute at
  the same speaking rate. Let the content decide the length rather than padding or cutting to
  hit one.
- Changing narration or the `pronounce` map means re-running `./make.sh <slug>` (voice, align,
  render). A change to blocks, headlines or layout only needs `pnpm render <slug>`.
