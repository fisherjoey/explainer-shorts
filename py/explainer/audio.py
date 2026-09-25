from pathlib import Path
import numpy as np
import soundfile as sf
import pyloudnorm as pyln

def read_wav(path) -> tuple[np.ndarray, int]:
    x, sr = sf.read(str(path), dtype="float32", always_2d=True)
    return x.mean(axis=1).astype(np.float32), sr

def write_wav(path, x: np.ndarray, sr: int) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), np.asarray(x, dtype=np.float32), sr, subtype="PCM_16")

def silence(seconds: float, sr: int) -> np.ndarray:
    return np.zeros(int(round(seconds * sr)), dtype=np.float32)

def concat(chunks: list[np.ndarray]) -> np.ndarray:
    return np.concatenate([c.astype(np.float32) for c in chunks]) if chunks else np.zeros(0, np.float32)

def trim_silence(x: np.ndarray, sr: int, thresh_db: float = -45.0, keep_ms: int = 40) -> np.ndarray:
    win = max(1, int(sr * 0.01))
    n = len(x) // win
    if n == 0:
        return x[:0]
    rms = np.sqrt(np.mean(x[: n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    loud = np.where(20 * np.log10(rms) > thresh_db)[0]
    if len(loud) == 0:
        return x[:0]
    keep = int(sr * keep_ms / 1000)
    a = max(0, loud[0] * win - keep)
    b = min(len(x), (loud[-1] + 1) * win + keep)
    return x[a:b]

def normalize_lufs(x: np.ndarray, sr: int, target: float = -16.0) -> np.ndarray:
    loud = pyln.Meter(sr).integrated_loudness(x)
    if not np.isfinite(loud):
        return x.astype(np.float32)
    y = x * (10 ** ((target - loud) / 20))
    peak = np.max(np.abs(y)) if len(y) else 0.0
    if peak > 0.98:
        y = y * (0.98 / peak)
    return y.astype(np.float32)
