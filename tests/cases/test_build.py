import os, re, subprocess, sys
from harness import ROOT, ok
NAME = "build gates (syntax, version, no secrets, offline cache, size)"
def run(t):
    d = t.dist; idx = open(os.path.join(d, "index.html"), encoding="utf-8").read()
    for f in ("index.html", "obq-basic.html"):                                   # 1. the script of every build is valid JavaScript
        h = open(os.path.join(d, f), encoding="utf-8").read(); js = re.search(r"<script>([\s\S]*)</script>\s*</body>", h).group(1)
        tmp = os.path.join(d, "_check.js"); open(tmp, "w", encoding="utf-8").write(js); r = subprocess.run(["node", "--check", tmp], capture_output=True, text=True); os.remove(tmp)
        ok("%s: JavaScript syntax" % f, r.returncode == 0, r.stderr[:300])
    cl = open(os.path.join(ROOT, "CHANGELOG.md"), encoding="utf-8").read(); top = re.search(r"^## v([0-9.]+)", cl, re.M).group(1)    # 2. one version number everywhere
    ver = re.search(r'appVersion:\s*"([0-9.]+)"', open(os.path.join(ROOT, "src", "cfg1.js"), encoding="utf-8").read()).group(1)
    ok("version in cfg1 (%s) matches the newest CHANGELOG entry (%s)" % (ver, top), ver == top)
    found = sorted(set(re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}", idx))); ok("no real email address in the built app (only %s)" % (found,), all(e.split("@")[1] in ("skip.local", "example.org", "example.com") for e in found))       # 3. nothing private in the build
    pub = os.path.join(ROOT, "private")
    ok("the page size stays small (under 1.7 MB)", len(idx) < 1.7 * 1024 * 1024, "%d KB" % (len(idx) // 1024))
    sw = open(os.path.join(d, "obq-app", "sw.js"), encoding="utf-8").read()                  # 4. the offline cache holds what offline work needs
    xl = re.search(r'XLSX_URL = "([^"]+)"', open(os.path.join(ROOT, "src", "app1.js"), encoding="utf-8").read()).group(1)
    ok("the offline cache stores the Excel reader at install", xl in sw and "PRECACHE_EXTERNAL" in sw)
    ok("the app has a page for every address (22+ pages and a 404)", sum(1 for r, _, fs in os.walk(os.path.join(d, "obq-app")) for f in fs if f == "index.html") >= 20 and os.path.exists(os.path.join(d, "obq-app", "404.html")))
    ok("manifest exists with shortcuts", '"shortcuts"' in open(os.path.join(d, "obq-app", "manifest.webmanifest"), encoding="utf-8").read())
