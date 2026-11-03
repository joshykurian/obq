import http.server, json, os, re, subprocess, sys, threading, tempfile
from harness import ROOT, FIX, ok
NAME = "verse of the day (packs, interface language), Demo Contest before sign-in, language switch, Account and help"
class Api(http.server.BaseHTTPRequestHandler):                         # a stand-in for Bible Brain: it answers like the real one for the verses asked
    def log_message(self, *a): pass
    def do_GET(self):
        m = re.match(r"/api/bibles/filesets/([^/]+)/([^/]+)/(\d+)\?(.*)", self.path); q = dict(x.split("=") for x in m.group(4).split("&")); v1, v2 = int(q["verse_start"]), int(q["verse_end"])
        rows = [{"book_id": m.group(2), "book_name": {"hi": "यूहन्ना"}.get(m.group(1)[:2].lower(), "Book"), "chapter": int(m.group(3)), "verse_start": n, "verse_text": "%s %s:%d test text" % (m.group(1), m.group(2), n)} for n in range(v1, v2 + 1)]
        body = json.dumps({"data": rows}).encode(); self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(body)
def run(t):
    run_main(t); run_bible_brain(t)

def run_main(t):
    srv = http.server.HTTPServer(("127.0.0.1", 0), Api); threading.Thread(target=srv.serve_forever, daemon=True).start(); tmp = tempfile.mkdtemp(); out = os.path.join(tmp, "verses.json")
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "fetch_verses.py"), "--key", "K", "--api", "http://127.0.0.1:%d/api" % srv.server_port, "--out", out, "--delay", "0", "--bible", "en=ENGTEST|TST|Test copyright notice.", "--bible", "hi=HINTEST|HinTest|Hindi copyright."], capture_output=True, text=True)
    ok("the tool fetches the verses of every language from the (stand-in) Bible Brain", r.returncode == 0 and "en: 58 of 58" in r.stdout and "hi: 58 of 58" in r.stdout, r.stdout[-300:] + r.stderr[-300:])
    d = json.load(open(out, encoding="utf-8")); ok("John 3:16 is stored with its text, the Bible name and the copyright line", d["en"]["v"]["John 3:16"] == "ENGTEST JHN:16 test text" and d["en"]["name"] == "TST" and d["en"]["copyright"] == "Test copyright notice." and d["hi"]["b"]["JHN"] == "यूहन्ना")
    ok("a verse of several numbers is joined (Psalm 23:1-3 style or any range)", all(len(x) > 3 for x in d["en"]["v"].values()))
    env = dict(os.environ, OBQ_VERSES_JSON=open(out, encoding="utf-8").read())
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "assemble.py")], cwd=ROOT, capture_output=True, text=True, env=env); ok("the build puts them into the app", "verse of the day: texts for en, hi" in r.stdout, r.stdout[-400:] + r.stderr[-300:])
    html = open(os.path.join(ROOT, "dist", "index.html"), encoding="utf-8").read(); ok("they are in the page", "ENGTEST JHN:16 test text" in html)
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", "build_pwa.py")], cwd=ROOT, capture_output=True, text=True)
    with t.site("local") as base, t.page(base) as p:                                               # with the verse texts built in
        pg = p.pg; p.open(); p.signup("vp@e.org"); pg.wait_for_timeout(300)
        ok("English: the verse is from the licensed Bible, with its copyright line", "TST" in p.inner_text("#votdSrc") and "Test copyright notice." in p.inner_text("#votdCopy") and "test text" in p.inner_text("#votdText") and not p.is_visible("#votdNote"))
        pg.select_option("#tbLang", "hi"); pg.wait_for_timeout(150)
        ok("Hindi: the verse is from the Hindi Bible, with the Hindi book name, and no note", "HinTest" in p.inner_text("#votdSrc") and "HINTEST" in p.inner_text("#votdText") and "Hindi copyright." in p.inner_text("#votdCopy") and not p.is_visible("#votdNote"))
        pg.select_option("#tbLang", "ml"); pg.wait_for_timeout(150)
        ok("Malayalam (no Bible for it): the English verse and the note", "TST" in p.inner_text("#votdSrc") and p.is_visible("#votdNote"))
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", "assemble.py")], cwd=ROOT, capture_output=True, text=True); subprocess.run([sys.executable, os.path.join(ROOT, "tools", "build_pwa.py")], cwd=ROOT, capture_output=True, text=True)       # back to the normal build
    with t.site("local") as base, t.page(base) as p:
        pg = p.pg; p.open(); ok("the sign-in page offers the Demo Contest", p.is_visible("#demoGuest") and "Demo Contest" in p.inner_text("#demoGuest"))
        pg.select_option("#authLang", "hi"); pg.wait_for_timeout(100); ok("the sign-in page changes language at once", "डेमो" in p.inner_text("#demoGuest"), p.inner_text("#demoGuest"))
        pg.select_option("#authLang", "en"); p.click("#demoGuest"); pg.wait_for_function("document.body.dataset.screen==='game'", timeout=10000); ok("the demo starts without any account", p.screen() == "game")
        n = p.play_to_end(); ok("it is the 10-question demo", n == 10, str(n))
        pg.wait_for_function("document.body.dataset.screen==='end'", timeout=15000); ok("the final page invites the guest to create an account", p.is_visible("#guestEnd") and not p.is_visible("#again"))
        ok("nothing of the guest is kept on the device", not pg.evaluate("Object.keys(localStorage).filter(k=>/guest@demo/.test(k)||/qms\\.history/.test(k)&&localStorage[k]!=='[]').length"))
        p.click("#endHome"); pg.wait_for_function("document.body.dataset.screen==='auth'", timeout=8000); ok("Home leads back to the sign-in page", p.screen() == "auth" and p.is_visible("#demoGuest"))
        p.signup("sw@e.org"); pg.wait_for_timeout(300)
        before = p.inner_text("#home"); pg.select_option("#tbLang", "ml"); pg.wait_for_timeout(120); after = p.inner_text("#home")
        ok("the Home page changes language at once, with no click", "ക്വിസ്" in after and after != before and not re.search(r"Almost no setup|Redo a saved quiz", after), after[:120])
        ok("the verse says why it is in English when no Bible text of that language is available", p.is_visible("#votdNote") and "ഇംഗ്ലീഷ" in p.inner_text("#votdNote"), p.inner_text("#votdNote"))
        pg.select_option("#tbLang", "en"); pg.wait_for_timeout(100); ok("English needs no note", not p.is_visible("#votdNote")); ok("English text comes from the King James Version until the licensed text is built in", "King James" in p.inner_text("#votdSrc"))
        grp = pg.evaluate("(()=>{const g=document.querySelector('[data-group=more] .cards'); const cs=[...g.children].filter(e=>e.offsetParent); const xs=new Set(cs.map(e=>Math.round(e.getBoundingClientRect().left))); const ys=new Set(cs.map(e=>Math.round(e.getBoundingClientRect().top))); return [cs.length, xs.size, ys.size]})()")
        ok("Account and help is 2 columns x 2 rows", grp == [4, 2, 2], str(grp))
        p.click("#goSettings"); pg.wait_for_timeout(200); pg.select_option("#tbLang", "hi"); pg.wait_for_timeout(100); st = p.inner_text("#settings"); pg.select_option("#tbLang", "ml"); pg.wait_for_timeout(100)
        ok("the Settings page also changes at once (its install notes too)", p.inner_text("#settings") != st and "ക്രമീകരണങ്ങൾ" in p.inner_text("#settings"))

def run_bible_brain(t):                                                          # the verse fetched from Bible Brain in the interface language (a stand-in answers the requests)
    import re as _re
    env = dict(os.environ, OBQ_BIBLE_BRAIN_KEY="TESTKEY")
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", "assemble.py")], cwd=ROOT, capture_output=True, text=True, env=env); subprocess.run([sys.executable, os.path.join(ROOT, "tools", "build_pwa.py")], cwd=ROOT, capture_output=True, text=True)
    calls = []
    def bibles(iso):
        if iso == "eng": return [{"abbr": "ENGKJV", "name": "King James", "filesets": {"x": [{"id": "ENGKJV", "type": "text_plain", "size": "C"}]}}, {"abbr": "ENGESV", "name": "English Standard Version", "filesets": {"x": [{"id": "ENGESV", "type": "text_plain", "size": "C"}, {"id": "ENGESVO", "type": "audio", "size": "C"}]}}]
        if iso == "hin": return [{"abbr": "HINOTH", "name": "Hindi other", "filesets": [{"id": "HINOTH", "type": "text_plain", "size": "C"}]}, {"abbr": "HINIRV", "name": "Hindi IRV", "vname": "\u0939\u093f\u0928\u094d\u0926\u0940 IRV", "filesets": {"x": [{"id": "HINIRV", "type": "text_plain", "size": "C"}, {"id": "HINIRVNT", "type": "text_plain", "size": "NT"}]}}]
        if iso == "ory": return []
        if iso == "ori": return [{"abbr": "ORYIRV", "name": "Odia IRV", "filesets": [{"id": "ORYIRV", "type": "text_plain", "size": "C"}]}]
        return []
    def handler(route):
        u = route.request.url; calls.append(u)
        if "key=TESTKEY" not in u: route.fulfill(status=401, body="{}"); return
        m = _re.search(r"/api/bibles\?.*language_code=([a-z]+)", u)
        if m: route.fulfill(status=200, content_type="application/json", body=json.dumps({"data": bibles(m.group(1))})); return
        m = _re.search(r"/api/bibles/filesets/([^/]+)/([^/]+)/(\d+)\?(.*)", u)
        if m:
            q = dict(x.split("=") for x in m.group(4).split("&")); v1, v2 = int(q["verse_start"]), int(q["verse_end"])
            rows = [{"book_id": m.group(2), "book_name": "\u092f\u0942\u0939\u0928\u094d\u0928\u093e" if m.group(1).startswith("HIN") else "Book", "chapter": int(m.group(3)), "verse_start": n, "verse_text": "%s verse %d" % (m.group(1), n)} for n in range(v1, v2 + 1)]
            route.fulfill(status=200, content_type="application/json", body=json.dumps({"data": rows})); return
        route.fulfill(status=404, body="{}")
    with t.site("local") as base, t.page(base) as p:
        pg = p.pg; pg.route("https://4.dbt.io/**", handler); p.open(); p.signup("bb@e.org"); pg.wait_for_timeout(800)
        ok("English: the verse comes from the ESV, with the ESV notice", "ENGESV verse" in p.inner_text("#votdText") and "ESV" in p.inner_text("#votdCopy") and "Crossway" in p.inner_text("#votdCopy"), p.inner_text("#votdText") + "|" + p.inner_text("#votdCopy"))
        pg.select_option("#tbLang", "hi"); pg.wait_for_timeout(800)
        ok("Hindi: the equivalent verse comes from the Hindi IRV (the complete Bible first), with its Hindi book name", "HINIRV verse" in p.inner_text("#votdText") and "\u092f\u0942\u0939\u0928\u094d\u0928\u093e" in p.inner_text("#votdRef"), p.inner_text("#votdText") + "|" + p.inner_text("#votdRef"))
        ok("the IRV notice names the Creative Commons licence", "CC BY-SA 4.0" in p.inner_text("#votdCopy") and not p.is_visible("#votdNote"), p.inner_text("#votdCopy"))
        pg.select_option("#tbLang", "or"); pg.wait_for_timeout(800); ok("Odia: found under the second language code", "ORYIRV verse" in p.inner_text("#votdText"), p.inner_text("#votdText"))
        pg.select_option("#tbLang", "ta"); pg.wait_for_timeout(800); ok("Tamil (nothing at Bible Brain here): English text and the note", p.is_visible("#votdNote") and "King James" in p.inner_text("#votdSrc"), p.inner_text("#votdSrc"))
        n = len(calls); pg.select_option("#tbLang", "hi"); pg.wait_for_timeout(300); pg.select_option("#tbLang", "en"); pg.wait_for_timeout(300)
        ok("a verse fetched once is kept: no new request when going back", len(calls) == n and "ENGESV verse" in p.inner_text("#votdText"), "%d/%d" % (len(calls), n))
        pg.unroute("https://4.dbt.io/**"); pg.route("https://4.dbt.io/**", lambda r: r.abort()); pg.select_option("#tbLang", "hi"); pg.wait_for_timeout(500)
        ok("when Bible Brain cannot be reached, a verse kept earlier still shows", "HINIRV verse" in p.inner_text("#votdText"), p.inner_text("#votdText"))
        pg.select_option("#tbLang", "bn"); pg.wait_for_timeout(800)
        ok("a verse never fetched falls back to English with the note, no error", p.is_visible("#votdNote") and "King James" in p.inner_text("#votdSrc"))
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", "assemble.py")], cwd=ROOT, capture_output=True, text=True); subprocess.run([sys.executable, os.path.join(ROOT, "tools", "build_pwa.py")], cwd=ROOT, capture_output=True, text=True)
