import numpy as np
from explainer.audio import trim_silence, silence, normalize_lufs, concat, read_wav, write_wav

SR = 24000

def tone(sec, amp=0.3):
    t = np.arange(int(sec * SR)) / SR
    return (amp * np.sin(2 * np.pi * 220 * t)).astype(np.float32)

def test_trim_silence_removes_edges_keeps_margin():
    x = concat([silence(0.5, SR), tone(1.0), silence(0.7, SR)])
    y = trim_silence(x, SR, keep_ms=40)
    assert abs(len(y) / SR - 1.08) < 0.02

def test_trim_all_silent_returns_empty():
    assert len(trim_silence(silence(1.0, SR), SR)) == 0

def test_normalize_lufs_hits_target():
    import pyloudnorm as pyln
    y = normalize_lufs(tone(3.0, amp=0.05), SR, target=-16.0)
    assert abs(pyln.Meter(SR).integrated_loudness(y) - (-16.0)) < 0.5
    assert np.max(np.abs(y)) <= 0.98 + 1e-6

def test_normalize_lufs_silence_stays_silent():
    y = normalize_lufs(silence(1.0, SR), SR)
    assert not np.any(np.isnan(y)) and not np.any(np.isinf(y))
    assert np.allclose(y, 0.0)

def test_wav_roundtrip(tmp_path):
    p = tmp_path / "a.wav"
    write_wav(p, tone(0.5), SR)
    y, sr = read_wav(p)
    assert sr == SR and y.dtype == np.float32 and abs(len(y) - 0.5 * SR) <= 1
