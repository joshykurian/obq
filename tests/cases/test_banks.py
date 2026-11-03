import json, os
from openpyxl import load_workbook
from harness import ROOT, FIX, ok
NAME = "question banks as JSON (Excel to JSON, library, offline message)"
def sample_rows():
    ws = load_workbook(os.path.join(ROOT, "data", "sample-question-bank.xlsx"), read_only=True, data_only=True)["Questions"]
    return [[("" if c is None else str(c)) for c in r] for r in ws.iter_rows(values_only=True)]
def run(t):
    rows = sample_rows(); n = len(rows) - 1
    with t.site("local") as base, t.page(base, accept_downloads=True) as p:
        p.open(); p.signup("banks@e.org"); p.click("[data-card=bank]"); p.pg.wait_for_timeout(400)
        ok("the library starts with the built-in banks (read only)", p.evaluate("[...document.querySelectorAll('#libTable tr[data-bank]')].map(r=>r.dataset.bank)")[:1] in (["core"], ["starter"], ["sample"]))
        p.pg.evaluate("delete window.XLSX"); p.set_input_files("#fileIn", os.path.join(ROOT, "templates", "question-bank-template.xlsx")); p.pg.wait_for_timeout(1200)
        ok("without the Excel reader and without internet the message says what to do", "Connect to the internet once" in p.inner_text("#upMsg"), p.inner_text("#upMsg")[:100])
        p.stub_excel(rows); p.set_input_files("#fileIn", os.path.join(ROOT, "data", "sample-question-bank.xlsx")); p.pg.wait_for_timeout(1500)
        ok("an Excel file becomes a JSON bank with every question", ("Saved as the JSON question bank" in p.inner_text("#upMsg")) and (str(n) in p.inner_text("#upMsg")), p.inner_text("#upMsg")[:100])
        n0 = p.evaluate("document.querySelectorAll('#libTable tr[data-bank]').length")
        with p.pg.expect_download() as d: p.click('#libTable tr:has-text("sample-question-bank") button:has-text("JSON")')
        doc = json.load(open(d.value.path(), encoding="utf-8")); ok("the JSON file has the bank format", doc["format"] == "obq-bank" and doc["version"] == 1 and len(doc["questions"]) == n and doc["lang"] == "en")
        json.dump(doc, open(os.path.join(FIX, "_dl.json"), "w", encoding="utf-8")); p.set_input_files("#fileIn", os.path.join(FIX, "_dl.json")); p.pg.wait_for_timeout(800)
        ok("a JSON bank can be uploaded again (it gets its own name)", p.evaluate("document.querySelectorAll('#libTable tr[data-bank]').length") == n0 + 1); os.remove(os.path.join(FIX, "_dl.json"))
        json.dump({"hello": 1}, open(os.path.join(FIX, "_bad.json"), "w")); p.set_input_files("#fileIn", os.path.join(FIX, "_bad.json")); p.pg.wait_for_timeout(400); ok("a wrong JSON file gets a clear message", "could not be read" in p.inner_text("#upMsg")); os.remove(os.path.join(FIX, "_bad.json"))
        bid = p.evaluate("document.querySelectorAll('#libTable tr[data-bank]')[2].dataset.bank")
        p.click('#libTable tr[data-bank="%s"] button:has-text("Rename")' % bid); p.fill("#libTable input", "Youth set"); p.keyboard.press("Enter"); p.pg.wait_for_timeout(400); ok("a bank can be renamed", "Youth set" in p.inner_text("#libTable"))
        p.pg.reload(); p.pg.wait_for_function("document.body.dataset.screen", timeout=10000); p.pg.wait_for_timeout(800); p.click("#sbNav [data-sb=bank]"); p.pg.wait_for_timeout(500)
        ok("the banks are still there after a reload", "Youth set" in p.inner_text("#libTable"))
        p.click('#libTable tr:has-text("Youth set") button:has-text("Delete")'); p.click('#libTable tr:has-text("Youth set") button.danger'); p.pg.wait_for_timeout(500); ok("deleting needs two clicks and works", "Youth set" not in p.inner_text("#libTable"))
