import os, re
from harness import ROOT, ok
NAME = "legal and accuracy notices (Terms, About, FAQ, Home)"
def rd(f): return open(os.path.join(ROOT, "src", f), encoding="utf-8").read()
def run(t):
    terms = rd("terms.html"); low = re.sub(r"<[^>]+>", " ", terms).lower()
    for phrase in ("artificial intelligence", "has not been checked", "theological accuracy", "bible scholar", "compare them with the bible text", "european economic area", "united kingdom", "information commissioner",
                   "legitimate interests", "withdraw", "within one month", "standard contractual clauses", "retention" if False else "how long we keep it", "at least 16", "separate consent", "one-time confirmation", "settings, your data"):
        ok("Terms: " + phrase, phrase in low, "")
    guide = re.sub(r"<[^>]+>", " ", rd("guide_qm.html")).lower()
    ok("FAQ in the instructions: AI content, no scholar check, one-time code, data deletion", all(x in guide for x in ("questions and answers (faq)", "ai tools and machine translation", "bible scholar", "one-time confirmation link", "delete your account")))
    cfg = rd("cfg2_extra.js")
    for key in ("homeAiNote", "abAi1", "abAi3", "setupAiNote", "trAiNote", "bankAiNote"): ok("text exists: " + key, key in cfg)
    ok("every AI notice says the theology was not checked", all(re.search(key + r': "[^"]*theological accuracy', cfg) for key in ("homeAiNote", "trAiNote", "bankAiNote")) and "theological accuracy" in cfg.split("abAi3")[1][:200])
    with t.site("local") as base, t.page(base) as p:
        p.open(); p.signup("legal@e.org")
        ok("the note is on Home", p.is_visible("#homeAiNote") and "AI tools" in p.inner_text("#homeAiNote"))
        p.click("#sbNav [data-sb=about]") if p.is_visible("#sbNav") else p.click("[data-card=about]"); p.pg.wait_for_timeout(300) if False else None
        p.click("#goHome"); p.click("[data-card=about]"); p.pg.wait_for_timeout(400)
        ok("the About page opens with the notice first", p.is_visible("#aboutAi") and "theological accuracy" in p.inner_text("#aboutAi"))
        p.click("#abTerms"); p.pg.wait_for_timeout(400); ok("the Terms window shows the new sections", "AI-generated content" in p.inner_text("#termsModal") and "European Economic Area" in p.inner_text("#termsModal"))
