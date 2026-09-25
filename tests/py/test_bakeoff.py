import pytest
from explainer.bakeoff import int_words, wer, wer_words

def test_numbers_and_abbreviations_are_formatting_not_errors():
    assert wer("twelve versus eleven", "12 vs 11") == 0.0
    assert wer("Compare deadlock versus race condition.", "Compare Deadlock vs. Race condition.") == 0.0

def test_real_substitution_still_counts():
    assert wer("one update silently overwrote the other", "one update silently overrode the other") == pytest.approx(1 / 6)

def test_symbols_decimals_ordinals_thousands():
    assert wer("fifty percent and three point five", "50% & 3.5") == 0.0
    assert wer("the second request", "the 2nd request") == 0.0
    assert wer("one thousand two hundred users", "1,200 users") == 0.0

def test_hyphens_case_and_punctuation():
    assert wer("Twenty-one real-time requests.", "21 real time requests") == 0.0

def test_missing_words_count():
    assert wer("a b", "") == 1.0

def test_int_words():
    assert int_words(0) == "zero"
    assert int_words(40) == "forty"
    assert int_words(115) == "one hundred fifteen"
    assert int_words(2_000_007) == "two million seven"

def test_wer_words_strips_punctuation():
    assert wer_words("It's the user's ID, right?") == ["its", "the", "users", "id", "right"]
