import os
from harness import FIX, ok
NAME = "quiz, winners' photo, PDF reports, analytics"
def run(t):
    with t.site("local") as base, t.page(base, accept_downloads=True) as p:
        p.open(); p.signup("quiz@e.org"); p.run_lite_quiz("Sunday Rally")
        ok("the final page offers a photo (and Skip)", p.is_visible("#photoAdd") and p.is_visible("#photoSkip"))
        p.click("#photoAdd"); ok("three ways to add a photo", all(p.is_visible("#" + i) for i in ("phCam", "phFile")) )
        p.click("#phCam"); p.pg.wait_for_selector("#phLive:not([hidden])", timeout=8000); p.pg.wait_for_timeout(700); p.click("#phSnap"); p.pg.wait_for_selector("#phPreviewView:not([hidden])"); ok("the camera takes a photo and shows a preview", True)
        p.click("#phAgain"); import io
        from PIL import Image; Image.new("RGB", (900, 600), (40, 90, 140)).save(os.path.join(FIX, "_photo.jpg")); p.set_input_files("#phInput", os.path.join(FIX, "_photo.jpg")); p.pg.wait_for_selector("#phPreviewView:not([hidden])"); p.click("#phUse")
        ok("the photo is shown on the final page and the pop-up closed", p.is_visible("#photoImg") and not p.is_visible("#phModal"))
        with p.pg.expect_download() as d: p.click("#exportBtn")
        withp = os.path.getsize(d.value.path()); p.click("#photoRemove")
        with p.pg.expect_download() as d2: p.click("#exportBtn")
        ok("the PDF is bigger with the photo", withp > os.path.getsize(d2.value.path()) + 20000, "%d vs %d" % (withp, os.path.getsize(d2.value.path())))
        p.click("#photoSkip"); ok("Skip hides the photo box", not p.is_visible("#photoBox")); os.remove(os.path.join(FIX, "_photo.jpg"))
        p.click("#endHome") if p.is_visible("#endHome") else p.click("#again"); p.pg.wait_for_timeout(300)
        p.click("#goHome"); p.click("[data-card=analytics]"); p.pg.wait_for_timeout(400)
        tiles = p.evaluate("[...document.querySelectorAll('#analytics #stats .stat')].map(s=>s.textContent.replace(/\\s+/g,' ').trim())")
        ok("the dashboard shows the start date, quizzes set up and saved set-ups", any("Using OBQ since" in x for x in tiles) and any("Quizzes set up" in x for x in tiles) and any("Saved quiz set-ups" in x for x in tiles), str(tiles[:4]))
        with p.pg.expect_download() as d3: p.click("#anPdf")
        ok("the analytics report is a PDF", open(d3.value.path(), "rb").read(5) == b"%PDF-")
