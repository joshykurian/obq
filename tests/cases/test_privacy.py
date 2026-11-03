import json
from harness import ok
NAME = "privacy (analytics choice, download my data, delete my account)"
def run(t):
    with t.site("firebase") as base, t.page(base, firebase=True, accept_downloads=True) as p:
        p.open(); p.login("ann@e.org", dismiss=False); p.pg.wait_for_timeout(500)
        ok("an account that never chose is asked once, and nothing is collected before the answer", p.is_visible("#anModal") and p.evaluate("(window.firebase&&1)") and not p.evaluate("document.querySelector('#setAnalytics') && document.querySelector('#setAnalytics').checked"))
        p.click("#anDeny"); ok("No: the pop-up closes and the choice is kept", not p.is_visible("#anModal"))
        p.click("#goSettings"); p.pg.wait_for_timeout(300); ok("Settings shows analytics as off", not p.is_checked("#setAnalytics"))
        p.click("#signOutBtn"); p.pg.wait_for_timeout(300); p.login("ann@e.org"); ok("it is not asked again", not p.is_visible("#anModal"))
        p.evaluate("""(()=>{ const D=window.__DB; D['usage/U1_0']={uid:'U1',event:'Rally',startedAt:{_t:'2026-11-01T00:00:00.000Z'}}; D['sharedBanks/U1_s1']={owner:'U1',name:'My bank',chunks:1,count:3}; D['sharedBanks/U1_s1/chunks/c0']={i:0,data:'x'}; D['analyticsShares/U1']={uid:'U1'}; D['quizMasters/U1/logins/a']={method:'password'}; D['quizMasters/U1/banks/lib_x']={rows:'[]'} })()""")
        p.click("#goSettings"); p.pg.wait_for_timeout(300)
        with p.pg.expect_download() as d: p.click("#mdDownload")
        data = json.load(open(d.value.path(), encoding="utf-8")); ok("the download holds the account, the device data and the cloud records", data["account"]["email"] == "ann@e.org" and data["inTheCloud"]["profile"]["name"] and len(data["inTheCloud"]["quizSetupRecords"]) == 1 and len(data["inTheCloud"]["sharedQuestionBanks"]) == 1 and len(data["inTheCloud"]["signIns"]) >= 1, str(list(data))[:120])
        ok("delete stays off until DELETE is typed", p.is_disabled("#mdDelete")); p.fill("#mdConfirm", "delete me"); ok("a wrong word keeps it off", p.is_disabled("#mdDelete"))
        p.evaluate("window.__recentLogin=true"); p.fill("#mdConfirm", "DELETE"); p.click("#mdDelete"); p.pg.wait_for_timeout(600); ok("when the sign-in is too old it asks to sign in again", "sign in again" in p.inner_text("#mdMsg"))
        p.evaluate("window.__recentLogin=false"); p.click("#mdDelete"); p.pg.wait_for_timeout(1000)
        left = p.evaluate("Object.keys(window.__DB).filter(k=>/U1/.test(k))"); ok("every cloud record of the account is gone", not [k for k in left if not k.startswith("admins")], str(left))
        ok("the sign-in account was deleted and the person is signed out", p.evaluate("window.__authDeleted") >= 1 and p.screen() == "auth")
    with t.site("local") as base, t.page(base) as p:
        p.open(); p.signup("c@e.org"); ok("a local account: the analytics switch is off by default", True); p.click("#goSettings"); p.pg.wait_for_timeout(300); ok("analytics are off", not p.is_checked("#setAnalytics"))
        p.fill("#mdConfirm", "DELETE"); p.click("#mdDelete"); p.pg.wait_for_timeout(800); ok("a local account can be deleted too", p.screen() == "auth" and p.evaluate("!(JSON.parse(localStorage.getItem('qms.users')||'{}')['c@e.org'])"))
