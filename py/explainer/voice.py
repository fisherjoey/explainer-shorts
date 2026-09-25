from __future__ import annotations
import json, re
from pathlib import Path
import numpy as np
from explainer.audio import trim_silence, silence, normalize_lufs, concat, write_wav
from explainer.text import split_sentences
from explainer.timing import build_timing

SENTENCE_PAUSE = 0.25   # natural between-sentence pauses run about 0.21-0.29 s
SENTENCE_GAP = 0.25     # pause after slide ending with . ? !
CLAUSE_GAP = 0.12       # pause after slide ending with , ; : — –
FLOW_GAP = 0.06         # pause after slide ending mid-phrase

def slide_gap(narration: str) -> float:
    """Determine the pause after a slide based on how its narration ends.

    Strips whitespace and trailing punctuation/quotes, then checks the final character:
    - ends with . ? ! → SENTENCE_GAP (0.25 s)
    - ends with , ; : — – → CLAUSE_GAP (0.12 s)
    - otherwise → FLOW_GAP (0.06 s)
    """
    # Strip leading/trailing whitespace
    stripped = narration.strip()
    if not stripped:
        return FLOW_GAP

    # Strip trailing quotes (straight and curly), closing paren
    # Straight: " ' )
    # Curly: " ' (U+201D, U+2019)
    trailing_chars = '''"\')”’'''
    while stripped and stripped[-1] in trailing_chars:
        stripped = stripped[:-1]

    if not stripped:
        return FLOW_GAP

    last_char = stripped[-1]

    if last_char in '.?!':
        return SENTENCE_GAP
    elif last_char in ',;:—–':
        return CLAUSE_GAP
    else:
        return FLOW_GAP

def apply_pronounce(text: str, pronounce: dict[str, str] | None) -> str:
    """Whole-word, case-sensitive respelling for TTS only: {"HttpOnly": "HTTP only"} turns
    "HttpOnly," into "HTTP only," but leaves "HttpOnlyX" and "httponly" alone.
    A key can be a phrase ({"JWT packs": "jay double-you tee packs"}): it matches that exact
    text, single spaces included, so it respells one sentence and no other "JWT"."""
    if not pronounce:
        return text
    keys = sorted(pronounce, key=len, reverse=True)          # longest key wins ("JWTs" before "JWT")
    pat = re.compile(r"(?<!\w)(" + "|".join(map(re.escape, keys)) + r")(?!\w)")
    return pat.sub(lambda m: pronounce[m.group(1)], text)

def _slide_audio(engine, text: str, seed: int) -> np.ndarray:
    parts = []
    for i, sent in enumerate(split_sentences(text)):
        x = None
        last_err: Exception | None = None
        for attempt in range(2):
            try:
                x = trim_silence(engine.synthesize(sent, seed + attempt * 1000), engine.sr)
            except Exception as e:   # a slide that fails TTS is retried once with a new seed
                last_err, x = e, None
                continue
            last_err = None
            if len(x) > 0:
                break
        if last_err is not None:
            raise last_err
        if x is None or len(x) == 0:
            raise RuntimeError(f"TTS produced no audio for: {sent!r}")
        if parts:
            parts.append(silence(SENTENCE_PAUSE, engine.sr))
        parts.append(x)
    return concat(parts)

def synthesize_script(script: dict, engine, video_dir: Path, seed: int = 7) -> dict:
    video_dir = Path(video_dir)
    audio_dir = video_dir / "audio"
    pronounce = script.get("pronounce")
    ids, durs, clips = [], [], []
    for slide in script["slides"]:
        try:
            # Respelling reaches the engine only; wavs, timing and alignment stay keyed to the script.
            x = _slide_audio(engine, apply_pronounce(slide["narration"], pronounce), seed)
        except Exception as e:
            raise RuntimeError(f"slide {slide['id']}: {e}") from e
        write_wav(audio_dir / f"{slide['id']}.wav", x, engine.sr)
        ids.append(slide["id"]); durs.append(len(x) / engine.sr); clips.append(x)

    # Compute gaps between slides based on how each slide's narration ends
    gaps = [slide_gap(s["narration"]) for s in script["slides"][:-1]]
    timing = build_timing(ids, durs, gaps=gaps)

    sr = engine.sr
    track = [silence(timing["slides"][0]["start"], sr)]
    for i, x in enumerate(clips):
        track.append(x)
        nxt = timing["slides"][i]["end"]
        pad = nxt - timing["slides"][i]["start"] - len(x) / sr
        track.append(silence(max(0.0, pad), sr))
    voice = normalize_lufs(concat(track), sr)
    write_wav(audio_dir / "voice.wav", voice, sr)
    (video_dir / "timing.json").write_text(json.dumps(timing, indent=2))
    return timing
