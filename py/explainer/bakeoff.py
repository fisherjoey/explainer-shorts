"""Voice engine bake-off: speaker similarity to the reference, word error rate, real-time factor."""
from __future__ import annotations
import json, re, time
from pathlib import Path
import numpy as np
from explainer.audio import write_wav
from explainer.text import norm

LINES = [
    "Two threads, one shared counter, and a bug that only shows up under load.",
    "When a request arrives, the load balancer picks a healthy server and forwards the connection, keeping a small table of who went where.",
    "The cache should hold twelve entries after two inserts, but it holds eleven, because one write replaced the other.",
]

# WER normalisation: Whisper writes "twelve" as "12" and "versus" as "vs", which is formatting,
# not a pronunciation error. Both sides are normalised the same way before scoring.
_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
         "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
_SCALES = [(10**9, "billion"), (10**6, "million"), (1000, "thousand"), (100, "hundred")]
_ORDINALS = {"one": "first", "two": "second", "three": "third", "five": "fifth",
             "eight": "eighth", "nine": "ninth", "twelve": "twelfth"}
_ABBREV = {"vs": "versus"}

def int_words(n: int) -> str:
    """Spell out a non-negative integer: 1200 -> "one thousand two hundred"."""
    if n < 20:
        return _ONES[n]
    if n < 100:
        return _TENS[n // 10] + ("" if n % 10 == 0 else f" {_ONES[n % 10]}")
    for value, word in _SCALES:
        if n >= value:
            head, rest = divmod(n, value)
            return f"{int_words(head)} {word}" + ("" if rest == 0 else f" {int_words(rest)}")
    raise AssertionError(n)

def _ordinal_words(n: int) -> str:
    *head, last = int_words(n).split()
    last = _ORDINALS.get(last) or (last[:-1] + "ieth" if last.endswith("y") else last + "th")
    return " ".join([*head, last])

def _number_words(tok: str) -> str:
    whole, _, frac = tok.partition(".")
    words = int_words(int(whole))
    return f"{words} point {' '.join(_ONES[int(d)] for d in frac)}" if frac else words

def wer_words(text: str) -> list[str]:
    """Lowercase, expand &/%/digits/ordinals/vs, split hyphens, strip punctuation."""
    t = text.lower().replace("&", " and ").replace("%", " percent ")
    t = re.sub(r"(?<=\d),(?=\d{3}\b)", "", t)                               # 1,000 -> 1000
    t = re.sub(r"\b(\d+)(?:st|nd|rd|th)\b", lambda m: _ordinal_words(int(m.group(1))), t)
    t = re.sub(r"\d+(?:\.\d+)?", lambda m: f" {_number_words(m.group())} ", t)
    t = re.sub(r"[-‐-―]", " ", t)                                 # twenty-one -> twenty one
    return [_ABBREV.get(w, w) for w in (norm(x) for x in t.split()) if w]

def wer(ref: str, hyp: str) -> float:
    r, h = wer_words(ref), wer_words(hyp)
    d = np.zeros((len(r) + 1, len(h) + 1), dtype=int)
    d[:, 0], d[0, :] = range(len(r) + 1), range(len(h) + 1)
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i, j] = min(d[i-1, j] + 1, d[i, j-1] + 1, d[i-1, j-1] + (r[i-1] != h[j-1]))
    return d[-1, -1] / max(1, len(r))

def similarity(a: Path, b: Path) -> float:
    from resemblyzer import VoiceEncoder, preprocess_wav
    enc = VoiceEncoder("cpu")
    ea, eb = enc.embed_utterance(preprocess_wav(a)), enc.embed_utterance(preprocess_wav(b))
    return float(np.dot(ea, eb) / (np.linalg.norm(ea) * np.linalg.norm(eb)))

def run(engines: list[str], ref: Path, out: Path) -> list[dict]:
    from faster_whisper import WhisperModel
    from explainer.engines import get_engine
    asr = WhisperModel("small.en", device="cpu", compute_type="int8")
    results = []
    for name in engines:
        eng = get_engine(name, ref)
        sims, wers, rtfs = [], [], []
        for i, line in enumerate(LINES):
            t0 = time.time()
            x = eng.synthesize(line, seed=7)
            rtfs.append((time.time() - t0) / (len(x) / eng.sr))
            p = out / f"{name}-{i+1}.wav"
            write_wav(p, x, eng.sr)
            hyp = " ".join(s.text for s in asr.transcribe(str(p))[0])
            wers.append(wer(line, hyp))
            sims.append(similarity(ref, p))
        results.append({"engine": name, "similarity": round(float(np.mean(sims)), 3),
                        "wer": round(float(np.mean(wers)), 3), "rtf": round(float(np.mean(rtfs)), 2)})
        del eng
    (out / "results.json").write_text(json.dumps(results, indent=2))
    return results
