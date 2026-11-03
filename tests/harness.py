"""Shared helpers for the OBQ checks (run them all with:  python tests/run_all.py).
   A check is a file tests/cases/test_*.py with NAME = "..." and run(t); `t` gives a built copy of the app on a free port, a browser, and helpers.
   Needs:  pip install playwright openpyxl pillow cryptography   and   playwright install chromium"""
import contextlib, functools, http.server, json, os, re, shutil, socketserver, subprocess, sys, tempfile, threading, time
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FIX = os.path.join(ROOT, "tests", "fixtures")
FB_EMPTY = 'firebase: { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "", measurementId: "" },'
FB_TEST = 'firebase: { apiKey: "test-key", authDomain: "test.firebaseapp.com", projectId: "test-project", storageBucket: "", messagingSenderId: "1", appId: "1:1:web:1", measurementId: "G-TEST1234" },'

def run_tool(*args):
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", args[0])] + list(args[1:]), cwd=ROOT, capture_output=True, text=True)
    if r.returncode: raise RuntimeError("build step failed: %s\n%s" % (args, (r.stdout + r.stderr)[-1500:]))
    return r.stdout

def build(force=False):
    dist = os.path.join(ROOT, "dist")
    if force or not os.path.exists(os.path.join(dist, "obq-app", "index.html")):
        for a in (["make_template.py"], ["assemble.py"], ["assemble.py", "--basic"], ["build_pwa.py"]): run_tool(*a)
    return dist

class Server:
    def __init__(self, directory):
        class H(http.server.SimpleHTTPRequestHandler):
            def log_message(self, *a): pass
        socketserver.ThreadingTCPServer.allow_reuse_address = True
        self.httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), functools.partial(H, directory=directory)); self.port = self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
    def close(self): self.httpd.shutdown(); self.httpd.server_close()

def patch_html(text, mode, contact=None):
    text = re.sub(r"firebase: \{[^{}]*\},", lambda m: FB_TEST if mode == "firebase" else FB_EMPTY, text, count=1)
    if contact is not None: text = re.sub(r"contact: \{[^{}]*\}", lambda m: "contact: " + json.dumps(contact), text, count=1)
    return text

class Page:
    """a browser page with the helpers the checks need"""
    def __init__(self, pg, base): self.pg, self.base = pg, base
    def __getattr__(self, k): return getattr(self.pg, k)
    def screen(self): return self.pg.evaluate("document.body.dataset.screen")
    def path(self): return self.pg.evaluate("location.pathname")
    def open(self, path="", wait=1200):
        self.pg.goto(self.base + path); self.pg.wait_for_function("document.body.dataset.screen", timeout=20000); self.pg.wait_for_timeout(wait - 800 if wait > 800 else 100)
    def accept_terms(self):
        self.pg.click("#upTermsLink"); self.pg.evaluate("document.getElementById('termsBody').scrollTop=99999"); self.pg.wait_for_timeout(150); self.pg.click("#termsAccept")
    def signup(self, email, name="Jos Kurian", pw="MyPass#2026"):          # local accounts (no Firebase)
        p = self.pg; p.click("#tabUp"); p.fill("#upName", name); p.fill("#upEmail", email); p.fill("#upOrg", "Youth"); p.fill("#upCountry", "IN"); p.select_option("#upUsage", "church"); p.fill("#upPass", pw)
        self.accept_terms(); p.click("#btnUp"); p.wait_for_function("document.body.dataset.screen && document.body.dataset.screen!=='auth'", timeout=15000); p.wait_for_timeout(300)
    def login(self, email, pw="abcdef", dismiss=True):                      # accounts of the fake Firebase (the one-time analytics question is answered "No" unless dismiss=False)
        p = self.pg; p.fill("#inEmail", email); p.fill("#inPass", pw); p.click("#btnIn"); p.wait_for_function("document.body.dataset.screen==='home'", timeout=15000); p.wait_for_timeout(400)
        if dismiss and p.is_visible("#anModal"): p.click("#anDeny"); p.wait_for_timeout(150)
    def stub_excel(self, rows):                                              # the real Excel reader comes from the internet: a stand-in that returns these rows
        self.pg.evaluate("window.__ROWS=%s; %s" % (json.dumps(rows, ensure_ascii=False), open(os.path.join(FIX, "xlsx_stub.js"), encoding="utf-8").read()))
    def play_to_end(self):                                                   # answers every question of the quiz that is showing (the first name gets the points) and waits for the final page
        p = self.pg; n = p.evaluate("document.querySelectorAll('#segs .seg').length")
        for i in range(n):
            for _ in range(12):
                p.keyboard.press("PageDown"); p.wait_for_timeout(8)
                if p.evaluate("document.getElementById('game').classList.contains('answered')"): break
            p.fill("#nameIn", "Team A" if i % 3 else "Team B"); p.keyboard.press("Enter"); p.wait_for_timeout(12); p.keyboard.press("PageDown"); p.wait_for_timeout(15)
        p.wait_for_function("document.body.dataset.screen==='end'", timeout=15000); return n
    def run_lite_quiz(self, name="Test quiz"):
        p = self.pg
        if self.screen() != "lite": p.click("[data-card=lite]"); p.wait_for_timeout(300)
        p.fill("#lName", name); p.click("#liteStart"); p.wait_for_function("document.body.dataset.screen==='game'")
        n = p.evaluate("document.querySelectorAll('#segs .seg').length")
        for i in range(n):
            for _ in range(10):
                p.keyboard.press("PageDown"); p.wait_for_timeout(8)
                if p.evaluate("document.getElementById('game').classList.contains('answered')"): break
            p.fill("#nameIn", "Team A" if i % 3 else "Team B"); p.keyboard.press("Enter"); p.wait_for_timeout(12); p.keyboard.press("PageDown"); p.wait_for_timeout(15)
        p.wait_for_function("document.body.dataset.screen==='end'", timeout=15000); return n

class T:
    def __init__(self, pw_browser, dist):
        self.b, self.dist, self.errors, self._tmp = pw_browser, dist, [], []
    @contextlib.contextmanager
    def site(self, mode="local", contact=None):
        tmp = tempfile.mkdtemp(prefix="obq-site-"); shutil.copytree(os.path.join(self.dist, "obq-app"), os.path.join(tmp, "obq"))
        for r, _, fs in os.walk(os.path.join(tmp, "obq")):
            for f in fs:
                if f.endswith(".html"):
                    p = os.path.join(r, f); txt = open(p, encoding="utf-8").read(); open(p, "w", encoding="utf-8").write(patch_html(txt, mode, contact))
        os.makedirs(os.path.join(tmp, "basic"), exist_ok=True); shutil.copy(os.path.join(self.dist, "obq-basic.html"), os.path.join(tmp, "basic", "index.html"))
        srv = Server(tmp)
        try: yield "http://127.0.0.1:%d/obq/" % srv.port
        finally: srv.close(); shutil.rmtree(tmp, ignore_errors=True)
    @contextlib.contextmanager
    def page(self, base, firebase=False, extra_routes=None, **ctx_kw):
        ctx = self.b.new_context(**dict(dict(viewport={"width": 1300, "height": 950}), **ctx_kw))
        ctx.route(re.compile(r"^https?://(?!127\.0\.0\.1|localhost)"), lambda r: r.abort())          # the internet is off: only stand-ins answer
        if firebase:
            stub = open(os.path.join(FIX, "firebase_stub.js"), encoding="utf-8").read()
            ctx.route(re.compile(r"https://www\.gstatic\.com/firebasejs/.*"), lambda r: r.fulfill(status=200, content_type="application/javascript", body=stub if "firebase-app-compat" in r.request.url else ""))
        for pat, fn in (extra_routes or []): ctx.route(pat, fn)
        pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); P = Page(pg, base)
        try: yield P
        finally:
            if errs: self.errors.extend(errs)
            ctx.close()
    def check_no_errors(self): assert not self.errors, "page errors: %s" % self.errors[:3]
def ok(label, cond, detail=""):
    if not cond: raise AssertionError("%s %s" % (label, detail))
    print("   ok - " + label)
