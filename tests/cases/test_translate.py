import json, os, re
from harness import FIX, ok
NAME = "questions in the language of a Bible text (services, cache, review, notices)"
MT = json.load(open(os.path.join(FIX, "mt_hi.json"), encoding="utf-8"))
def run(t):
    st = {"mode": "ok", "n": 0, "gemini": []}
    def google(route):
        body = json.loads(route.request.post_data); st["n"] += 1
        if st["mode"] == "403": return route.fulfill(status=403, content_type="application/json", headers={"access-control-allow-origin": "*"}, body="{}")
        if st["mode"] == "429once" and st["n"] == 1: return route.fulfill(status=429, content_type="application/json", headers={"access-control-allow-origin": "*"}, body="{}")
        route.fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"}, body=json.dumps({"data": {"translations": [{"translatedText": MT.get(x, "HI: " + x)} for x in body["q"]]}}))
    def gemini(route):
        arr = json.loads(json.loads(route.request.post_data)["contents"][0]["parts"][0]["text"].split("\n", 1)[1]); st["gemini"].append(len(arr)); out = [MT.get(x, "HI: " + x) for x in arr]
        if st["mode"] == "short" and len(st["gemini"]) == 1: out = out[:-1]
        route.fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"}, body=json.dumps({"candidates": [{"content": {"parts": [{"text": json.dumps(out, ensure_ascii=False)}]}}]}))
    routes = [(re.compile(r"https://translation\.googleapis\.com/.*"), google), (re.compile(r"https://generativelanguage\.googleapis\.com/.*"), gemini)]
    with t.site("local") as base, t.page(base, extra_routes=routes) as p:
        pg = p.pg; p.open(); p.signup("tr@e.org"); p.click("[data-card=kb]"); pg.wait_for_timeout(400); pg.select_option("#fKbLang", "hi"); p.set_input_files("#kbFiles", os.path.join(FIX, "test_bible_hi.zip"))
        pg.wait_for_function("document.getElementById('kbMsg').className==='okmsg'", timeout=30000)
        ok("a Bible text was added and the Generate button is offered right away", p.is_visible("#kbOfferBtn") and "Generate questions" in p.inner_text("#kbOfferBtn"))
        p.set_input_files("#fileIn", os.path.join(FIX, "base5.json")); pg.wait_for_timeout(700); p.click("#kbOfferBtn"); pg.wait_for_timeout(1000)
        ok("the window says the answers are not proven right", "look right and be wrong" in p.inner_text("#trModal") and "theological accuracy" in p.inner_text("#trModal"))
        pg.evaluate("[...document.getElementById('trBase').options].forEach((o,i)=>{ if(/English base/.test(o.textContent)) document.getElementById('trBase').selectedIndex=i })"); pg.dispatch_event("#trBase", "change"); pg.wait_for_timeout(400); pg.uncheck("#trTest") if pg.is_checked("#trTest") else None; pg.wait_for_timeout(300)
        ok("it counts the questions this Bible text can give (all 5) and splits them", "5 of the 5" in p.inner_text("#trCover") and "Old Testament 4" in p.inner_text("#trSplit") and "New Testament 1" in p.inner_text("#trSplit"), p.inner_text("#trSplit"))
        ok("the services offered include the free ones", all(x in pg.evaluate("[...document.getElementById('trEngine').options].map(o=>o.textContent).join('|')") for x in ("Gemini", "Chrome", "Google Cloud", "Microsoft", "Libre")))
        labels = pg.evaluate("Object.fromEntries([...document.getElementById('trEngine').options].map(o=>[o.value,o.textContent]))")
        ok("every service says in its title what it costs (Free, Limited free, then paid)", all("Limited free" in labels[k] for k in ("google", "microsoft", "gemini")) and "Free" in labels["chrome"] and "Free" in labels["libre"] and "Free" in labels["manual"], str(labels))
        for eng, n, host in (("gemini", 3, "aistudio.google.com"), ("google", 5, "console.cloud.google.com"), ("microsoft", 4, "portal.azure.com"), ("libre", 2, "libretranslate.com")):
            pg.select_option("#trEngine", eng); pg.wait_for_timeout(150)
            ok("%s: %d steps to get a key and a link to %s" % (eng, n, host), pg.locator("#trHowSteps li").count() == n and host in (pg.get_attribute("#trHowLink", "data-url") or "") and p.is_visible("#trHow"))
        pg.select_option("#trEngine", "chrome"); ok("Chrome needs no key, so no instructions", not p.is_visible("#trHow")); pg.select_option("#trEngine", "manual"); ok("the Excel route needs no key either", not p.is_visible("#trHow"))
        def go(key="K"):
            if p.is_visible("#trKeyWrap"): pg.fill("#trKey", key)
            p.click("#trStart"); pg.wait_for_function("document.getElementById('trResult').textContent.length>3 && document.getElementById('trStatus').offsetParent===null || document.getElementById('trResult').textContent.indexOf('Saved')===0", timeout=60000); pg.wait_for_timeout(300); return p.inner_text("#trResult")
        pg.select_option("#trEngine", "google"); p.click("#trStart"); ok("no key: asked for it", "key of the translation service" in p.inner_text("#trResult"))
        pg.fill("#trKey", "K"); st["mode"] = "403"; msg = go(); ok("a refused key gets a clear message and the form comes back", "refused the key" in msg and p.is_visible("#trStart"), msg[:80])
        st["mode"] = "429once"; st["n"] = 0; msg = go(); ok("one 'too many requests' answer is retried and the bank is made", msg.startswith("Saved") and "5 questions" in msg, msg[:100])
        ok("the key is not kept", p.input_value("#trKey") == "")
        st["mode"] = "ok"; before = st["n"]; msg = go(); ok("the same questions again: no new requests (cache)", st["n"] == before, "%d -> %d" % (before, st["n"]))
        pg.select_option("#trEngine", "gemini"); st["mode"] = "short"; msg = go("G"); ok("an AI model that returns a wrong item count is retried", msg.startswith("Saved") and len(st["gemini"]) >= 2, "%s %s" % (st["gemini"], msg[:60]))
        pg.evaluate("delete window.Translator"); pg.select_option("#trEngine", "chrome"); ok("Chrome option without the browser feature explains itself and is off", "cannot translate on the computer" in p.inner_text("#trEngineNote") and p.is_disabled("#trStart"))
        pg.evaluate("window.__MT=%s; window.Translator={availability:async()=>'available', create:async()=>({translate:async(t)=>window.__MT[t]||'HI: '+t})};0" % json.dumps(MT, ensure_ascii=False)); pg.select_option("#trEngine", "google"); pg.select_option("#trEngine", "chrome")
        msg = go(); ok("Chrome on the computer works with no key and nothing sent", msg.startswith("Saved") and not p.is_visible("#trKeyWrap"))
        p.click("#trClose"); pg.wait_for_timeout(300)
        row = p.evaluate("[...document.querySelectorAll('#libTable tr[data-bank]')].map(r=>r.children[3].textContent).filter(x=>/Translated/.test(x))")
        ok("generated banks are marked as needing review in the library", row and all("needs review" in x for x in row), str(row[:1]))
        ok("the review window lists the question that needs a check", p.is_visible('#libTable button:has-text("Review")'))
        p.click("#sbNav [data-sb=setup]"); pg.wait_for_timeout(400); p.click("#srcU"); pg.wait_for_timeout(300)
        pg.evaluate("(()=>{const s=document.getElementById('fBankPick'); const i=[...s.options].findIndex(o=>/Hindi|हिन्दी/.test(o.textContent)); s.selectedIndex=i; s.dispatchEvent(new Event('change'))})()"); pg.wait_for_timeout(400)
        ok("choosing a generated bank shows the AI reminder on the set-up page", p.is_visible("#setupAiNote"), "")
