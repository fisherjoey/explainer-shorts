"""Long-form narration: markdown in, mp3 out, in the cloned voice.
Reuses the video voice stage's per-sentence synthesis."""
from __future__ import annotations
import re, subprocess, tempfile
from pathlib import Path
from explainer.audio import concat, normalize_lufs, silence, write_wav
from explainer.voice import _slide_audio

PARAGRAPH_GAP = 0.6

def _strip_emphasis(text: str) -> str:
    """Drop markdown emphasis delimiters at word edges and inline-code backticks, but leave
    intraword and spaced *, _ alone: "snake_case" and "2 * 3" pass through unchanged, while
    "**bold**" and "_it_" lose their delimiters."""
    text = text.replace("`", "")

    def repl(m: re.Match) -> str:
        s = m.string
        prev = s[m.start() - 1] if m.start() > 0 else None
        nxt = s[m.end()] if m.end() < len(s) else None
        is_word = lambda c: c is not None and c.isalnum()
        is_boundary = lambda c: not is_word(c)
        opening = is_boundary(prev) and is_word(nxt)
        closing = is_word(prev) and is_boundary(nxt)
        return "" if (opening or closing) else m.group(0)

    return re.sub(r"\*+|_+", repl, text)

def paragraphs(text: str) -> list[str]:
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    out = []
    for block in re.split(r"\n\s*\n", text):
        lines = [re.sub(r"^\s*(#+|[-*+]|\d+[.)])\s+", "", l).strip() for l in block.splitlines()]
        para = " ".join(l for l in lines if l)
        para = _strip_emphasis(para).strip()
        if para:
            out.append(para)
    return out

def narrate(src: Path, out: Path, engine, seed: int = 7) -> float:
    paras = paragraphs(Path(src).read_text())
    if not paras:
        raise ValueError("nothing to narrate")
    sr = engine.sr
    track = []
    for i, p in enumerate(paras):
        if i:
            track.append(silence(PARAGRAPH_GAP, sr))
        track.append(_slide_audio(engine, p, seed))
    voice = normalize_lufs(concat(track), sr)
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "n.wav"
        write_wav(wav, voice, sr)
        out.parent.mkdir(parents=True, exist_ok=True)
        p = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ac", "1", "-b:a", "96k", str(out)],
                            capture_output=True, text=True)
        if p.returncode != 0:
            tail = p.stderr.strip() if p.stderr else "(no stderr)"
            raise RuntimeError(f"ffmpeg failed with exit code {p.returncode}: {tail[-2000:]}")
    return len(voice) / sr
