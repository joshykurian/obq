import os, subprocess
from harness import ROOT, ok
NAME = "server functions (contact code and limits, no internet needed)"
def run(t):
    r = subprocess.run(["node", "--test", "test/lib.test.js"], cwd=os.path.join(ROOT, "functions"), capture_output=True, text=True)
    ok("all function tests pass", r.returncode == 0 and "# fail 0" in r.stdout, r.stdout[-500:])
    import re
    ok("no secret or email address in the function code", not any(re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}|smtp_pass=|password:", open(os.path.join(ROOT, "functions", f), encoding="utf-8").read(), re.I) for f in ("index.js", "lib.js")))
