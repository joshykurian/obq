"""Runs every check in tests/cases and prints a summary.   python tests/run_all.py [name-part ...]   (exit code 1 when a check fails)"""
import glob, importlib.util, os, sys, time, traceback
os.environ.setdefault("PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS", "1")        # lets the checks answer for the service worker too
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import harness
from playwright.sync_api import sync_playwright
def main():
    only = [a.lower() for a in sys.argv[1:]]; files = sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), "cases", "test_*.py")))
    dist = harness.build(force=os.environ.get("OBQ_REBUILD") == "1"); results = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"])
        for f in files:
            mod = os.path.basename(f)[5:-3]
            if only and not any(o in mod.lower() for o in only): continue
            spec = importlib.util.spec_from_file_location(mod, f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); t = harness.T(b, dist); t0 = time.time()
            print("\n== %s" % getattr(m, "NAME", mod))
            try: m.run(t); t.check_no_errors(); results.append((getattr(m, "NAME", mod), True, time.time() - t0, ""))
            except Exception as e: traceback.print_exc(limit=3); results.append((getattr(m, "NAME", mod), False, time.time() - t0, str(e)[:200]))
        b.close()
    print("\n" + "=" * 60)
    for n, okk, dt, msg in results: print("%s  %-44s %5.1fs %s" % ("PASS" if okk else "FAIL", n, dt, msg))
    bad = [r for r in results if not r[1]]; print("\n%d of %d checks passed" % (len(results) - len(bad), len(results))); sys.exit(1 if bad else 0)
main()
