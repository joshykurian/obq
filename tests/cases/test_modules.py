import json, os, subprocess
from harness import ROOT, ok
NAME = "code structure (modules declare what they use; the shared scope only shrinks)"
def run(t):
    r = subprocess.run(["node", os.path.join(ROOT, "tools", "check_modules.js")], capture_output=True, text=True); ok("every module uses only what it declares", r.returncode == 0, r.stdout[-600:])
    n = len([l for l in r.stdout.splitlines() if l.startswith("ok")]); ok("%d modules checked" % n, n >= 8)
    c = json.loads(subprocess.run(["node", os.path.join(ROOT, "tools", "legacy_count.js")], capture_output=True, text=True).stdout); base = json.load(open(os.path.join(ROOT, "tests", "legacy_baseline.json")))
    ok("names in the shared scope: %d (baseline %d): new code belongs in src/modules/" % (c["names"], base["names"]), c["names"] <= base["names"])
    ok("lines in the shared scope: %d (baseline %d)" % (c["lines"], base["lines"]), c["lines"] <= base["lines"] + 20)
    if os.environ.get("OBQ_UPDATE_BASELINE") == "1": json.dump({"names": c["names"], "lines": c["lines"]}, open(os.path.join(ROOT, "tests", "legacy_baseline.json"), "w")); print("   legacy baseline updated")
