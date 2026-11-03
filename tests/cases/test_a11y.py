import os, re
from harness import ROOT, ok
NAME = "accessibility (focus in pop-ups, names, contrast)"
def lum(h):
    h = h.lstrip("#"); r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]; f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
def cr(a, b): la, lb = lum(a), lum(b); return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
def run(t):
    cfg = open(os.path.join(ROOT, "src", "cfg1.js"), encoding="utf-8").read()                       # 1. colours
    for name, rx in (("dark", r"\bcolors:\s*\{([^}]*)\}"), ("light", r"colorsLight:\s*\{([^}]*)\}")):
        P = dict(re.findall(r'(\w+):\s*"(#[0-9A-Fa-f]{6})"', re.search(rx, cfg).group(1)))
        for a, b in (("ink", "bg"), ("ink", "panel"), ("muted", "bg"), ("muted", "panel"), ("accent", "bg"), ("accentInk", "accent"), ("goodInk", "good")):
            ok("%s palette: %s on %s is at least 4.5:1" % (name, a, b), cr(P[a], P[b]) >= 4.5, "%.2f" % cr(P[a], P[b]))
    with t.site("local") as base, t.page(base) as p:
        p.open(); p.click("#tabUp"); p.click("#upTermsLink"); p.wait_for_timeout(300)                  # 2. keyboard focus stays inside a pop-up
        inside = []
        for i in range(16): p.keyboard.press("Tab"); inside.append(p.evaluate("!!document.activeElement.closest('#termsModal')"))
        ok("focus stays in the Terms window for 16 Tab presses", all(inside), "escaped %d times" % inside.count(False))
        inside = []
        for i in range(8): p.keyboard.press("Shift+Tab"); inside.append(p.evaluate("!!document.activeElement.closest('#termsModal')"))
        ok("focus stays in the Terms window for 8 Shift+Tab presses", all(inside))
        p.keyboard.press("Escape"); p.wait_for_timeout(200); ok("Escape closes the pop-up", not p.is_visible("#termsModal"))
        ok("focus returns to the link that opened it", p.evaluate("document.activeElement && document.activeElement.id") == "upTermsLink")
        p.signup("a11y@e.org")                                                                           # 3. every visible control has a name
        js = """(sel)=>[...document.querySelectorAll(sel)].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).filter(e=>!(e.textContent.trim()||e.getAttribute('aria-label')||e.title||(e.labels&&e.labels.length)||e.getAttribute('aria-labelledby'))).map(e=>e.id)"""
        for name, nav in (("Home", None), ("Settings", "#goSettings"), ("Quiz Builder", "#goDash"), ("Quiz Results", "#goResults"), ("About", "#sbNav [data-sb=about]")):
            if nav: p.click(nav); p.wait_for_timeout(300)
            ok("%s: every visible control has a name" % name, not p.evaluate(js, "button,input:not([type=hidden]),select,textarea"), str(p.evaluate(js, "button,input:not([type=hidden]),select,textarea")))
