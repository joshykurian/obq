"""Converts a question bank workbook into the built-in bank file.
   Run:  python3 tools/import_bank.py [path-to-xlsx] [--out path]
   Default: data/sample-question-bank.xlsx  ->  src/cfg3_bank.js (the small plain-text sample bank that ships with the repository).
   Full bank, ENCRYPTED:  python3 tools/import_bank.py private/YOUR-BANK.xlsx --encrypt --key-file private/bank.key
        -> src/cfg3_bank.enc.json (safe to publish: it cannot be read without the key; the build needs the key, see README)
   Another bank for local tests only:  python3 tools/import_bank.py YOUR-BANK.xlsx --out private/cfg3_bank.js   (the build prefers private/cfg3_bank.js)
   A plain JSON bank file (the same format the app uses for its question banks), for your own use or to upload in the app:
        python3 tools/import_bank.py private/YOUR-BANK.xlsx --json-out private/obq-core.json   (keep it private: the published bank is encrypted)
   Same rules as the in-app Excel import; rows with a problem are skipped and listed."""
import collections, json, os, re, sys
from openpyxl import load_workbook

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
args = [a for a in sys.argv[1:] if not a.startswith("--")]
SRC = args[0] if args else os.path.join(ROOT, "data", "sample-question-bank.xlsx")
OUT = os.path.join(ROOT, "src", "cfg3_bank.js")
if "--out" in sys.argv: OUT = sys.argv[sys.argv.index("--out") + 1]
OT = "Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi".split("|")
NT = "Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation".split("|")
BOOKS = OT + NT

def n(v): return re.sub(r"\s+", " ", str(v if v is not None else "")).strip()
def cat_from(v):
    v = n(v).lower()
    if not v: return None
    if re.search(r"part", v): return "P"
    if re.search(r"video", v): return "video"
    if re.search(r"one\s*word|short|hint", v): return "W"
    if re.search(r"multi|mcq|option|choice", v): return "M"
    if re.search(r"clue|who", v): return "C"
    if re.search(r"one|single|answer|quick|regular", v): return "O"
    return None

wb = load_workbook(SRC, read_only=True, data_only=True)
ws = wb["Questions"] if "Questions" in wb.sheetnames else wb[wb.sheetnames[0]]
rows = list(ws.iter_rows(values_only=True))
head = [n(h).lower() for h in rows[0]]
col = {h: i for i, h in enumerate(head)}
def g(r, h):
    i = col.get(h);  return n(r[i]) if i is not None and i < len(r) else ""

out, problems, seen = [], [], {}
for ri, r in enumerate(rows[1:], start=2):
    if all(n(c) == "" for c in r): continue
    why = None
    cat = cat_from(g(r, "category"))
    lang = g(r, "language").lower()
    book = g(r, "book")
    if not cat: why = "unknown category"
    elif cat == "video": why = "video questions are not supported"
    elif lang not in ("", "english", "en"): why = "language is not English: " + lang
    if not why and book and book not in BOOKS and book.lower() != "general": why = "unknown book: " + book
    if book.lower() == "general": book = ""
    q, a, ref, info = g(r, "question"), g(r, "correct answer"), g(r, "reference"), g(r, "more to know")
    lvl = g(r, "level").lower(); level = "T" if "trivia" in lvl else ("D" if re.search(r"diff|hard", lvl) else "")
    opts, clues, parts = None, None, None
    pts, secs = g(r, "points"), g(r, "seconds")
    if not why:
        if cat in ("O", "W"):
            if not q or not a: why = "question and answer needed"
            if cat == "W": clues = [g(r, "clue %d" % i) for i in range(1, 6) if g(r, "clue %d" % i)] or None
        elif cat == "M":
            letters = [g(r, "option " + c) for c in "abcd"]
            opts = [o for o in letters if o]
            if not q: why = "question missing"
            elif len(opts) < 2: why = "fewer than 2 options"
            else:
                idx = -1
                if re.fullmatch(r"[A-Da-d]", a):
                    k = 0
                    for i, o in enumerate(letters):
                        if o:
                            if i == ord(a.upper()) - 65: idx = k
                            k += 1
                if idx < 0:
                    for i, o in enumerate(opts):
                        if o.lower() == a.lower(): idx = i; break
                if idx < 0: why = "answer not among the options"
                else: a = opts[idx]
                if not why and len(opts) != 4: why = "not 4 options (%d)" % len(opts)
                if not why and len(set(o.lower() for o in opts)) != len(opts): why = "duplicate options"
        elif cat == "C":
            if not a: why = "answer missing"
            clues = [g(r, "clue %d" % i) for i in range(1, 6) if g(r, "clue %d" % i)] or None
            if clues and len(clues) != 5: why = "who am I needs 5 clues (has %d)" % len(clues)
        elif cat == "P":
            qs = [x.strip() for x in q.split("|") if x.strip()]; ans = [x.strip() for x in a.split("|") if x.strip()]
            if len(qs) < 2 or len(qs) > 4 or len(qs) != len(ans): why = "multi-part parts/answers mismatch (%d vs %d)" % (len(qs), len(ans))
            else: parts = [{"q": x, "a": y} for x, y in zip(qs, ans)]
    if not why and not ref: why = "no reference"
    key = (("who:%s:%s" % (book, a)) if cat == "C" else (q or "|".join(p["q"] for p in (parts or [])))).lower()
    if not why and key in seen: why = "duplicate of row %d" % seen[key]
    if why: problems.append((ri, why, q[:60] or a[:40])); continue
    seen[key] = ri
    intro = g(r, "intro")
    row = [book, cat, intro if cat == "P" else q, a if cat != "P" else "", ref, opts, clues, info, level, parts]
    if pts: row.append(int(float(pts)))
    if secs: row.append(int(float(secs)))
    while len(row) > 3 and row[-1] in (None, "", []): row.pop()
    # pad Pts/Secs positions when only Secs is present
    out.append(row)

if "--json-out" in sys.argv:
    def to_q(r):
        r = list(r) + [None] * (12 - len(r)); cat = {"M": "mc", "C": "clue", "P": "multi", "W": "oneword"}.get(r[1], "one")
        q = {"lang": "en", "book": r[0], "cat": cat, "level": {"T": "trivia", "D": "difficult"}.get(r[8] or "", ""), "q": r[2], "a": r[3], "ref": r[4] or "", "opts": r[5] or None, "clues": r[6] or [], "info": r[7] or "",
             "intro": "", "parts": r[9] or None, "pts": r[10] or 0, "secs": r[11] or 0}
        if cat == "multi": q["intro"] = r[2]; q["q"] = ""
        if cat == "mc": q["correct"] = q["opts"].index(q["a"])
        return q
    import datetime
    jp = sys.argv[sys.argv.index("--json-out") + 1]; now = datetime.datetime.utcnow().isoformat() + "Z"
    doc = {"format": "obq-bank", "version": 1, "bid": "core", "name": "OBQ questions (English)", "lang": "en", "created": now, "updated": now, "source": {"type": "excel", "file": os.path.basename(SRC)}, "count": len(out), "questions": [to_q(r) for r in out]}
    json.dump(doc, open(jp, "w", encoding="utf-8"), ensure_ascii=False, indent=1); print("JSON bank written: %s (%d questions)" % (jp, len(out)))
if "--encrypt" in sys.argv:
    import base64, hashlib, zlib
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    key = os.environ.get("OBQ_BANK_KEY", "")
    if "--key-file" in sys.argv: key = open(sys.argv[sys.argv.index("--key-file") + 1], encoding="utf-8").read().strip()
    if not key: sys.exit("No key: use --key-file private/bank.key or set OBQ_BANK_KEY")
    comp = zlib.compressobj(9, zlib.DEFLATED, -15); raw = json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    data = comp.compress(raw) + comp.flush(); iv = os.urandom(12)
    ct = AESGCM(hashlib.sha256(key.encode("utf-8")).digest()).encrypt(iv, data, None)
    target = OUT if "--out" in sys.argv else os.path.join(ROOT, "src", "cfg3_bank.enc.json")
    open(target, "w", encoding="utf-8").write(json.dumps({"v": 1, "rows": len(out), "iv": base64.b64encode(iv).decode(), "ct": base64.b64encode(ct).decode()}))
    print("encrypted", len(out), "questions ->", target, "(%d KB)" % (os.path.getsize(target) // 1024)); sys.exit(0)

def fix(row):
    # make positions stable: 0 book,1 cat,2 q,3 a,4 ref,5 opts,6 clues,7 info,8 level,9 parts,10 pts,11 secs
    return row + [None] * (5 - len(row)) if len(row) < 5 else row
js = ["/* =====================================================================",
      "   3b. STARTER_BANK - the built-in English question bank (generated from data/%s by tools/import_bank.py;" % os.path.basename(SRC),
      "   to change it, edit the workbook and run the script again).",
      "   Row: [Book, Category, Question, Correct answer, Reference, Options, Clues, More to know, Level, Parts, Points, Seconds]",
      "   Category: O one answer | M multiple choice | W short answer with hints | C who am I | P multi-part (Question = intro, Parts = [{q, a}])",
      "   Level: T trivia | D difficult | (blank) regular.  Trailing empty fields are left out.",
      "   ===================================================================== */",
      "/* rows: %d */" % len(out), "var STARTER_BANK = ["]
js += ["  " + json.dumps(r, ensure_ascii=False, separators=(",", ":")) + ("," if i < len(out) - 1 else "") for i, r in enumerate(out)]
js.append("];")
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
open(OUT, "w", encoding="utf-8").write("\n".join(js) + "\n")

print("converted", len(out), "of", len(rows) - 1, "rows;", len(problems), "skipped")
cats = collections.Counter(r[1] + (r[8] if len(r) > 8 else "") for r in out); print("by kind:", dict(cats))
per = collections.Counter(r[0] or "(general)" for r in out)
print("books with questions:", len([b for b in BOOKS if per.get(b)]), "of 66 | fewest:", sorted(((per.get(b, 0), b) for b in BOOKS))[:6])
for p in problems[:40]: print("  skipped row", p)
