import argparse, json, os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def default_ref() -> Path:
    """The voice reference clip: $EXPLAINER_REF if set, else voice/ref.wav in the repo.
    Its transcript sits next to it with a .txt suffix (voice/ref.txt)."""
    env = os.environ.get("EXPLAINER_REF")
    return Path(env) if env else ROOT / "voice" / "ref.wav"

def main(argv=None):
    ap = argparse.ArgumentParser(prog="explainer")
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("voice", help="script.json -> audio/voice.wav + timing.json")
    v.add_argument("video_dir", type=Path)
    v.add_argument("--engine", default=None)
    v.add_argument("--ref", type=Path, default=None,
                   help="reference clip (default: $EXPLAINER_REF or voice/ref.wav); transcript in <ref>.txt")
    v.add_argument("--seed", type=int, default=7)
    a = sub.add_parser("align", help="audio + script -> words.json")
    a.add_argument("video_dir", type=Path)
    a.add_argument("--model", default="small.en")
    a.add_argument("--report", action="store_true",
                   help="print every slide's match ratio and what Whisper heard, then min/median")
    n = sub.add_parser("narrate", help="markdown text -> mp3, read in the cloned voice")
    n.add_argument("src", type=Path)
    n.add_argument("--out", type=Path, required=True)
    n.add_argument("--engine", default=None)
    n.add_argument("--ref", type=Path, default=None,
                   help="reference clip (default: $EXPLAINER_REF or voice/ref.wav); transcript in <ref>.txt")
    n.add_argument("--seed", type=int, default=7)
    args = ap.parse_args(argv)
    if args.cmd in ("voice", "narrate"):
        ref = args.ref or default_ref()
        engine_name = args.engine
        if (engine_name or "f5-tts") != "fake" and not ref.exists():
            ap.error(f"no voice reference clip at {ref}; see 'Voice cloning' in README.md "
                     "(scripts/make_ref.sh cuts one from your own recording)")
    if args.cmd == "voice":
        from explainer.engines import get_engine, DEFAULT_ENGINE
        script = json.loads((args.video_dir / "script.json").read_text())
        engine = get_engine(args.engine or DEFAULT_ENGINE, ref)
        from explainer.voice import synthesize_script
        t = synthesize_script(script, engine, args.video_dir, seed=args.seed)
        print(f"voice: {len(t['slides'])} slides, {t['total']:.1f}s -> {args.video_dir/'audio/voice.wav'}")
    if args.cmd == "align":
        from explainer.align import align_script
        script = json.loads((args.video_dir / "script.json").read_text())
        timing = json.loads((args.video_dir / "timing.json").read_text())
        rows = align_script(script, timing, args.video_dir, args.model, report=args.report)
        print(f"align: {len(rows)} words -> {args.video_dir/'words.json'}")
    if args.cmd == "narrate":
        from explainer.engines import get_engine, DEFAULT_ENGINE
        from explainer.narrate import narrate
        secs = narrate(args.src, args.out, get_engine(args.engine or DEFAULT_ENGINE, ref), seed=args.seed)
        print(f"narrate: {secs/60:.1f} min -> {args.out}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
