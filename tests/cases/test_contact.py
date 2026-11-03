import json
from harness import ok
NAME = "contact form (one-time code from the server, messages and limits)"
HANDLER = """window.__fnCalls=[]; window.__fnMode='ok'; window.__fn=function(name,data){ window.__fnCalls.push([name,data]);
  if(window.__fnMode!=='ok'){ var e={code:'functions/resource-exhausted',message:window.__fnMode}; throw e }
  if(name==='requestContactCode') return {ok:true,to:'a***@e.org',expiresInSec:600};
  if(data.code!=='123456'){ var w={code:'functions/permission-denied',message:'wrong-code'}; throw w } return {ok:true} };0"""
MSG = "Hello, I need more information about running a quiz with my youth group."
def run(t):
    with t.site("firebase", contact={"provider": "functions", "region": "us-central1"}) as base, t.page(base, firebase=True) as p:
        p.open(); p.login("ann@e.org"); p.evaluate(HANDLER); p.click("[data-card=about]"); p.pg.wait_for_timeout(400)
        ok("the form is open for a signed-in online account", not p.is_disabled("#ctCodeBtn") and not p.is_visible("#ctOff"))
        ok("the reply address is the account address and cannot be changed", p.input_value("#ctEmail") == "ann@e.org" and p.evaluate("document.getElementById('ctEmail').readOnly"))
        ok("there is no code box before a code was asked for", not p.is_visible("#ctCodeBox"))
        p.click("#ctCodeBtn"); ok("an empty message is refused and nothing is asked of the server", p.evaluate("window.__fnCalls.length") == 0 and "10 to 2000" in p.inner_text("#ctMsg"))
        p.fill("#ctText", MSG); p.evaluate("document.getElementById('ctWebsite').value='x'"); p.click("#ctCodeBtn"); ok("a robot (hidden field filled) is stopped in the page", p.evaluate("window.__fnCalls.length") == 0); p.evaluate("document.getElementById('ctWebsite').value=''")
        p.click("#ctCodeBtn"); p.pg.wait_for_timeout(400)
        ok("a code is asked for from the server (no address is sent: the server uses the account)", p.evaluate("window.__fnCalls")[0] == ["requestContactCode", {}])
        ok("the code box opens and says where the code went", p.is_visible("#ctCodeBox") and "a***@e.org" in p.inner_text("#ctCodeNote"))
        p.fill("#ctCode", "12"); p.click("#ctSend"); ok("a short code is refused in the page", p.evaluate("window.__fnCalls.length") == 1)
        p.fill("#ctCode", "000000"); p.click("#ctSend"); p.pg.wait_for_timeout(300); ok("a wrong code gets a clear answer and nothing is sent", "not right" in p.inner_text("#ctMsg") and p.input_value("#ctText") == MSG)
        p.fill("#ctCode", "123456"); p.click("#ctSend"); p.pg.wait_for_timeout(400)
        call = p.evaluate("window.__fnCalls")[-1]; ok("the message goes to the server with the code", call[0] == "sendContactMessage" and call[1]["code"] == "123456" and call[1]["message"] == MSG and call[1]["topic"] == "info", str(call)[:200])
        ok("the server never receives an address typed in the form", "email" not in call[1])
        ok("after sending: thank you, form cleared, ready for a new code", "Thank you" in p.inner_text("#ctMsg") and p.input_value("#ctText") == "" and not p.is_visible("#ctCodeBox"))
        for reason, words in (("wait", "wait a minute"), ("daily-messages", "most messages"), ("daily-codes", "several codes")):
            p.evaluate("window.__fnMode=%s" % json.dumps(reason)); p.fill("#ctText", MSG); p.click("#ctCodeBtn"); p.pg.wait_for_timeout(300)
            ok("the server's answer '%s' is shown as a sentence" % reason, words in p.inner_text("#ctMsg"), p.inner_text("#ctMsg"))
    with t.site("firebase", contact={"provider": "", "region": "us-central1"}) as base, t.page(base, firebase=True) as p:
        p.open(); p.login("ann@e.org"); p.click("[data-card=about]"); p.pg.wait_for_timeout(300)
        ok("not set up: the form is off and says so", p.is_disabled("#ctCodeBtn") and "not set up" in p.inner_text("#ctOff"))
    with t.site("local", contact={"provider": "functions", "region": "us-central1"}) as base, t.page(base) as p:
        p.open(); p.signup("local@e.org"); p.click("[data-card=about]"); p.pg.wait_for_timeout(300)
        ok("a local account cannot use it (it needs an online account)", p.is_disabled("#ctCodeBtn") and "online account" in p.inner_text("#ctOff"))
