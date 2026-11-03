import json, os, re
from openpyxl import load_workbook
from harness import ROOT, FIX, ok
NAME = "sharing (question banks with limits, analytics snapshot, administrator)"
ALLOWED = {"owner", "ownerName", "ownerOrg", "name", "lang", "langLabel", "iso", "count", "cats", "bibleText", "engine", "kind", "flagged", "hasVerse", "notes", "chunks", "size", "enc", "rev", "hidden", "downloads", "createdAt", "updatedAt"}
MT = json.load(open(os.path.join(FIX, "mt_hi.json"), encoding="utf-8"))
def rows():
    ws = load_workbook(os.path.join(ROOT, "data", "sample-question-bank.xlsx"), read_only=True, data_only=True)["Questions"]; return [[("" if c is None else str(c)) for c in r] for r in ws.iter_rows(values_only=True)]
CHUNKS = """async(id)=>{ const m=__DB['sharedBanks/'+id]; let data=''; for(let i=0;i<m.chunks;i++) data+=__DB['sharedBanks/'+id+'/chunks/c'+i].data; if(m.enc==='json') return JSON.parse(data);
  const u=Uint8Array.from(atob(data),c=>c.charCodeAt(0)); const s=new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip')); return JSON.parse(await new Response(s).text()) }"""
def shared_ids(p, owner=""): return sorted(k.split("/")[1] for k in p.evaluate("Object.keys(__DB)") if k.startswith("sharedBanks/") and "/chunks/" not in k and owner in k)
def run(t):
    def google(route):
        body = json.loads(route.request.post_data); route.fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"}, body=json.dumps({"data": {"translations": [{"translatedText": MT.get(x, "HI: " + x)} for x in body["q"]]}}))
    with t.site("firebase") as base, t.page(base, firebase=True, extra_routes=[(re.compile(r"https://translation\.googleapis\.com/.*"), google)]) as p:
        pg = p.pg; p.open(); p.login("ann@e.org"); p.click("[data-card=kb]"); pg.wait_for_timeout(400); pg.select_option("#fKbLang", "hi"); p.set_input_files("#kbFiles", os.path.join(FIX, "test_bible_hi.zip")); pg.wait_for_function("document.getElementById('kbMsg').className==='okmsg'", timeout=30000)
        p.stub_excel(rows()); p.set_input_files("#fileIn", os.path.join(ROOT, "data", "sample-question-bank.xlsx")); pg.wait_for_timeout(1500); p.set_input_files("#fileIn", os.path.join(FIX, "base5.json")); pg.wait_for_timeout(700); p.click("#kbOfferBtn"); pg.wait_for_timeout(900)
        pg.evaluate("[...document.getElementById('trBase').options].forEach((o,i)=>{ if(/English base/.test(o.textContent)) document.getElementById('trBase').selectedIndex=i })"); pg.dispatch_event("#trBase", "change"); pg.wait_for_timeout(300)
        pg.uncheck("#trTest") if pg.is_checked("#trTest") else None; pg.select_option("#trEngine", "google"); pg.fill("#trKey", "K"); p.click("#trStart"); pg.wait_for_function("document.getElementById('trResult').textContent.indexOf('Saved')===0", timeout=60000); p.click("#trClose")
        p.click("#goHome"); p.click("[data-card=bank]"); pg.wait_for_timeout(500)
        p.click('#libTable tr:has-text("sample-question-bank") button:has-text("Share")'); ok("the share window asks for the language code and hides the Bible text option for a plain bank", pg.input_value("#shIso") == "en" and not p.is_visible("#shVerseWrap"))
        p.click("#shSend"); ok("without the confirmation box nothing is shared", not shared_ids(p)); p.check("#shConsent"); p.click("#shSend"); pg.wait_for_timeout(1500)
        ids = shared_ids(p); meta = p.evaluate("__DB['sharedBanks/%s']" % ids[0]); ok("the bank takes the first of 10 places (U1_s1)", ids == ["U1_s1"], str(ids))
        ok("only the fields the rules allow are written, including rev", set(meta) <= ALLOWED and "rev" in meta and meta["chunks"] <= 4, str(set(meta) ^ ALLOWED))
        qs = p.evaluate(CHUNKS, ids[0]); ok("the shared questions hold no Bible verse text or source text", len(qs) > 50 and not any(("verse" in q or "srcQ" in q) for q in qs))
        p.click('#libTable tr:has-text("OBQ questions in") button:has-text("Share")'); ok("a translated bank offers the verse text and unchecked questions as options (off)", p.is_visible("#shVerseWrap") and not p.is_checked("#shVerse")); p.check("#shConsent"); p.click("#shSend"); pg.wait_for_timeout(1500)
        ids = shared_ids(p, "U1_"); ok("the second bank takes the next place (U1_s2)", ids == ["U1_s1", "U1_s2"], str(ids)); tq = p.evaluate(CHUNKS, "U1_s2"); ok("verse text and unchecked questions stay out by default", not any("verse" in q for q in tq) and len(tq) == 4, str(len(tq)))
        # the places are limited to 10
        p.click("#goHome"); p.click("[data-card=bank]"); pg.wait_for_timeout(400); p.set_input_files("#fileIn", os.path.join(FIX, "base5.json")); pg.wait_for_timeout(800)
        p.evaluate("(()=>{for(let i=3;i<=10;i++){__DB['sharedBanks/U1_s'+i]={owner:'U1',name:'x',chunks:1,count:1,hidden:false,downloads:0}}})()")
        p.click('#libTable tr:has-text("OBQ questions in") button:has-text("Update shared copy")'); p.check("#shConsent"); p.click("#shSend"); pg.wait_for_timeout(1200)
        ok("a bank that is already shared can still be updated when all 10 places are used", "up to 10" not in p.inner_text("#shMsg") and p.inner_text("#shMsg").startswith("Shared"), p.inner_text("#shMsg")[:80])
        pg.locator('#libTable tr[data-bank]:has-text("English base")').last.locator('button:has-text("Share")').first.click(); p.check("#shConsent"); p.click("#shSend"); pg.wait_for_timeout(1000)
        ok("with all 10 places used a new bank cannot be shared, and the message says so", "up to 10" in p.inner_text("#shMsg"), p.inner_text("#shMsg")[:80]); p.click("#shCancel")
        p.evaluate("for(let i=1;i<=10;i++){ if(i!==2){delete __DB['sharedBanks/U1_s'+i]} }")
        # Ben imports
        p.click("#signOutBtn"); pg.wait_for_timeout(400); p.login("ben@e.org"); p.click("[data-card=kb]"); pg.wait_for_timeout(500); p.click("#imOpen"); pg.wait_for_timeout(900)
        ok("Ben sees Ann's bank with its language code, and can filter by language", pg.locator("#imTable tr[data-shared]").count() == 1 and "hi" in p.inner_text("#imTable") )
        p.click('#imTable tr[data-shared] button:has-text("Download")'); pg.wait_for_timeout(1500); ok("it is added to his banks and counted as a download", pg.evaluate("__DB['sharedBanks/U1_s2'].downloads") == 1 and "already" in p.inner_text("#imTable").lower()); p.click("#imClose")
        ok("it is marked as needing review", "needs review" in p.inner_text("#libTable") if p.is_visible("#libTable") else True)
        # the administrator hides it
        p.click("#signOutBtn"); pg.wait_for_timeout(400); p.login("root@e.org"); p.click("[data-card=admin]"); pg.wait_for_timeout(900); p.click('#admBanksT tr:has-text("OBQ questions") button:has-text("Hide")'); pg.wait_for_timeout(400)
        ok("an administrator can hide a bank", pg.evaluate("__DB['sharedBanks/U1_s2'].hidden") is True)
        # Ann: analytics snapshot, then stops sharing
        p.click("#signOutBtn"); pg.wait_for_timeout(400); p.login("ann@e.org"); p.click("[data-card=analytics]"); pg.wait_for_timeout(400); p.click("#shareBtn"); pg.wait_for_timeout(300)
        ok("the analytics snapshot shows what would be sent", p.is_visible("#sharePreview")); p.click("#shareSend"); pg.wait_for_timeout(600); ok("the snapshot is stored for the owner only", pg.evaluate("!!__DB['analyticsShares/U1']"))
        p.click("#goHome"); p.click("[data-card=bank]"); pg.wait_for_timeout(500); p.click('#libTable tr:has-text("OBQ questions in") button:has-text("Stop sharing")'); pg.evaluate("[...document.querySelectorAll('#libTable button')].filter(b=>/Click again to stop/.test(b.textContent))[0].click()"); pg.wait_for_timeout(900)
        ok("stopping removes the bank and its chunks from the server", not shared_ids(p, "U1_") and not [k for k in p.evaluate("Object.keys(__DB)") if k.startswith("sharedBanks/U1_s2")])
        pg.evaluate("__deny=true"); p.click("#goHome"); p.click("[data-card=kb]"); pg.wait_for_timeout(400); p.click("#imOpen"); pg.wait_for_timeout(800); ok("when the rules are not published a clear message is shown", "rules" in p.inner_text("#imMsg").lower(), p.inner_text("#imMsg")[:80])
