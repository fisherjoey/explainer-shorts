import pytest
from explainer.timing import build_timing

def test_build_timing_contiguous():
    t = build_timing(["s01", "s02", "s03"], [2.0, 3.0, 1.0], gap=0.25, lead_in=0.1, tail=0.6)
    s = t["slides"]
    assert t["fps"] == 30
    assert s[0] == {"id": "s01", "start": 0.1, "end": 2.35}
    assert s[1] == {"id": "s02", "start": 2.35, "end": 5.6}
    assert s[2] == {"id": "s03", "start": 5.6, "end": 7.2}
    assert t["total"] == 7.2

def test_first_slide_starts_at_zero_visually_is_callers_job():
    t = build_timing(["a"], [1.0], lead_in=0.0, tail=0.0)
    assert t["slides"][0]["start"] == 0.0 and t["total"] == 1.0

def test_build_timing_per_slide_gaps():
    t = build_timing(["a", "b", "c"], [1.0, 1.0, 1.0], lead_in=0.1, tail=0.6, gaps=[0.06, 0.25])
    s = t["slides"]
    assert s[0] == {"id": "a", "start": 0.1, "end": 1.16}
    assert s[1] == {"id": "b", "start": 1.16, "end": 2.41}
    assert s[2] == {"id": "c", "start": 2.41, "end": 4.01}
    assert t["total"] == 4.01

def test_build_timing_gaps_length_mismatch():
    with pytest.raises(ValueError):
        build_timing(["a", "b"], [1.0, 1.0], gaps=[0.1, 0.2])
