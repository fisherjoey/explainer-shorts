import json, shutil
from pathlib import Path
import numpy as np
import pytest
import explainer.engines as engines
from explainer.engines import FakeEngine, time_stretch
from explainer.voice import SENTENCE_PAUSE, apply_pronounce, synthesize_script, slide_gap, SENTENCE_GAP, CLAUSE_GAP, FLOW_GAP
from explainer.audio import read_wav

SCRIPT = {"slug": "t", "title": "T", "slides": [
    {"id": "s01", "section": "A", "headline": "h", "narration": "one two three four."},
    {"id": "s02", "section": "A", "headline": "h", "narration": "five six. seven eight nine ten."},
]}

def test_synthesize_script_writes_audio_and_timing(tmp_path: Path):
    t = synthesize_script(SCRIPT, FakeEngine(), tmp_path)
    assert json.loads((tmp_path / "timing.json").read_text()) == t
    assert [s["id"] for s in t["slides"]] == ["s01", "s02"]
    voice, sr = read_wav(tmp_path / "audio" / "voice.wav")
    assert abs(len(voice) / sr - t["total"]) < 0.05
    assert (tmp_path / "audio" / "s01.wav").exists() and (tmp_path / "audio" / "s02.wav").exists()
    # FakeEngine: 0.36 s/word; s02 is two sentences (2 + 4 words) joined by SENTENCE_PAUSE
    s2 = t["slides"][1]
    assert s2["start"] > t["slides"][0]["start"]

def test_sentence_pause_is_pinned(tmp_path: Path):
    # Natural narration pauses 0.21-0.29 s between sentences; pace depends on this value.
    assert SENTENCE_PAUSE == 0.25
    script = {"slug": "t", "title": "T", "slides": [
        {"id": "s01", "section": "A", "headline": "h", "narration": "five six. seven eight nine ten."}]}
    synthesize_script(script, FakeEngine(), tmp_path)
    x, sr = read_wav(tmp_path / "audio" / "s01.wav")
    expected = 6 * 0.36 + SENTENCE_PAUSE          # 2 + 4 words of FakeEngine tone, one pause
    assert abs(len(x) - expected * sr) <= 1       # within one sample of rounding

class RecordingEngine(FakeEngine):
    """FakeEngine that records every text it is asked to synthesize."""
    def __init__(self):
        self.texts: list[str] = []

    def synthesize(self, text: str, seed: int) -> np.ndarray:
        self.texts.append(text)
        return super().synthesize(text, seed)

def test_pronounce_reaches_the_engine_only(tmp_path: Path):
    narration = "Mark it HttpOnly, not HttpOnlyX or httponly. HttpOnly cookies win."
    script = {"slug": "t", "title": "T", "pronounce": {"HttpOnly": "HTTP only"},
              "slides": [{"id": "s01", "section": "A", "headline": "h", "narration": narration}]}
    eng = RecordingEngine()
    t = synthesize_script(script, eng, tmp_path)
    assert eng.texts == ["Mark it HTTP only, not HttpOnlyX or httponly.", "HTTP only cookies win."]
    assert script["slides"][0]["narration"] == narration          # the script itself is untouched
    assert [s["id"] for s in t["slides"]] == ["s01"]
    assert (tmp_path / "audio" / "s01.wav").exists()

def test_apply_pronounce_rules():
    p = {"HttpOnly": "HTTP only", "JWT": "J W T", "JWTs": "J W Ts"}
    assert apply_pronounce("HttpOnly,", p) == "HTTP only,"
    assert apply_pronounce("(HttpOnly)", p) == "(HTTP only)"
    assert apply_pronounce("HttpOnlyX xHttpOnly httponly", p) == "HttpOnlyX xHttpOnly httponly"
    assert apply_pronounce("JWTs beat a JWT.", p) == "J W Ts beat a J W T."
    assert apply_pronounce("no change", None) == "no change"
    assert apply_pronounce("no change", {}) == "no change"

def test_apply_pronounce_multi_word_key():
    # A phrase key respells one sentence and leaves every other use of its first word alone;
    # it beats a shorter key that starts at the same place (longest key wins).
    p = {"JWT packs": "jay double-you tee packs", "JWT": "J W T", "C++": "C plus plus"}
    assert apply_pronounce("JWT packs it in.", p) == "jay double-you tee packs it in."
    assert apply_pronounce("A JWT is signed.", p) == "A J W T is signed."
    assert apply_pronounce("JWT  packs, JWT packsX", p) == "J W T  packs, J W T packsX"
    assert apply_pronounce("In C++ and Java,", p) == "In C plus plus and Java,"

class RaisingThenOkEngine(FakeEngine):
    """Raises once, then synthesizes normally — proves a slide that fails TTS is retried once
    with a new seed rather than failing the whole run."""
    def __init__(self):
        self.calls: list[int] = []

    def synthesize(self, text: str, seed: int) -> np.ndarray:
        self.calls.append(seed)
        if len(self.calls) == 1:
            raise RuntimeError("transient TTS error")
        return super().synthesize(text, seed)

class AlwaysRaisingEngine(FakeEngine):
    """Raises on every call — the retry should exhaust and the error should propagate,
    and synthesize_script should name the failing slide."""
    def __init__(self):
        self.calls = 0

    def synthesize(self, text: str, seed: int) -> np.ndarray:
        self.calls += 1
        raise RuntimeError("permanent TTS error")

def test_synthesize_retries_once_on_a_raising_engine_with_a_new_seed(tmp_path: Path):
    script = {"slug": "t", "title": "T",
              "slides": [{"id": "s01", "section": "A", "headline": "h", "narration": "one two three."}]}
    eng = RaisingThenOkEngine()
    t = synthesize_script(script, eng, tmp_path)
    assert [s["id"] for s in t["slides"]] == ["s01"]
    assert len(eng.calls) == 2 and eng.calls[1] != eng.calls[0]   # retried with a different seed

def test_synthesize_propagates_and_names_the_slide_when_the_retry_also_fails(tmp_path: Path):
    script = {"slug": "t", "title": "T",
              "slides": [{"id": "s07", "section": "A", "headline": "h", "narration": "one two three."}]}
    eng = AlwaysRaisingEngine()
    with pytest.raises(RuntimeError, match="s07"):
        synthesize_script(script, eng, tmp_path)
    assert eng.calls == 2   # one retry, then it gives up

def test_f5_engine_fails_fast_without_ffmpeg(monkeypatch, tmp_path: Path):
    # Checked before any model import, so this runs without the tts extra or a GPU.
    monkeypatch.setattr(engines.shutil, "which", lambda name: None)
    with pytest.raises(RuntimeError, match="ffmpeg not found on PATH"):
        engines.F5Engine(tmp_path / "ref.wav", stretch=0.95)

class RecordingModel:
    """Stands in for F5TTS: records the kwargs `infer` is called with, no model load involved."""
    def __init__(self):
        self.calls: list[dict] = []

    def infer(self, ref, ref_text, text, **kwargs):
        self.calls.append(kwargs)
        return np.zeros(10, dtype=np.float32), 24000, None

def test_f5_engine_passes_nfe_step_to_infer():
    # Builds an F5Engine without __init__ (which would load the real model), to check nfe_step
    # reaches F5TTS.infer.
    eng = object.__new__(engines.F5Engine)
    eng.ref, eng.ref_text = "ref.wav", "ref text"
    eng.speed, eng.stretch, eng.nfe_step = 0.88, 1.0, 64
    eng.model = RecordingModel()
    eng.sr = 24000
    eng.synthesize("hello", seed=7)
    assert eng.model.calls == [{"show_info": eng.model.calls[0]["show_info"], "speed": 0.88,
                                 "seed": 7, "nfe_step": 64}]

def test_time_stretch_raises_with_ffmpeg_stderr_on_failure(monkeypatch):
    import subprocess as sp

    class FailingResult:
        returncode = 1
        stdout = b""
        stderr = b"Error reinitializing filter: Function not implemented\n"

    monkeypatch.setattr(sp, "run", lambda *a, **k: FailingResult())
    x = FakeEngine().synthesize("one two", 7)
    with pytest.raises(RuntimeError, match="Function not implemented"):
        time_stretch(x, FakeEngine.sr, 0.8)

def test_time_stretch_identity_is_a_no_op():
    x = FakeEngine().synthesize("one two", 7)
    y = time_stretch(x, FakeEngine.sr, 1.0)
    assert y.dtype == np.float32 and np.array_equal(x, y)

@pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="needs ffmpeg")
@pytest.mark.parametrize("force_atempo", [False, True])
def test_time_stretch_slows_and_keeps_the_contract(monkeypatch, force_atempo):
    if force_atempo:
        monkeypatch.setattr(engines, "_rubberband_ok", False)
    x = FakeEngine().synthesize("one two three four five", 7)   # 1.8 s tone at 24 kHz
    y = time_stretch(x, FakeEngine.sr, 0.8)
    assert y.dtype == np.float32 and y.ndim == 1
    assert abs(len(y) / (len(x) / 0.8) - 1) < 0.02               # 0.8 tempo = 1.25x longer

def test_slide_gap_tiers():
    assert slide_gap("Both solve the same problem.") == SENTENCE_GAP
    assert slide_gap("Is it? ") == SENTENCE_GAP
    assert slide_gap('He said "stop."') == SENTENCE_GAP
    assert slide_gap("keeping a user logged in,") == CLAUSE_GAP
    assert slide_gap("three steps:") == CLAUSE_GAP
    assert slide_gap("the server looks up the session") == FLOW_GAP
    # Regression: curly quotes (smart quotes) must be stripped
    assert slide_gap('He said ”stop.”') == SENTENCE_GAP  # curly double quotes "stop."
    assert slide_gap('it’s done.’') == SENTENCE_GAP  # curly single quote it's done.'

def test_synthesize_uses_punctuation_gaps(tmp_path):
    script = {"slug": "g", "title": "G", "slides": [
        {"id": "s01", "section": "A", "headline": "h", "narration": "one two three"},
        {"id": "s02", "section": "A", "headline": "h", "narration": "four five six."},
        {"id": "s03", "section": "A", "headline": "h", "narration": "seven eight,"},
        {"id": "s04", "section": "A", "headline": "h", "narration": "nine."},
    ]}
    t = synthesize_script(script, FakeEngine(), tmp_path)
    s = t["slides"]
    dur = lambda n: n * 0.36   # FakeEngine: 0.36 s per word, single sentence, nothing trimmed
    assert abs((s[1]["start"] - s[0]["start"]) - (dur(3) + FLOW_GAP)) < 0.01
    assert abs((s[2]["start"] - s[1]["start"]) - (dur(3) + SENTENCE_GAP)) < 0.01
    assert abs((s[3]["start"] - s[2]["start"]) - (dur(2) + CLAUSE_GAP)) < 0.01
