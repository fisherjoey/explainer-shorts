from explainer.align import Word, align_words, report_lines

def W(t, s, e): return Word(t, s, e)

def test_exact_match_copies_times_with_script_spelling():
    heard = [W("both", 0.0, 0.2), W("solve", 0.2, 0.5)]
    out, ratio = align_words(["Both", "solve"], heard, 0.0, 1.0)
    assert [(w.text, w.start, w.end) for w in out] == [("Both", 0.0, 0.2), ("solve", 0.2, 0.5)]
    assert ratio == 1.0

def test_split_word_spelling_fix():
    # whisper hears "httpt only" for script "HttpOnly"
    heard = [W("marked", 0.0, 0.3), W("httpt", 0.3, 0.5), W("only", 0.5, 0.8), W("so", 0.8, 0.9)]
    out, _ = align_words(["marked", "HttpOnly", "so"], heard, 0.0, 1.0)
    assert out[1].text == "HttpOnly" and out[1].start == 0.3 and out[1].end == 0.8

def test_missing_words_are_interpolated_and_monotonic():
    heard = [W("a", 0.0, 0.2), W("d", 0.8, 1.0)]
    out, ratio = align_words(["a", "b", "c", "d"], heard, 0.0, 1.0)
    starts = [w.start for w in out]
    assert starts == sorted(starts)
    assert 0.2 <= out[1].start < out[2].start < 0.8
    assert ratio == 0.5

def test_report_lines_flag_slides_under_90_and_summarise():
    lines = report_lines([("s01", 1.0, "Both solve it."), ("s02", 0.8, "JW packs it")])
    assert lines == [
        "s01 1.00  heard: Both solve it.",
        "s02 0.80 <90  heard: JW packs it",
        "min 0.800 median 0.900 under 90 %: 1 of 2",
    ]
    assert report_lines([]) == []

def test_nothing_heard_spreads_evenly():
    out, ratio = align_words(["x", "y"], [], 1.0, 2.0)
    assert out[0].start == 1.0 and out[1].end == 2.0 and ratio == 0.0

def test_trailing_unheard_words_get_nonzero_spans_up_to_the_real_duration():
    # Whisper heard only the first word; the other two are unheard and trail off the end of the
    # clip. t1 is the wav's actual duration (3.6 s), not the last heard word's end (0.3 s) — a
    # caller that passed the latter would collapse "y" and "z" to zero-duration spans at 0.3 s.
    heard = [W("x", 0.0, 0.3)]
    out, ratio = align_words(["x", "y", "z"], heard, 0.0, 3.6)
    assert out[0].text == "x" and out[0].end == 0.3
    assert out[1].start >= 0.3 and out[1].end > out[1].start
    assert out[2].start > out[1].start and out[2].end == 3.6
    assert out[2].end - out[2].start > 0
