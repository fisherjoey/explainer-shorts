from explainer.text import split_sentences, tokens, norm

def test_split_sentences_basic():
    s = "Session auth is stateful. The server keeps a record! Why? Because."
    assert split_sentences(s) == ["Session auth is stateful.", "The server keeps a record!", "Why?", "Because."]

def test_split_keeps_abbreviations_and_decimals():
    s = "Use e.g. Redis at 99.9 percent uptime. Done."
    assert split_sentences(s) == ["Use e.g. Redis at 99.9 percent uptime.", "Done."]

def test_split_long_sentence_at_commas():
    s = ("a" * 100 + ", ") * 3 + "end."
    parts = split_sentences(s, max_chars=220)
    assert all(len(p) <= 220 for p in parts)
    assert " ".join(parts).replace("  ", " ") .startswith("a" * 100)

def test_tokens_keep_punctuation_attached():
    assert tokens("Both solve the same problem, keeping users in.") == ["Both", "solve", "the", "same", "problem,", "keeping", "users", "in."]

def test_norm():
    assert norm("HttpOnly,") == "httponly"
    assert norm("JWT's") == "jwts"
    assert norm("—") == ""
