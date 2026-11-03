from harness import ok
NAME = "basic edition (name, quick quiz, results; no login)"
def run(t):
    with t.site("local") as base, t.page(base.replace("/obq/", "/basic/")) as p:
        p.pg.goto(p.base); p.pg.wait_for_function("document.body.dataset.screen==='welcome'", timeout=15000); ok("it opens on the name page", True)
        p.click("#wGo"); ok("an empty name is refused", "type your name" in p.inner_text("#wErr").lower())
        p.fill("#wName", "Jos"); p.click("#wGo"); p.pg.wait_for_function("document.body.dataset.screen==='lite'"); ok("then the quick quiz page", True)
        ok("no language, voice or Home controls", not p.is_visible("#lLang") and not p.is_visible("#lVoice") and not p.is_visible("#tbRight"))
        n = p.run_lite_quiz("Basic"); ok("the quiz runs to the final page (%d questions)" % n, p.screen() == "end")
        ok("only the PDF is offered (no CSV, redo, cloud)", p.is_visible("#exportBtn") and not p.is_visible("#csvBtn") and not p.is_visible("#saveRedo"))
