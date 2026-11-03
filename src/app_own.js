
  /* =====================================================================
     RESULTS: history on this device, CSV download, export to the Quiz Master's OWN Firebase
     USAGE:   OBQ's own cloud only counts that a quiz was set up (no points, no names)
     ADMIN:   usage overview for admin accounts
     ===================================================================== */
  var curRecord = null, ownApp = null, isAdmin = false;

  /* ---------- CSV ---------- */
  function csvCell(v) {
    v = String(v == null ? "" : v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;                         // stops spreadsheet formulas typed as names from running
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function toCsv(rows) { return "\uFEFF" + rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n") + "\r\n"; }
  function downloadCsv(name, rows) {
    if (/^obq-results/.test(name)) lsSet("qms.csvDone", true);
    return saveFile(name, new TextEncoder().encode(toCsv(rows)), "text/csv;charset=utf-8");
  }
  function resultsRows(records) {
    var rows = [["Event", "Date", "Quiz Master", "Organisation", "Quiz language", "Scope", "Mode", "Question source", "Participants", "Questions", "Rank", "Name", "Points"]];
    records.forEach(function (r) {
      var base = [r.event, r.date, r.qm, r.org, r.quizLang, r.scope === "b1" || r.scope === "b2" || r.scope === "b3" || r.scope === "bmore" ? (r.books || []).join("; ") : r.scope, r.mode, r.source, r.participants, r.numQuestions];
      if (!r.results.length) rows.push(base.concat(["", "", ""]));
      r.results.forEach(function (x) { rows.push(base.concat([x.rank, x.name, x.points])); });
    });
    return rows;
  }
  function csvName(prefix, rec) { var slug = rec ? String(rec.event || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) : ""; return prefix + (slug ? "-" + slug : "") + "-" + (rec ? rec.date : todayISO()) + ".csv"; }

  /* ---------- history of finished quizzes (this device) ---------- */
  function histKey() { return "qms.history." + ekey(); }
  function history() { return lsGet(histKey(), []); }
  function saveHistory(h) { lsSet(histKey(), h.slice(0, 200)); }
  function makeRecord(list, mins) {
    var c = cfg;
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), event: c.event, qm: c.qm, org: (user && user.org) || "", date: c.date, participants: c.parts,
      quizLang: c.quizLangLabel || c.quizLang, scope: c.scope, books: c.books || [], mode: c.mode, source: c.source, uiLang: c.uiLang,
      numQuestions: ROUNDS.length, requested: c.numQ, minutes: mins, resultsCount: list.length,
      results: list.slice(0, 300).map(function (x) { return { rank: x.rank, name: x.name, points: x.total }; }),
      winners: list.filter(function (x) { return x.rank === 1; }).map(function (x) { return x.name; }).slice(0, 20), completedAt: new Date().toISOString(), sent: false
    };
  }
  function addHistory(rec) { var h = history(); h.unshift(rec); saveHistory(h); }
  function markSent(id) { var h = history(); h.forEach(function (r) { if (r.id === id) r.sent = true; }); saveHistory(h); }

  /* ---------- the Quiz Master's own Firebase ---------- */
  function ownKey() { return "qms.ownfb." + ekey(); }
  function ownConfig() { return lsGet(ownKey(), null); }
  function ownConnected() { return !!(user && ownConfig()); }
  var OWN_KEYS = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId", "measurementId"];
  function parseFbConfig(text) {
    var out = {}, j = null;
    try { j = JSON.parse(text); if (j && j.firebaseConfig) j = j.firebaseConfig; } catch (e) {}
    if (j && typeof j === "object") OWN_KEYS.forEach(function (k) { if (j[k]) out[k] = String(j[k]); });
    if (!out.apiKey) OWN_KEYS.forEach(function (k) { var m = new RegExp(k + "[\"']?\\s*:\\s*[\"']([^\"']+)[\"']").exec(text); if (m) out[k] = m[1]; });
    return (out.apiKey && out.projectId && out.appId) ? out : null;
  }
  function ensureSdk() {
    if (window.firebase && window.firebase.firestore && window.firebase.auth) return Promise.resolve();
    var base = "https://www.gstatic.com/firebasejs/" + S.firebaseSdkVersion + "/";
    return loadScript(base + "firebase-app-compat.js").then(function () { return Promise.all([loadScript(base + "firebase-auth-compat.js"), loadScript(base + "firebase-firestore-compat.js")]); });
  }
  function ownInit(conf) {
    return ensureSdk().then(function () {
      var f = window.firebase, old = f.apps.filter(function (a) { return a.name === "qm"; })[0];
      return (old ? old.delete() : Promise.resolve()).then(function () {
        ownApp = f.initializeApp(conf, "qm");
        return ownApp.auth().signInAnonymously().then(function () { return true; }, function () { return false; });   // anonymous sign-in is recommended, not required
      });
    });
  }
  var OWN_RULES = "rules_version = '2';\nservice cloud.firestore {\n  match /databases/{db}/documents {\n    match /obq_results/{id} {\n      allow create: if request.auth != null\n        && request.resource.data.sentAt == request.time\n        && request.resource.data.results.size() <= 300;\n      allow read, update, delete: if false;   // read them in the Firebase console, or change this if you build your own viewer\n    }\n  }\n}\n";
  function sendRecord(rec) {
    var msg = $("exportMsg");
    var conf = ownConfig(); if (!conf) return Promise.resolve();
    msg.textContent = "...";
    return (ownApp ? Promise.resolve() : ownInit(conf)).then(function () {
      var doc = {}, f = window.firebase;
      ["event", "qm", "org", "date", "participants", "quizLang", "scope", "books", "mode", "source", "uiLang", "numQuestions", "requested", "minutes", "resultsCount", "results", "winners", "completedAt"].forEach(function (k) { doc[k] = rec[k]; });
      doc.sentAt = f.firestore.FieldValue.serverTimestamp();
      return ownApp.firestore().collection("obq_results").add(doc);
    }).then(function () {
      markSent(rec.id); rec.sent = true; msg.textContent = T("resSaved"); $("saveCloud").hidden = true; track("results_sent", { rows: rec.results.length }); paintHistory();
    }, function (e) {
      msg.textContent = (e && /script|load/i.test(e.message || "")) ? T("ownSdkErr") : T("resFail"); if (curRecord === rec) $("saveCloud").hidden = false;
    });
  }
  function connectOwn() {
    var st = $("ownMsg"), conf = parseFbConfig($("fOwnCfg").value);
    if (!conf) { st.className = "err"; st.textContent = T("ownBad"); return; }
    st.className = "note"; st.textContent = "...";
    ownInit(conf).then(function (anon) {
      lsSet(ownKey(), conf); st.className = "okmsg"; st.textContent = T("ownOk", { p: conf.projectId }) + (anon ? "" : "  " + T("ownNoAnon"));
      $("fOwnCfg").value = ""; track("own_firebase_connected", {}); paintOwn();
    }).catch(function () { st.className = "err"; st.textContent = T("ownSdkErr"); });
  }
  function disconnectOwn() { lsDel(ownKey()); if (ownApp) { try { ownApp.delete(); } catch (e) {} ownApp = null; } $("ownMsg").textContent = ""; paintOwn(); }
  function paintOwn() {
    var c = ownConfig();
    $("ownStatus").textContent = c ? T("ownOk", { p: c.projectId }) : T("ownNone");
    $("ownConnect").hidden = !!c; $("fOwnCfg").hidden = !!c; $("ownFileBtn").hidden = !!c; $("ownDisconnect").hidden = !c;
    $("ownRules").textContent = OWN_RULES;
    $("saveResWrap").hidden = !(user && c);
    paintHistory();
  }
  function paintHistory() {
    var box = $("histList"); clear(box);
    var h = history(); $("histAll").hidden = !h.length;
    if (!h.length) { box.appendChild(el("p", "note", T("histEmpty"))); return; }
    h.slice(0, 30).forEach(function (r) {
      var row = el("div", "kbrow");
      row.appendChild(el("div", "kbname", r.event + "  -  " + fmtDate(r.date)));
      row.appendChild(el("div", "note", T("histLine", { n: r.resultsCount, w: r.winners.join(", ") || "-", q: r.numQuestions }) + (r.sent ? "  -  " + T("histSent") : "")));
      var act = el("div", "row"), csv = el("button", "ghost sm", "CSV"); csv.type = "button";
      csv.addEventListener("click", function () { downloadCsv(csvName("obq-results", r), resultsRows([r])); });
      act.appendChild(csv);
      if (ownConnected() && !r.sent) { var sd = el("button", "ghost sm", T("saveCloud")); sd.type = "button"; sd.addEventListener("click", function () { sendRecord(r).then(paintHistory); }); act.appendChild(sd); }
      var del = el("button", "ghost sm", T("ssDelete")), armed = null; del.type = "button";
      del.addEventListener("click", function () {
        if (!armed) { armed = setTimeout(function () { armed = null; del.textContent = T("ssDelete"); }, 4000); del.textContent = T("ssSure"); return; }
        clearTimeout(armed); saveHistory(history().filter(function (x) { return x.id !== r.id; })); paintHistory();
      });
      act.appendChild(del); row.appendChild(act); box.appendChild(row);
    });
  }

  /* ---------- usage counting in OBQ's own cloud: setup information only ---------- */
  function recordUsage(c, n) {
    if (!(fb.on && user && user.uid) || c.sample) return;
    try {
      var slotKey = "qms.usageSlot." + user.uid, slot = (parseInt(lsGet(slotKey, 0), 10) || 0) % 400; lsSet(slotKey, slot + 1);                  // a ring of 400 records per user (the database rules say the same)
      fb.db.collection("usage").doc(user.uid + "_" + slot).set({
        uid: user.uid, event: c.event, qm: c.qm, org: user.org || "", date: c.date, participants: c.parts, quizLang: c.quizLangLabel || c.quizLang, scope: c.scope,
        books: c.books || [], mode: c.mode, source: c.source, uiLang: c.uiLang, numQuestions: n, startedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- admin screen (only for accounts listed in the "admins" collection) ---------- */
  var admUsage = [], admUsers = [], admShares = [], admContact = [], admBanks = [];
  function checkAdmin() {
    isAdmin = false; $("goAdmin").hidden = true;
    if (!(fb.on && user && user.uid)) return;
    fb.db.collection("admins").doc(user.uid).get().then(function (d) { isAdmin = !!(d && d.exists); $("goAdmin").hidden = !isAdmin || S.edition === "lite"; if ($("sidebar") && !$("sidebar").hidden) buildSidebar(); if ($("home").classList.contains("active")) paintHome(); }).catch(function () {});
  }
  function tsOf(v) { try { return v && v.toDate ? v.toDate() : (v ? new Date(v) : null); } catch (e) { return null; } }
  function iso(v) { var d = tsOf(v); return d ? d.toISOString().replace("T", " ").slice(0, 16) : ""; }
  function adminLoad() {
    var msg = $("adminMsg"); msg.className = "note"; msg.textContent = "...";
    Promise.all([fb.db.collection("usage").orderBy("startedAt", "desc").limit(1000).get(), fb.db.collection("quizMasters").limit(1000).get(),
      fb.db.collection("analyticsShares").orderBy("sharedAt", "desc").limit(500).get().catch(function () { return { docs: [] }; }),
      fb.db.collection("contactMessages").orderBy("createdAt", "desc").limit(300).get().catch(function () { return { docs: [] }; }),
      fb.db.collection("sharedBanks").orderBy("updatedAt", "desc").limit(300).get().catch(function () { return { docs: [] }; })]).then(function (res) {      // the shares are optional: the page still works if their rule is not published yet
      admUsage = res[0].docs.map(function (d) { return d.data(); }); admUsers = res[1].docs.map(function (d) { return d.data(); }); admShares = res[2].docs.map(function (d) { return d.data(); }); admContact = res[3].docs.map(function (d) { return d.data(); }); admBanks = res[4].docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      msg.textContent = "";
      var cut = Date.now() - 30 * 86400000, recent = admUsage.filter(function (u) { var t = tsOf(u.startedAt); return t && t.getTime() >= cut; }), act = {};
      recent.forEach(function (u) { act[u.uid] = 1; });
      var sb = $("adminStats"); clear(sb);
      [["admStatQM", admUsers.length], ["admStatSetups", admUsage.length], ["admStat30", recent.length], ["admStatActive", Object.keys(act).length], ["admStatShares", admShares.length], ["admStatBanks", admBanks.length]].forEach(function (p) {
        var d = el("div", "stat"); d.appendChild(el("b", null, String(p[1]))); d.appendChild(document.createTextNode(T(p[0]))); sb.appendChild(d);
      });
      fillTable($("admUsage"), ["Started", "Event", "Quiz Master", "Organisation", "Date", "Participants", "Language", "Scope", "Questions"],
        admUsage.slice(0, 50).map(function (u) { return [iso(u.startedAt), u.event, u.qm, u.org, u.date, u.participants, u.quizLang, u.scope, u.numQuestions]; }));
      fillTable($("admSharesT"), SHARE_HEAD, admShares.slice(0, 100).map(shareRow));
      fillTable($("admContactT"), CONTACT_HEAD, admContact.slice(0, 100).map(contactRow)); paintAdminBanks(admBanks);
      fillTable($("admUsersT"), ["Name", "Email", "Organisation", "Country", "Logins", "Last login", "Joined"],
        admUsers.slice(0, 100).map(function (u) { return [u.name, u.email, u.org, u.country, u.loginCount || 0, iso(u.lastLoginAt), iso(u.createdAt)]; }));
    }).catch(function () { msg.className = "err"; msg.textContent = T("admNoAccess"); });
  }
  var SHARE_HEAD = ["Shared at", "Name", "Organisation", "Country", "Quizzes run", "Finished", "Participants", "Languages", "Questions asked", "PDFs", "Names on lists", "Questions in own bank", "Built-in questions", "Bible texts", "Bible books", "Interface language", "App version"];
  function shareRow(u) { return [iso(u.sharedAt), u.name, u.org, u.country, u.quizzes, u.finished, u.participants, (u.languages || []).join("; "), u.questions, u.pdfs, u.names, u.bankMine, u.bankBuiltin, u.kbTexts, u.kbBooks, u.uiLang, u.appVersion]; }
  var CONTACT_HEAD = ["Received", "Name", "Email", "Organisation", "Country", "Topic", "Message", "Interface language", "App version"];
  function contactRow(u) { return [iso(u.createdAt), u.name, u.email, u.org, u.country, u.topic, u.message, u.uiLang, u.appVersion]; }
  function fillTable(tb, head, rows) {
    clear(tb); var hr = el("tr"); head.forEach(function (h) { hr.appendChild(el("th", null, h)); }); tb.appendChild(hr);
    rows.forEach(function (r) { var tr = el("tr"); r.forEach(function (c) { tr.appendChild(el("td", null, c == null ? "" : String(c))); }); tb.appendChild(tr); });
  }
  function selectRules() {           // clipboard blocked: select the text so Ctrl+C / long-press works
    var r = document.createRange(), s = window.getSelection(); r.selectNodeContents($("guideRules")); s.removeAllRanges(); s.addRange(r);
    $("guideCopied").textContent = "Selected: press Ctrl+C (or long-press, Copy).";
  }
  /* ---------- optional: share a snapshot of my analytics with the developers (the OBQ Firebase project) ---------- */
  function shareSnapshot() {
    var st = stats(), hist = history();
    return { uid: user.uid, name: user.name || "", org: user.org || "", country: user.country || "", quizzes: st.quizzes || 0, finished: hist.length, participants: st.participants || 0,
      languages: (st.langs || []).slice(0, 40), questions: st.questions || 0, pdfs: st.pdfs || 0, names: hist.reduce(function (n, r) { return n + (r.resultsCount || 0); }, 0),
      bankMine: bankChoices().reduce(function (n, b) { return b.kind === "builtin" ? n : n + b.count; }, 0), bankBuiltin: starter().length, kbTexts: kbList().length, kbBooks: kbList().reduce(function (n, m) { return n + Object.keys(m.books || {}).length; }, 0), uiLang: ui, appVersion: S.appVersion || "" };
  }
  function shareKey() { return "qms.sharedAt." + (user && user.uid); }
  function paintShare() {
    var ok = !!(fb.on && user && user.uid), at = ok ? lsGet(shareKey(), "") : "", m = $("shareMsg");
    $("shareBtn").disabled = !ok; $("shareWithdraw").hidden = !at; $("sharePreview").hidden = true; m.className = "note";
    m.textContent = !ok ? T("shareNeedOnline") : (at ? T("shareLast", { date: String(at).replace("T", " ").slice(0, 16) }) : "");
  }
  function shareStart() {
    var d = shareSnapshot(), ul = $("shareList"); clear(ul);
    [["shName", d.name], ["shOrg", d.org || "-"], ["shCountry", d.country || "-"], ["aQuizzes", d.quizzes], ["aFinished", d.finished], ["aParts", d.participants], ["aLangs", d.languages.length ? d.languages.join(", ") : "0"],
     ["aQs", d.questions], ["aPdf", d.pdfs], ["aPeople", d.names], ["aBankMine", d.bankMine], ["aBankBuilt", d.bankBuiltin], ["aKbTexts", d.kbTexts], ["aKbBooks", d.kbBooks]].forEach(function (p) {
      ul.appendChild(el("li", null, T(p[0]) + ": " + p[1]));
    });
    $("sharePreview").hidden = false; $("shareMsg").textContent = ""; $("shareSend").disabled = false;
  }
  function shareSend() {
    if (!(fb.on && user && user.uid)) return;
    var d = shareSnapshot(), m = $("shareMsg"); d.sharedAt = window.firebase.firestore.FieldValue.serverTimestamp(); $("shareSend").disabled = true;
    fb.db.collection("analyticsShares").doc(user.uid).set(d).then(function () {
      lsSet(shareKey(), new Date().toISOString()); paintShare(); $("shareMsg").className = "okmsg"; $("shareMsg").textContent = T("shareDone"); track("analytics_shared", {});
    }).catch(function () { $("shareSend").disabled = false; m.className = "err"; m.textContent = T("shareFail"); });
  }
  function shareWithdraw() {
    if (!(fb.on && user && user.uid)) return; var m = $("shareMsg");
    fb.db.collection("analyticsShares").doc(user.uid).delete().then(function () { lsDel(shareKey()); paintShare(); $("shareMsg").className = "okmsg"; $("shareMsg").textContent = T("shareWithdrawn"); })
      .catch(function () { m.className = "err"; m.textContent = T("shareFail"); });
  }
  function openQmGuide() { show("qmguide"); setUrl("instructions"); }
  /* the "Set up your own Firebase" page: its Back button returns to where it was opened from (Quiz Results, or the instructions) */
  var ownGuideFrom = "results";
  function openOwnGuide(from) {
    ownGuideFrom = from === "instructions" ? "instructions" : "results";
    $("guideRules").textContent = OWN_RULES; $("guideCopied").textContent = "";
    ["guideBack", "guideBack2"].forEach(function (id) { $(id).textContent = T(ownGuideFrom === "instructions" ? "back2guide" : "back2results"); });
    show("ownguide"); setUrl("firebase-help");
  }
  function wireGuide() {
    $("goHelp").addEventListener("click", openQmGuide); $("qmGuideBtn").addEventListener("click", openQmGuide);
    $("qmHome").addEventListener("click", goHomePage); $("qmHome2").addEventListener("click", goHomePage);
    Array.prototype.forEach.call(document.querySelectorAll("#qmguide [data-open=ownguide]"), function (b) { b.addEventListener("click", function () { openOwnGuide("instructions"); }); });
    Array.prototype.forEach.call(document.querySelectorAll("#qmguide [data-goto]"), function (b) {
      b.addEventListener("click", function () { var t = $(b.getAttribute("data-goto")); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); });
    });
  }
  function wireOwn() {
    wireGuide();
    $("shareBtn").addEventListener("click", shareStart); $("shareSend").addEventListener("click", shareSend); $("shareCancel").addEventListener("click", function () { $("sharePreview").hidden = true; }); $("shareWithdraw").addEventListener("click", shareWithdraw);
    $("ownConnect").addEventListener("click", connectOwn); $("ownDisconnect").addEventListener("click", disconnectOwn);
    $("ownFileBtn").addEventListener("click", function () { $("ownFile").click(); });
    $("ownFile").addEventListener("change", function () {
      var f = $("ownFile").files && $("ownFile").files[0]; if (!f) return;
      readFileBuf(f).then(function (b) { $("fOwnCfg").value = u8text(new Uint8Array(b)); connectOwn(); $("ownFile").value = ""; });
    });
    $("ownHelp").addEventListener("click", function () { openOwnGuide("results"); });
    ["guideBack", "guideBack2"].forEach(function (id) { $(id).addEventListener("click", function () { if (ownGuideFrom === "instructions") openQmGuide(); else openResults(); }); });
    $("guideHome").addEventListener("click", goHomePage);
    $("guideCopy").addEventListener("click", function () {
      var done = function () { $("guideCopied").textContent = T("guideCopied"); };
      try { navigator.clipboard.writeText(OWN_RULES).then(done, function () { selectRules(); }); } catch (e) { selectRules(); }
    });
    $("histAll").addEventListener("click", function () { downloadCsv(csvName("obq-results-all", null), resultsRows(history())); });
    $("csvBtn").addEventListener("click", function () { if (curRecord) downloadCsv(csvName("obq-results", curRecord), resultsRows([curRecord])); });
    $("saveCloud").addEventListener("click", function () { if (curRecord) sendRecord(curRecord); });
    $("goAdmin").addEventListener("click", function () { openAdmin(); });
    $("adminBack").addEventListener("click", goHomePage); $("adminRefresh").addEventListener("click", adminLoad);
    $("admUsageCsv").addEventListener("click", function () {
      downloadCsv("obq-usage-" + todayISO() + ".csv", [["Started", "Event", "Quiz Master", "Organisation", "Date", "Participants", "Quiz language", "Scope", "Books", "Mode", "Source", "Questions"]].concat(
        admUsage.map(function (u) { return [iso(u.startedAt), u.event, u.qm, u.org, u.date, u.participants, u.quizLang, u.scope, (u.books || []).join("; "), u.mode, u.source, u.numQuestions]; })));
    });
    $("admContactCsv").addEventListener("click", function () { downloadCsv("obq-contact-messages-" + todayISO() + ".csv", [CONTACT_HEAD].concat(admContact.map(contactRow))); });
    $("admSharesCsv").addEventListener("click", function () { downloadCsv("obq-shared-analytics-" + todayISO() + ".csv", [SHARE_HEAD].concat(admShares.map(shareRow))); });
    $("admUsersCsv").addEventListener("click", function () {
      downloadCsv("obq-quiz-masters-" + todayISO() + ".csv", [["Name", "Email", "Organisation", "Country", "Main use", "Logins", "Last login", "Joined"]].concat(
        admUsers.map(function (u) { return [u.name, u.email, u.org, u.country, u.usage, u.loginCount || 0, iso(u.lastLoginAt), iso(u.createdAt)]; })));
    });
  }
