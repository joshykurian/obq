import json, os, re, subprocess
from harness import ROOT, ok
NAME = "interface translations (placeholders, keys, coverage can only go up)"
def run(t):
    r = subprocess.run(["node", os.path.join(ROOT, "tools", "i18n_report.js"), "--json"], capture_output=True, text=True); assert r.returncode == 0, r.stderr[:300]
    data = json.loads(r.stdout); en = data["en"]; tr = data["tr"]
    ph = lambda s: sorted(re.findall(r"\{[A-Za-z0-9_]+\}", s))
    for lang in data["langs"]:                                               # 1. a translation keeps the {placeholders} of the English text
        bad = [k for k, v in tr[lang].items() if k in en and ph(v) != ph(en[k])]
        ok("%s: placeholders unchanged" % lang, not bad, str(bad[:5]))
        extra = [k for k in tr[lang] if k not in en]
        ok("%s: no text for a key that does not exist" % lang, not extra, str(extra[:5]))
    body = open(os.path.join(ROOT, "src", "body.html"), encoding="utf-8").read(); used = set(re.findall(r'data-i18n="([A-Za-z0-9_]+)"', body))   # 2. every key the page uses exists in English
    for f in os.listdir(os.path.join(ROOT, "src")):
        if f.endswith(".js") and not f.startswith("cfg"): used |= set(re.findall(r'\bTQ?\("([A-Za-z][A-Za-z0-9_]*)"', open(os.path.join(ROOT, "src", f), encoding="utf-8").read()))
    dyn = {k for k in used if k.endswith("_")}
    missing = sorted(k for k in used if k not in en and k not in dyn and not re.match(r"^(ct[T]_|trNote_)", k))
    ok("every text key used by the page and the code exists in English", not missing, str(missing[:8]))
    base_path = os.path.join(ROOT, "tests", "i18n_baseline.json"); base = json.load(open(base_path)) if os.path.exists(base_path) else {}    # 3. the number of translated strings may not fall (raise it by translating)
    now = {l: v["have"] for l, v in data["langs"].items()}
    for l, n in now.items(): ok("%s: %d of %d strings translated (%.0f%%; baseline %d)" % (l, n, data["total"], 100.0 * n / data["total"], base.get(l, 0)), n >= base.get(l, 0))
    if os.environ.get("OBQ_UPDATE_BASELINE") == "1": json.dump(now, open(base_path, "w"), indent=1); print("   baseline updated")

    with t.site("local") as base, t.page(base) as p:                                                       # 4. the screens really show the translations (and Urdu turns right to left)
        p.open(); p.signup("i18n@e.org")
        for code, word, rtl in (("hi", "सेटिंग्स", False), ("ml", "ക്രമീകരണങ്ങൾ", False), ("ta", "அமைப்புகள்", False), ("ur", "ترتیبات", True)):
            p.pg.select_option("#tbLang", code); p.click("#goSettings"); p.pg.wait_for_timeout(300)
            ok("%s: the Settings page shows the translation" % code, word in p.inner_text("#settings"), p.inner_text("#settings")[:60])
            ok("%s: page direction is %s" % (code, "right to left" if rtl else "left to right"), p.evaluate("document.documentElement.dir") == ("rtl" if rtl else "ltr"))
            p.click("#goHome"); p.pg.wait_for_timeout(200)
