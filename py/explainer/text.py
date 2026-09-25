import re

_ABBREV = {"e.g.", "i.e.", "etc.", "vs.", "mr.", "dr.", "approx."}
_END = re.compile(r"(?<=[.!?])\s+")

def split_sentences(text: str, max_chars: int = 220) -> list[str]:
    raw = [p.strip() for p in _END.split(text.strip()) if p.strip()]
    merged: list[str] = []
    for part in raw:
        if merged and merged[-1].split()[-1].lower() in _ABBREV:
            merged[-1] = f"{merged[-1]} {part}"
        else:
            merged.append(part)
    out: list[str] = []
    for sent in merged:
        out.extend(_wrap(sent, max_chars))
    return out

def _wrap(sent: str, max_chars: int) -> list[str]:
    if len(sent) <= max_chars:
        return [sent]
    pieces, cur = [], ""
    for chunk in re.split(r"(?<=,)\s+", sent):
        if cur and len(cur) + 1 + len(chunk) > max_chars:
            pieces.append(cur)
            cur = chunk
        else:
            cur = f"{cur} {chunk}".strip()
    if cur:
        pieces.append(cur)
    return pieces

def tokens(text: str) -> list[str]:
    return text.split()

def norm(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())
