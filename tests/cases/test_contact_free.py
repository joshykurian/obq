import json
from harness import ok
NAME = "contact form on the free Firebase plan (confirmation link, rules, 3 a day)"
MSG = "Hello, I need more information about running a quiz with my youth group."
def run(t):
    with t.site("firebase", contact={"provider": "firebase", "region": "us-central1"}) as base, t.page(base, firebase=True) as p:
        pg = p.pg; p.open(); p.login("ann@e.org"); p.click("[data-card=about]"); pg.wait_for_timeout(400)
        ok("the form is open and talks about a confirmation link", not p.is_disabled("#ctCodeBtn") and "confirmation link" in p.inner_text("#ctCodeBtn") and "link" in p.inner_text("#ctSendNoteP"))
        ok("no code field in this mode", not p.is_visible("#ctCode") and not p.is_visible("#ctResend"))
        p.click("#ctCodeBtn"); ok("an empty message is refused", "10 to 2000" in p.inner_text("#ctMsg") and pg.evaluate("(window.__linkSent||[]).length") == 0)
        p.fill("#ctText", MSG); p.click("#ctCodeBtn"); pg.wait_for_timeout(400); sent = pg.evaluate("window.__linkSent")
        ok("a link is sent to the ACCOUNT address, and the link comes back to the contact page", sent and sent[0][0] == "ann@e.org" and sent[0][1]["handleCodeInApp"] is True and sent[0][1]["url"].rstrip("/").endswith("/about/contact"), str(sent)[:160])
        ok("the page says where it went (masked) and keeps the message as a draft", "a***@e.org" in p.inner_text("#ctMsg") and not p.is_visible("#ctCodeBox"))
        pg.evaluate("window.__authTime=Math.floor(Date.now()/1000)+2")                                      # the person opened the link: a new sign-in
        p.click("#goHome"); p.click("[data-card=about]"); pg.wait_for_timeout(600)
        ok("back on the page the message is restored and the email counts as confirmed", p.is_visible("#ctCodeBox") and "confirmed" in p.inner_text("#ctCodeNote") and p.input_value("#ctText") == MSG)
        p.click("#ctSend"); pg.wait_for_timeout(500)
        keys = [k for k in pg.evaluate("Object.keys(__DB)") if k.startswith("contactMessages/")]; doc = pg.evaluate("__DB[%s]" % json.dumps(keys[0])) if keys else {}
        ok("the message is stored with the id user + day + 1, the account email and no extra fields", len(keys) == 1 and keys[0].endswith("_1") and keys[0].split("/")[1].startswith("U1_") and doc.get("email") == "ann@e.org" and doc.get("uid") == "U1" and set(doc) <= {"uid", "name", "email", "org", "country", "topic", "message", "uiLang", "appVersion", "browser", "createdAt"}, str(keys))
        ok("it says thank you and the draft is cleared", "Thank you" in p.inner_text("#ctMsg") and p.input_value("#ctText") == "")
        for n in (2, 3):
            p.fill("#ctText", MSG + " %d" % n); p.click("#ctCodeBtn"); pg.wait_for_timeout(300); pg.evaluate("window.__authTime=Math.floor(Date.now()/1000)+2"); p.click("#goHome"); p.click("[data-card=about]"); pg.wait_for_timeout(500); p.click("#ctSend"); pg.wait_for_timeout(400)
        ok("three messages can be sent in a day", len([k for k in pg.evaluate("Object.keys(__DB)") if k.startswith("contactMessages/")]) == 3)
        p.fill("#ctText", MSG + " 4"); p.click("#ctCodeBtn"); pg.wait_for_timeout(300); pg.evaluate("window.__authTime=Math.floor(Date.now()/1000)+2"); p.click("#goHome"); p.click("[data-card=about]"); pg.wait_for_timeout(500); p.click("#ctSend"); pg.wait_for_timeout(500)
        ok("the fourth is refused with a clear message", "3 messages today" in p.inner_text("#ctMsg") and len([k for k in pg.evaluate("Object.keys(__DB)") if k.startswith("contactMessages/")]) == 3, p.inner_text("#ctMsg")[:90])
        # an old confirmation does not count
        pg.evaluate("Object.keys(__DB).filter(k=>k.startsWith('contactMessages/')).forEach(k=>delete __DB[k]); window.__authTime=Math.floor(Date.now()/1000)-1200")
        p.click("#goHome"); p.click("[data-card=about]"); pg.wait_for_timeout(600)
        ok("a confirmation older than 9 minutes is not accepted: the page asks for a new link", not p.is_visible("#ctCodeBox") and p.is_visible("#ctCodeBtn"))
