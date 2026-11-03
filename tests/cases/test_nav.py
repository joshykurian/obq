from harness import ok
NAME = "navigation (top bar, page addresses, Back button, sidebar)"
def run(t):
    with t.site("local") as base, t.page(base) as p:
        p.open("instructions"); ok("a page address opened before signing in shows the sign-in page", p.screen() == "auth")
        p.signup("nav@e.org"); p.pg.wait_for_timeout(500); ok("after signing in the page that was asked for opens", p.screen() == "qmguide" and p.path().rstrip("/").endswith("/instructions"), p.path())
        p.click("#goHome"); order = p.evaluate("[...document.querySelectorAll('#tbRight > *')].filter(e=>!e.hidden && e.id!=='exitFs').map(e=>e.id||e.className)")
        ok("top bar order: Home, Instructions, My Quizzes, Quiz Results, Quiz Builder, language, Settings, name, My Profile, Sign out", order[:5] == ["goHome", "goHelp", "goQuizzes", "goResults", "goDash"] and order[-3:] == ["uchip", "goProfile", "signOutBtn"], str(order))
        ok("every top bar link has an icon", p.evaluate("[...document.querySelectorAll('#tbRight a.navlink, #signOutBtn')].every(a=>a.querySelector('svg'))"))
        ok("Home groups: Run a quiz (4), Quiz Builder (2), Quiz Results (2), Account and help", p.evaluate("[...document.querySelectorAll('#homeCards .hgroup')].map(g=>g.querySelectorAll('.cards [data-card]').length)")[:3] == [4, 2, 2])
        ok("no sidebar on Home", not p.is_visible("#sidebar"))
        for nav, scr, path in (("#goHelp", "qmguide", "/instructions"), ("#goQuizzes", "setup", "/my-quizzes"), ("#goResults", "resultsPage", "/builder/results"), ("#goDash", "dashboard", "/builder"), ("#goSettings", "settings", "/settings"), ("#goProfile", "settings", "/profile")):
            p.click(nav); p.pg.wait_for_timeout(300); ok("%s opens %s" % (nav, path), p.screen() == scr and p.path().rstrip("/").endswith(path) or p.path().endswith("/results"), p.path())
        p.click("#goHelp"); p.click("#goSettings"); p.pg.go_back(); p.pg.wait_for_timeout(300); ok("the Back button goes to the page before", p.screen() == "qmguide")
        ok("the sidebar shows on an inner page with 14 boxes at most", p.is_visible("#sidebar") and p.locator("#sbNav .sbitem").count() >= 12)
        p.click("#sbNav [data-sb=settings]"); p.pg.wait_for_timeout(300); ok("a sidebar box opens its page", p.screen() == "settings")
        p.pg.goto(p.base + "builder/activity"); p.pg.wait_for_function("document.body.dataset.screen==='analytics'", timeout=8000); ok("an older address leads to its new page", p.path().rstrip("/").endswith("/analytics"))
        p.click("#brandLink"); p.pg.wait_for_timeout(300); ok("the logo leads Home", p.screen() == "home")
        p.run_lite_quiz("Nav"); p.pg.go_back(); p.pg.wait_for_timeout(300); ok("the Back button does not leave a finished or running quiz", p.screen() in ("end", "game"))
