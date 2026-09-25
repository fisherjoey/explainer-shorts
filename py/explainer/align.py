from __future__ import annotations
import difflib, json, statistics
from dataclasses import dataclass
from pathlib import Path
from explainer.audio import read_wav
from explainer.text import tokens, norm

@dataclass
class Word:
    text: str
    start: float
    end: float

def align_words(script_words: list[str], heard: list[Word], t0: float, t1: float) -> tuple[list[Word], float]:
    a = [norm(w) for w in script_words]
    b = [norm(w.text) for w in heard]
    out: list[Word | None] = [None] * len(script_words)
    matched = 0
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                h = heard[j1 + k]
                out[i1 + k] = Word(script_words[i1 + k], h.start, h.end)
            matched += i2 - i1
        elif tag == "replace":
            span_s, span_e = heard[j1].start, heard[j2 - 1].end
            if "".join(a[i1:i2]) == "".join(b[j1:j2]):
                matched += i2 - i1
            lens = [max(1, len(x)) for x in a[i1:i2]]
            total, acc = sum(lens), 0
            for k, L in enumerate(lens):
                s = span_s + (span_e - span_s) * acc / total
                acc += L
                e = span_s + (span_e - span_s) * acc / total
                out[i1 + k] = Word(script_words[i1 + k], round(s, 3), round(e, 3))
    _fill_gaps(out, script_words, t0, t1)
    ratio = matched / len(script_words) if script_words else 1.0
    return [w for w in out if w is not None], ratio

def _fill_gaps(out, script_words, t0, t1):
    i = 0
    while i < len(out):
        if out[i] is not None:
            i += 1
            continue
        j = i
        while j < len(out) and out[j] is None:
            j += 1
        left = out[i - 1].end if i > 0 else t0
        right = out[j].start if j < len(out) else t1
        n = j - i
        step = (right - left) / n if n else 0
        for k in range(n):
            out[i + k] = Word(script_words[i + k], round(left + step * k, 3), round(left + step * (k + 1), 3))
        i = j
    for k in range(1, len(out)):
        if out[k].start < out[k - 1].start:
            out[k].start = out[k - 1].start
        if out[k].end < out[k].start:
            out[k].end = out[k].start

def transcribe(path: Path, model) -> list[Word]:
    segs, _ = model.transcribe(str(path), word_timestamps=True, language="en")
    return [Word(w.word.strip(), w.start, w.end) for s in segs for w in (s.words or [])]

def report_lines(ratios: list[tuple[str, float, str]]) -> list[str]:
    """One line per slide (id, match ratio, what Whisper heard), flagged under 90 %, then a summary."""
    out = [f"{sid} {r:.2f}{' <90' if r < 0.9 else ''}  heard: {heard}" for sid, r, heard in ratios]
    rs = [r for _, r, _ in ratios]
    if rs:
        out.append(f"min {min(rs):.3f} median {statistics.median(rs):.3f} "
                   f"under 90 %: {sum(r < 0.9 for r in rs)} of {len(rs)}")
    return out

def align_script(script: dict, timing: dict, video_dir: Path, model_name: str = "small.en",
                 report: bool = False) -> list[dict]:
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    by_id = {s["id"]: s for s in timing["slides"]}
    rows, ratios = [], []
    for slide in script["slides"]:
        t = by_id[slide["id"]]
        wav = Path(video_dir) / "audio" / f"{slide['id']}.wav"
        heard = transcribe(wav, model)
        words = tokens(slide["narration"])
        samples, sr = read_wav(wav)
        dur = len(samples) / sr
        aligned, ratio = align_words(words, heard, 0.0, dur)
        ratios.append((slide["id"], ratio, " ".join(w.text for w in heard)))
        if ratio < 0.8:
            print(f"warn: slide {slide['id']} only {ratio:.0%} of words matched — check the audio")
        rows += [{"text": w.text, "start": round(t["start"] + w.start, 3),
                  "end": round(t["start"] + w.end, 3), "slide": slide["id"]} for w in aligned]
    (Path(video_dir) / "words.json").write_text(json.dumps(rows, indent=1))
    if report:
        print("\n".join(report_lines(ratios)))
    return rows
