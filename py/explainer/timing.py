def build_timing(ids: list[str], durations: list[float], gap: float = 0.25,
                 lead_in: float = 0.1, tail: float = 0.6, fps: int = 30, gaps: list[float] | None = None) -> dict:
    assert len(ids) == len(durations) and ids

    # Validate gaps parameter if provided
    if gaps is not None and len(gaps) != len(ids) - 1:
        raise ValueError(f"gaps must have {len(ids) - 1} entries (one per inter-slide pause), got {len(gaps)}")

    slides, t = [], lead_in
    for i, (sid, d) in enumerate(zip(ids, durations)):
        start = t
        if i < len(ids) - 1:
            # Use per-slide gap if provided, otherwise use default gap
            pause = gaps[i] if gaps is not None else gap
            t = start + d + pause
        else:
            # Last slide uses tail instead of gap
            t = start + d + tail
        slides.append({"id": sid, "start": round(start, 3), "end": round(t, 3)})
    return {"fps": fps, "total": round(t, 3), "slides": slides}
