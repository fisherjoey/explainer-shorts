import shutil, subprocess
from pathlib import Path
import pytest
from explainer.engines import FakeEngine
from explainer.narrate import narrate, paragraphs

def test_paragraphs_drop_markdown_noise():
    text = "# Title\n\nFirst para\nstill first.\n\n- a list item\n\n```\ncode\n```\n\nLast."
    assert paragraphs(text) == ["Title", "First para still first.", "a list item", "Last."]

def test_paragraphs_keep_intraword_and_spaced_underscore_and_asterisk():
    assert paragraphs("Use snake_case here.") == ["Use snake_case here."]
    assert paragraphs("2*3=6 and 2 * 3") == ["2*3=6 and 2 * 3"]

def test_paragraphs_strip_emphasis_delimiters_and_inline_code():
    assert paragraphs("**bold** and _it_ and `code`") == ["bold and it and code"]

@pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="needs ffmpeg")
def test_narrate_writes_a_playable_mp3(tmp_path: Path):
    src = tmp_path / "t.md"
    src.write_text("One two three.\n\nFour five six.")
    out = tmp_path / "o.mp3"
    secs = narrate(src, out, FakeEngine())
    assert out.exists() and secs > 1.0
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "default=nw=1:nk=1", str(out)], capture_output=True, text=True, check=True)
    assert float(probe.stdout) > 1.0
