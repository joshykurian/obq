"""Fetches the texts of the Verse of the Day from Bible Brain (https://biblebrain.com/), with YOUR API key and the Bibles YOU may use, and writes private/verses.json.
   The build (tools/assemble.py) puts them into the app. Nothing is typed into the source code and the file is never committed (private/ is not in the repository).

   One Bible per interface language, for example English ESV and Hindi:
     python tools/fetch_verses.py --key YOURKEY --bible "en=ENGESV|ESV|Scripture quotations are from the ESV Bible ... (the notice the publisher asks for)" --bible "hi=HINIRV|Hindi IRV|(its copyright line)"
   or, for the GitHub Action: the secrets BIBLE_BRAIN_KEY and VERSE_BIBLES_JSON (see README):
     VERSE_BIBLES_JSON = {"en": {"fileset": "ENGESV", "name": "ESV", "copyright": "..."}, "hi": {"fileset": "HINIRV", "name": "Hindi IRV", "copyright": "..."}}
   Check the licence of every Bible before you use it (for example the ESV allows up to 500 verses with its copyright notice, and may not be translated into another language).
   Languages you leave out keep showing the English verse with a note. Re-run it any time: verses already fetched are kept."""
import argparse, json, os, re, sys, time, urllib.parse, urllib.request
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
def rd(p): return open(os.path.join(ROOT, p), encoding="utf-8").read()
def verse_list():                                                                  # [(book, chapter, first, last)] from src/cfg4_verses.js
    return [(m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4))) for m in re.finditer(r'\["([^"]+)",\s*(\d+),\s*(\d+),\s*(\d+),', rd("src/cfg4_verses.js"))]
def book_codes():                                                                  # English name -> USFM code (the same lists as the app)
    cfg = rd("src/cfg1.js"); names = re.search(r'var QUIZ_BOOKS_OT = "([^"]+)"', cfg).group(1).split("|") + re.search(r'var QUIZ_BOOKS_NT = "([^"]+)"', cfg).group(1).split("|")
    codes = re.search(r'var CODES = "([^"]+)"', rd("src/modules/kb.js")).group(1).split("|"); assert len(names) == len(codes) == 66
    return dict(zip(names, codes))
def ref_of(b, ch, v1, v2): return "%s %d:%d%s" % (b, ch, v1, "-%d" % v2 if v2 > v1 else "")
def get_json(url, tries=3):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "obq-fetch-verses"}), timeout=30) as r: return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            if k == tries - 1: raise
            time.sleep(1.5 * (k + 1))
def fetch_one(api, key, fileset, code, ch, v1, v2):
    q = urllib.parse.urlencode({"key": key, "v": "4", "verse_start": v1, "verse_end": v2})
    d = get_json("%s/bibles/filesets/%s/%s/%d?%s" % (api.rstrip("/"), urllib.parse.quote(fileset), code, ch, q)); rows = d.get("data") or []
    texts = [str(r.get("verse_text") or "").strip() for r in rows if v1 <= int(r.get("verse_start") or v1) <= v2]
    name = (rows[0].get("book_name") if rows else "") or ""
    return " ".join(t for t in texts if t).strip(), name.strip()
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--key", default=os.environ.get("BIBLE_BRAIN_KEY", "")); ap.add_argument("--api", default="https://4.dbt.io/api"); ap.add_argument("--bible", action="append", default=[], help='lang=FILESET|Name|Copyright line')
    ap.add_argument("--out", default=os.path.join(ROOT, "private", "verses.json")); ap.add_argument("--delay", type=float, default=0.15); a = ap.parse_args()
    conf = {}
    if os.environ.get("VERSE_BIBLES_JSON"): conf.update(json.loads(os.environ["VERSE_BIBLES_JSON"]))
    for b in a.bible:
        lang, rest = b.split("=", 1); p = rest.split("|"); conf[lang.strip()] = {"fileset": p[0].strip(), "name": (p[1] if len(p) > 1 else p[0]).strip(), "copyright": (p[2] if len(p) > 2 else "").strip()}
    if not a.key or not conf: sys.exit("Give --key (or BIBLE_BRAIN_KEY) and at least one --bible lang=FILESET|Name|Copyright (or VERSE_BIBLES_JSON). See the top of this file.")
    out = json.load(open(a.out, encoding="utf-8")) if os.path.exists(a.out) else {}; verses, codes = verse_list(), book_codes(); bad = 0
    for lang, c in conf.items():
        pack = out.setdefault(lang, {}); pack.update({"name": c.get("name") or c["fileset"], "copyright": c.get("copyright", "")}); pack.setdefault("v", {}); pack.setdefault("b", {})
        for (b, ch, v1, v2) in verses:
            ref = ref_of(b, ch, v1, v2)
            if pack["v"].get(ref): continue
            try:
                text, bname = fetch_one(a.api, a.key, c["fileset"], codes[b], ch, v1, v2)
                if text: pack["v"][ref] = text; (pack["b"].__setitem__(codes[b], bname) if bname else None)
                else: bad += 1; print("  no text: %s %s" % (lang, ref))
            except Exception as e:
                bad += 1; print("  failed: %s %s (%s)" % (lang, ref, str(e)[:80]))
            time.sleep(a.delay)
        print("%s: %d of %d verses (%s)" % (lang, len(pack["v"]), len(verses), pack["name"]))
    os.makedirs(os.path.dirname(a.out), exist_ok=True); json.dump(out, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("written %s%s" % (a.out, ("; %d verses could not be fetched (they show in English)" % bad) if bad else ""))
if __name__ == "__main__": main()
