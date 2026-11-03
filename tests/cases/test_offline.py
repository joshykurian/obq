import json, os, re
from harness import FIX, ok
NAME = "offline (installed app: Excel reader saved, pages open, upload works)"
ROWS = [["Language", "Book", "Category", "Level", "Question", "Option A", "Option B", "Option C", "Option D", "Clue 1", "Clue 2", "Clue 3", "Clue 4", "Clue 5", "Correct answer", "Reference", "More to know", "Points", "Seconds", "Intro"],
        ["English", "Genesis", "One answer", "Regular", "Who built the ark?", "", "", "", "", "", "", "", "", "", "Noah", "Genesis 6:14", "God told him to.", "", "", ""]]
def run(t):
    xl_stub = open(os.path.join(FIX, "xlsx_stub.js"), encoding="utf-8").read()
    def cdn(route): route.fulfill(status=200, content_type="application/javascript", headers={"access-control-allow-origin": "*"}, body=xl_stub)
    with t.site("local") as base, t.page(base, extra_routes=[(re.compile(r"https://cdnjs\.cloudflare\.com/.*"), cdn)]) as p:
        p.open(); p.pg.wait_for_function("navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(r=>!!r.active)", timeout=20000); p.pg.wait_for_timeout(2500)
        p.pg.reload(); p.pg.wait_for_timeout(1500)
        XL = re.search(r'XLSX_URL = "([^"]+)"', open(os.path.join(os.path.dirname(__file__), "..", "..", "src", "app1.js"), encoding="utf-8").read()).group(1)
        ok("the Excel reader was saved when the app was installed", p.evaluate("(u)=>caches.keys().then(ks=>Promise.all(ks.map(k=>caches.open(k).then(c=>c.match(u))))).then(a=>a.some(Boolean))", XL))
        p.signup("offline@e.org"); p.click("#goSettings"); p.pg.wait_for_timeout(500)
        ok("Settings says Excel works offline", "work offline" in p.inner_text("#setOfflineExcel"), p.inner_text("#setOfflineExcel"))
        p.pg.context.set_offline(True)                                                                   # the internet goes away
        p.click("#goHome"); p.click("[data-card=bank]"); p.pg.wait_for_timeout(500)
        p.pg.evaluate("window.__ROWS=%s" % json.dumps(ROWS)); p.set_input_files("#fileIn", os.path.join(FIX, "base5.json").replace("base5.json", "base5.json"))      # (any file: the reader answers with the rows)
        p.pg.evaluate("1"); p.pg.wait_for_timeout(300)
        p.pg.evaluate("delete window.XLSX")                                                              # the reader must come from the saved copy, not from memory
        p.pg.set_input_files("#fileIn", os.path.join(FIX, "..", "..", "templates", "question-bank-template.xlsx")); p.pg.wait_for_timeout(1500)
        msg = p.inner_text("#upMsg")
        ok("an Excel file can be uploaded while offline", "Saved as the JSON question bank" in msg, msg[:120])
        for path in ("instructions", "builder/questionbank", "settings"):
            p.pg.goto(p.base + path); p.pg.wait_for_function("document.body.dataset.screen", timeout=10000); ok("offline: /%s opens" % path, True)
