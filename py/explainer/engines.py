from __future__ import annotations
import logging, shutil, subprocess
from pathlib import Path
from typing import Protocol
import numpy as np

log = logging.getLogger(__name__)

DEFAULT_ENGINE = "f5-tts"   # bake-off winner, see docs/voice.md

class Engine(Protocol):
    name: str
    sr: int
    def synthesize(self, text: str, seed: int) -> np.ndarray: ...

class FakeEngine:
    name = "fake"
    sr = 24000
    def synthesize(self, text: str, seed: int) -> np.ndarray:
        n = max(1, len(text.split()))
        t = np.arange(int(0.36 * n * self.sr)) / self.sr
        return (0.2 * np.sin(2 * np.pi * 220 * t)).astype(np.float32)

class ChatterboxEngine:
    def __init__(self, ref: Path, variant: str = "standard", exaggeration: float = 0.5, cfg_weight: float = 0.5):
        import torch
        self.ref = str(ref)
        self.variant = variant
        self.exaggeration, self.cfg_weight = exaggeration, cfg_weight
        self.name = "chatterbox" if variant == "standard" else f"chatterbox-{variant}"
        device = "cuda" if torch.cuda.is_available() else "cpu"
        if variant == "turbo":
            from chatterbox.tts_turbo import ChatterboxTurboTTS
            self.model = ChatterboxTurboTTS.from_pretrained(device=device)
        else:
            from chatterbox.tts import ChatterboxTTS
            self.model = ChatterboxTTS.from_pretrained(device=device)
        self.sr = self.model.sr

    def synthesize(self, text: str, seed: int) -> np.ndarray:
        import torch
        torch.manual_seed(seed)
        kwargs = {"audio_prompt_path": self.ref}
        if self.variant == "standard":
            kwargs |= {"exaggeration": self.exaggeration, "cfg_weight": self.cfg_weight}
        wav = self.model.generate(text, **kwargs)
        return wav.squeeze(0).detach().cpu().numpy().astype(np.float32)

_rubberband_ok: bool | None = None

def _has_rubberband() -> bool:
    """Whether ffmpeg has the rubberband filter; checked once, falls back to atempo with one warning."""
    global _rubberband_ok
    if _rubberband_ok is None:
        out = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout
        _rubberband_ok = any(line.split()[1:2] == ["rubberband"] for line in out.splitlines())
        if not _rubberband_ok:
            log.warning("ffmpeg has no rubberband filter; F5 stretch falls back to atempo")
    return _rubberband_ok

def time_stretch(x: np.ndarray, sr: int, tempo: float) -> np.ndarray:
    """Pitch-preserving tempo change through ffmpeg: tempo < 1 is slower (longer), 1.0 is a no-op.

    Mono float32 in, mono float32 out at the same sample rate.
    """
    x = np.ascontiguousarray(x, dtype=np.float32).reshape(-1)
    if tempo == 1.0 or len(x) == 0:
        return x
    filt = f"rubberband=tempo={tempo:.6f}" if _has_rubberband() else f"atempo={tempo:.6f}"
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "pipe:0",
                        "-af", filt, "-f", "f32le", "-ar", str(sr), "-ac", "1", "pipe:1"],
                       input=x.tobytes(), capture_output=True)
    if p.returncode != 0:
        stderr = p.stderr.decode("utf-8", "replace").strip()
        tail = stderr[-2000:] if stderr else "(no stderr)"
        raise RuntimeError(f"ffmpeg {filt} failed with exit code {p.returncode}: {tail}")
    return np.frombuffer(p.stdout, dtype=np.float32).copy()

# Pacing (docs/voice.md). F5 derives duration from the reference's speaking rate
# divided by `speed`, but on short sentences it spends extra time on leading silence (trimmed away)
# rather than slower speech. The stretch machinery below can slow the speech itself pitch-
# preservingly, but a 2026-09-15 listening test found the stretched voice sounds robotic, so it is
# off by default (F5_STRETCH = 1.0, a no-op). Chosen by ear the same day from an A/B/B5 test: F5
# speed 0.88 with nfe_step 64 ("B5") is the pick, no stretch. Pace comes from F5_SPEED and F5_NFE
# alone; the stretch parameter and `time_stretch` stay available for anyone who wants to re-enable it.
F5_SPEED = 0.88
F5_STRETCH = 1.0
F5_NFE = 64

class F5Engine:
    """F5-TTS v1 Base (installed by the `tts` extra). Needs the reference transcript, read from
    `ref` with a .txt suffix (voice/ref.txt) unless `ref_text` is given.
    """
    name = "f5-tts"

    def __init__(self, ref: Path, ref_text: str | None = None, speed: float = F5_SPEED, stretch: float = F5_STRETCH,
                 nfe_step: int = F5_NFE):
        if stretch != 1.0 and shutil.which("ffmpeg") is None:   # fail before loading the model, not mid-run
            raise RuntimeError("ffmpeg not found on PATH; needed for the pitch-preserving stretch")
        import torch
        from f5_tts.api import F5TTS
        self.ref = str(ref)
        self.ref_text = ref_text if ref_text is not None else Path(ref).with_suffix(".txt").read_text().strip()
        self.speed, self.stretch, self.nfe_step = speed, stretch, nfe_step
        self.model = F5TTS(device="cuda" if torch.cuda.is_available() else "cpu")
        self.sr = self.model.target_sample_rate

    def synthesize(self, text: str, seed: int) -> np.ndarray:
        wav, _sr, _spec = self.model.infer(self.ref, self.ref_text, text, show_info=lambda *a, **k: None,
                                           speed=self.speed, seed=seed, nfe_step=self.nfe_step)
        return time_stretch(np.asarray(wav, dtype=np.float32), self.sr, self.stretch)

def get_engine(name: str, ref: Path) -> Engine:
    if name == "fake":
        return FakeEngine()
    if name == "chatterbox":
        return ChatterboxEngine(ref)
    if name == "chatterbox-turbo":
        return ChatterboxEngine(ref, variant="turbo")
    if name == "f5-tts":
        return F5Engine(ref)
    raise ValueError(f"unknown engine {name!r}")
