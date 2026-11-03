"""Lists the interface texts that a language still lacks, for translators (a person or an AI tool).
   python tools/i18n_export.py [--max-words N] [--lang hi] [--tier core|short|all] > missing.json      (English text per key, sorted by screen)
   The translations come back as  src/cfg2_tr_<lang>.js  (see CONTRIBUTING.md). Machine translation must be read by a native speaker."""
import argparse, json, os, re, subprocess, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ap = argparse.ArgumentParser(); ap.add_argument("--lang", default="hi"); ap.add_argument("--max-words", type=int, default=999); ap.add_argument("--tier", default="all"); a = ap.parse_args()
d = json.loads(subprocess.run(["node", os.path.join(ROOT, "tools", "i18n_report.js"), "--json"], capture_output=True, text=True, check=True).stdout)
body = open(os.path.join(ROOT, "src", "body.html"), encoding="utf-8").read()
def sect(i): m = re.search(r'<section class="screen[^"]*" id="%s".*?</section>' % i, body, re.S); return m.group(0) if m else ""
core = set()
for sid in ("auth", "welcome", "lite", "setup", "game", "end", "home", "settings"): core |= set(re.findall(r'data-i18n="([A-Za-z0-9_]+)"', sect(sid)))
for f in ("app2.js", "app3.js", "app4.js", "app_home.js", "app_router.js", "app_settings.js"):
    core |= set(re.findall(r'\bT\("([A-Za-z][A-Za-z0-9_]*)"', open(os.path.join(ROOT, "src", f), encoding="utf-8").read()))
out = {}
for k in d["langs"][a.lang]["missing"]:
    t = d["en"][k]; n = len(t.split())
    if a.tier == "core" and k not in core: continue
    if a.tier == "short" and n > a.max_words and k not in core: continue
    if n > a.max_words and a.tier == "all": continue
    out[k] = t
json.dump(out, sys.stdout, ensure_ascii=False, indent=0)
sys.stderr.write("%d texts, %d words (core screens: %d of them)\n" % (len(out), sum(len(v.split()) for v in out.values()), len([k for k in out if k in core])))
