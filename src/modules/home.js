/* @module {"name":"home","exports":["icon","goHomePage","showWelcome","openResults","openAnalytics","openBuilder","openAdmin","openMyQuizzes","paintHome","runDemo","openLite","wireHome"],"uses":["$","ALL_BOOKS","PANEL_ROUTE","ROUNDS_SAMPLE","S","T","VERSE_OF_THE_DAY","VERSE_OF_THE_DAY_SOURCE","VERSE_THEME_NAMES","adminLoad","bank","bankChoices","beginWith","buildPool","clear","codeOfEnglish","el","exportAnalytics","fbConfigured","finalizeRounds","goSetup","history","isAdmin","kbHas","kbList","kbLoadMerged","langInfo","langOptions","lsGet","lsSet","normName","offlineMode","onBegin","openAbout","openQmGuide","openSettings","ownConnected","paintAnalytics","paintBuilder","paintInstall","paintResults","pickLang","quizLang","refreshVoicePickers","routing","scopeCodes","setUi","setUrl","setupList","show","speechOK","startQuiz","stats","stopSpeech","stopTimer","todayISO","track","ui","useSetup","user","verseArt"]} */

  /* =====================================================================
     HOME PAGE, VERSE OF THE DAY, OBQ LITE (quick quiz) and the DEMO CONTEST
     ===================================================================== */
  var ICONS = {
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/>',
    tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2.3-.7-.7-2.3z"/>',
    book: '<path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM4 17a3 3 0 0 1 3-3h12"/>',
    text: '<path d="M4 6h16M4 10h16M4 14h10M4 18h7"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    cloud: '<path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    house: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-2 5.5-2 6 0M15 10h3M15 14h3"/>',
    logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 20h14"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  };
  function icon(name, size) { size = size || 30; return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }

  /* ---------- opening pages ---------- */
  function goHomePage() {
    stopTimer(); stopSpeech();
    if (S.edition === "basic") { if (user && user.name) openLite(); else showWelcome(); return; }          // the basic version has no Home page: its start is the quick-quiz page
    paintHome(); show("home"); setUrl("");
  }
  /* ---------- the very basic version: key in your name, set up a quick quiz, run it ---------- */
  function showWelcome() {
    $("wName").value = lsGet("qms.basicName", ""); langOptions($("wLang"), ui); $("wErr").textContent = ""; show("welcome");
    setTimeout(function () { try { $("wName").focus(); } catch (e) {} }, 50);
  }
  function welcomeGo() {
    var n = normName($("wName").value);
    if (!n) { $("wErr").textContent = T("errName"); return; }
    lsSet("qms.basicName", n); user = { email: "", name: n, org: "", country: "", usage: "", consent: false, terms: S.termsVersion }; openLite();
  }
  function openResults(panelId) {                                  // the Quiz Results page: my quiz results and my Firebase backup
    paintResults(); show("resultsPage"); setUrl(panelId === "panelOwn" ? "results/firebase" : "results");
    if (panelId) setTimeout(function () { var p = $(panelId); if (p) p.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  }
  function openAnalytics() { paintAnalytics(); show("analytics"); setUrl("analytics"); }
  function openBuilder(panelId) {
    paintBuilder(); show("dashboard"); setUrl(PANEL_ROUTE[panelId] || "builder");
    if (panelId) setTimeout(function () { var p = $(panelId); if (p) p.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  }
  function openAdmin() { show("admin"); adminLoad(); setUrl("admin"); }
  function openMyQuizzes() {                                       // "My Quizzes": the saved quizzes on the set-up page
    routing = true; goSetup(); routing = false; setUrl("my-quizzes");
    $("savedBox").hidden = false; $("savedEmpty").hidden = setupList().length > 0;
    setTimeout(function () { var p = $("savedBox"); if (p) p.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  }
  var openSaved = openMyQuizzes;

  /* ---------- Home menu: "Run a quiz", one "Quiz Builder" box with all its tools, and "Account and help" ---------- */
  var HOME_ITEMS = {
    lite:      { icon: "bolt",    t: "hLite",      d: "hLiteD",      lite: true,  go: function () { openLite(); } },
    demo:      { icon: "trophy",  t: "hDemo",      d: "hDemoD",      lite: true,  go: function () { runDemo(); } },
    setup:     { icon: "sliders", t: "hSetup",     d: "hSetupD",     lite: false, go: goSetup },
    saved:     { icon: "star",    t: "hSaved",     d: "hSavedD",     lite: false, go: openSaved },
    bank:      { icon: "book",    t: "hBank",      d: "hBankD",      lite: false, go: function () { openBuilder("panelBank"); } },
    kb:        { icon: "text",    t: "hKb",        d: "hKbD",        lite: false, go: function () { openBuilder("panelKb"); } },
    results:   { icon: "chart",   t: "hResults",   d: "hResultsD",   lite: false, go: function () { openResults(); } },
    analytics: { icon: "pulse",   t: "hAnalytics", d: "hAnalyticsD", lite: false, go: function () { openAnalytics(); } },
    firebase:  { icon: "cloud",   t: "hOwn",       d: "hOwnD",       lite: false, go: function () { openResults("panelOwn"); } },
    settings:  { icon: "gear",    t: "hSettings",  d: "hSettingsD",  lite: true,  go: function () { openSettings(); } },
    help:      { icon: "help",    t: "hHelp",      d: "hHelpD",      lite: true,  go: function () { openQmGuide(); } },
    about:     { icon: "info",    t: "hAbout",     d: "hAboutD",     lite: true,  go: function () { openAbout(); } },
    admin:     { icon: "shield",  t: "hAdmin",     d: "hAdminD",     lite: false, adminOnly: true, go: openAdmin }
  };
  var HOME_GROUPS = [
    { id: "run",     title: "hGroupRun",  items: ["lite", "demo", "setup", "saved"] },
    { id: "builder", title: "hBuilder",   desc: "hBuilderD", box: true, head: "builder", icon: "tools", headGo: function () { openBuilder(""); }, items: ["bank", "kb"] },
    { id: "results", title: "hGroupResults", desc: "hGroupResultsD", box: true, head: "resultshead", icon: "chart", headGo: function () { openResults(); }, items: ["results", "firebase"] },
    { id: "more",    title: "hGroupMore", cols: 3, items: ["analytics", "settings", "help", "about", "admin"] }
  ];
  function homeItemOK(id, li) { var it = HOME_ITEMS[id]; return !((li && !it.lite) || (it.adminOnly && !isAdmin)); }
  function homeCard(id) {
    var it = HOME_ITEMS[id], b = el("button", "cardbtn"); b.type = "button"; b.setAttribute("data-card", id); b.insertAdjacentHTML("beforeend", icon(it.icon));
    var t2 = el("span", "ctext"); t2.appendChild(el("span", "ct", T(it.t))); t2.appendChild(el("span", "cd", T(it.d))); b.appendChild(t2);
    b.addEventListener("click", it.go); return b;
  }
  function paintHomeMenu() {
    var li = S.edition === "lite", box = $("homeCards"); clear(box);
    HOME_GROUPS.forEach(function (g) {
      var ids = g.items.filter(function (id) { return homeItemOK(id, li); }); if (!ids.length) return;
      var sec = el("section", "hgroup" + (g.box ? " box" : "") + (g.cols === 3 ? " cols3" : "")); sec.setAttribute("data-group", g.id);
      if (g.box) {                                                          // all Quiz Builder tools in one box; its heading opens the Builder
        var head = el("button", "boxhead"); head.type = "button"; head.setAttribute("data-card", g.head); head.insertAdjacentHTML("beforeend", icon(g.icon));
        var tx = el("span", "ctext"); tx.appendChild(el("span", "ct", T(g.title))); tx.appendChild(el("span", "cd", T(g.desc))); head.appendChild(tx);
        head.addEventListener("click", g.headGo); sec.appendChild(head);
        var bgrid = el("div", "cards");
        ids.forEach(function (id) { bgrid.appendChild(homeCard(id)); });
        sec.appendChild(bgrid);
      } else {
        sec.appendChild(el("h3", "gtitle", T(g.title)));
        var grid = el("div", "cards");
        ids.forEach(function (id) { grid.appendChild(homeCard(id)); });
        sec.appendChild(grid);
      }
      box.appendChild(sec);
    });
  }

  /* ---------- Home: announcement, offline note, events, numbers, checklist, tip ---------- */
  function fmtDay(iso) {
    try { return new Date(iso + "T00:00:00").toLocaleDateString(langInfo(ui).locale || ui, { weekday: "short", day: "numeric", month: "short", year: "numeric" }); } catch (e) { return iso; }
  }
  function daysUntil(iso) { return Math.round((new Date(iso + "T00:00:00") - new Date(todayISO() + "T00:00:00")) / 86400000); }
  function paintAnnounce() {
    var a = S.announcement || {}, on = !!(a.title || a.text), url = /^https?:\/\//i.test(a.linkUrl || "") ? a.linkUrl : "";
    $("homeAnnounce").hidden = !on; if (!on) return;
    $("annTitle").textContent = a.title || ""; $("annDate").textContent = a.date ? fmtDay(a.date) : ""; $("annText").textContent = a.text || "";
    var l = $("annLink"); l.hidden = !url; if (url) { l.href = url; l.textContent = a.linkText || url; }
  }
  var TIPS = ["tip1", "tip2", "tip3", "tip4", "tip5", "tip6", "tip7", "tip8", "tip9", "tip10", "tip11", "tip12"];
  function paintEvents() {
    var box = $("homeEvents"); clear(box);
    if (S.edition === "lite") { box.hidden = true; return; } box.hidden = false;
    box.appendChild(el("h2", "gh", T("evTitle")));
    var grid = el("div", "evgrid"), hist = history(), st = stats(), today = todayISO();
    /* upcoming events: saved quizzes that were scheduled for a date */
    var up = setupList().filter(function (s) { return s.kind === "event" && s.cfg && s.cfg.date && s.cfg.date >= today; }).sort(function (a, b) { return String(a.cfg.date).localeCompare(String(b.cfg.date)); }).slice(0, 3);
    var c1 = el("div"); c1.appendChild(el("h3", null, T("evUpcoming")));
    if (!up.length) { c1.appendChild(el("p", "note", T("evNoUpcoming"))); var plan = el("button", "ghost sm", T("evPlan")); plan.type = "button"; plan.addEventListener("click", goSetup); c1.appendChild(plan); }
    up.forEach(function (it) {
      var c = it.cfg, n = daysUntil(c.date), row = el("div", "evitem");
      row.appendChild(el("b", null, c.event || it.name));
      row.appendChild(el("span", "when", fmtDay(c.date) + " - " + (n === 0 ? T("evToday") : (n === 1 ? T("evTomorrow") : T("evIn", { n: n })))));
      row.appendChild(el("span", "note", T("evLine", { p: c.parts || "-", lang: c.quizLangLabel || c.quizLang || "", n: c.numQ || "" })));
      var bt = el("div", "evbtns"), go = el("button", "primary sm", T("ssStart")); go.type = "button"; go.addEventListener("click", function () { useSetup(it); onBegin(); });
      var op = el("button", "ghost sm", T("ssOpen")); op.type = "button"; op.addEventListener("click", function () { useSetup(it); });
      bt.appendChild(go); bt.appendChild(op); row.appendChild(bt); c1.appendChild(row);
    });
    grid.appendChild(c1);
    /* recent finished quizzes */
    var c2 = el("div"); c2.appendChild(el("h3", null, T("evRecent")));
    if (!hist.length) c2.appendChild(el("p", "note", T("evNoRecent")));
    hist.slice(0, 3).forEach(function (r) {
      var row = el("div", "evitem"); row.appendChild(el("b", null, r.event || "-"));
      row.appendChild(el("span", "when", r.date ? fmtDay(r.date) : ""));
      row.appendChild(el("span", "note", (r.winners && r.winners.length ? T("evWinners", { w: r.winners.slice(0, 2).join(", ") }) + " - " : "") + T("evNames", { n: r.resultsCount || 0 })));
      c2.appendChild(row);
    });
    if (hist.length) { var all = el("button", "ghost sm", T("evAll")); all.type = "button"; all.addEventListener("click", function () { openResults(); }); c2.appendChild(all); }
    grid.appendChild(c2);
    /* numbers */
    var names = hist.reduce(function (n, r) { return n + (r.resultsCount || 0); }, 0), c3 = el("div"); c3.appendChild(el("h3", null, T("evGlance")));
    var tiles = el("div", "tiles");
    [[st.quizzes || 0, "aQuizzes"], [hist.length, "aFinished"], [st.participants || 0, "aParts"], [st.questions || 0, "aQs"]].forEach(function (x) {
      var t = el("div", "tile"); t.appendChild(el("b", null, String(x[0]))); t.appendChild(el("span", null, T(x[1]))); tiles.appendChild(t);
    });
    c3.appendChild(tiles); grid.appendChild(c3); box.appendChild(grid);
    /* getting started: until every step is done */
    var steps = [["ck1", !!lsGet("qms.demoDone", false), function () { runDemo(); }], ["ck2", bankChoices().some(function (b) { return b.kind !== "builtin"; }) || kbList().length > 0, function () { openBuilder("panelBank"); }],
                 ["ck3", hist.length > 0, function () { goSetup(); }], ["ck4", (st.pdfs || 0) > 0 || !!lsGet("qms.csvDone", false), function () { openResults(); }]];
    if (steps.some(function (s) { return !s[1]; })) {
      var ck = el("div", "checklist"); ck.appendChild(el("b", null, T("ckTitle")));
      steps.forEach(function (s) {
        var chip = el("button", "ck" + (s[1] ? " done" : "")); chip.type = "button"; chip.textContent = (s[1] ? "\u2713 " : "\u25CB ") + T(s[0]);
        if (!s[1]) chip.addEventListener("click", s[2]); ck.appendChild(chip);
      });
      box.appendChild(ck);
    }
    var d = new Date(); box.appendChild(el("p", "tip", T("tipLabel") + " " + T(TIPS[Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) % TIPS.length])));
  }
  function paintHome() {
    $("homeWelcome").textContent = T("homeWelcome", { name: (user && user.name) || "" });
    paintAnnounce(); paintHomeMenu(); paintEvents();
    var off = $("homeOffline"); off.hidden = !(offlineMode && fbConfigured()); off.textContent = off.hidden ? "" : T("homeOffline");
    paintInstall(); $("goDash").hidden = S.edition === "lite"; $("goQuizzes").hidden = $("goResults").hidden = S.edition === "lite"; $("homeLogo").hidden = $("logo").hidden; if (!$("logo").hidden) $("homeLogo").src = $("logo").src;
    paintVerse();
  }

  /* ---------- Verse of the Day ---------- */
  var votdOffset = 0, votdCache = {};
  function votdIndex() { var d = new Date(); return (Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) + votdOffset) % VERSE_OF_THE_DAY.length; }
  function kbVerse(books, code, ch, v1, v2) {
    var bk = books[code]; if (!bk) return null;
    var parts = [], n;
    for (n = v1; n <= v2; n++) {
      var hit = bk.v.filter(function (x) { return x[0] === ch && parseInt(x[1], 10) === n; })[0];
      if (!hit) return null; parts.push(hit[2]);
    }
    return parts.join(" ");
  }
  function showVerse(text, ref, src) { $("votdText").textContent = text; $("votdRef").textContent = ref; $("votdSrc").textContent = src ? " - " + src : ""; $("votdBox").classList.toggle("rtl", /[\u0590-\u08FF]/.test(text)); }
  function paintVerseArt(theme) {                                   // the picture that goes with the verse (the owner can supply own images in "verseImages")
    var box = $("votdArt"), own = S.verseImages && S.verseImages[theme];
    box.innerHTML = own ? '<img alt="" src="' + String(own).replace(/"/g, "&quot;") + '">' : verseArt(theme);
    box.setAttribute("aria-label", VERSE_THEME_NAMES[theme] || "");
  }
  function paintVerse() {
    var v = VERSE_OF_THE_DAY[votdIndex()], ref = v[0] + " " + v[1] + ":" + v[2] + (v[3] > v[2] ? "-" + v[3] : "");
    paintVerseArt(v[5] || "sunrise");
    showVerse("\u201C" + v[4] + "\u201D", ref, VERSE_OF_THE_DAY_SOURCE);
    if (!kbList().some(function (m) { return m.lang === ui; })) return;                          // a Bible text in the interface language: show the verse from it
    var idx = votdIndex(), key = ui + "|" + idx, code = codeOfEnglish(v[0]), meta = kbList().filter(function (m) { return m.lang === ui; })[0];
    function put(hit) {
      if (!hit || votdIndex() !== idx) return;
      var shown = ((hit.book && hit.book.n) || v[0]) + " " + v[1] + ":" + v[2] + (v[3] > v[2] ? "-" + v[3] : "");
      showVerse("\u201C" + hit.text + "\u201D", shown, meta.name);
    }
    if (votdCache[key] !== undefined) { put(votdCache[key]); return; }
    kbLoadMerged(ui).then(function (books) {
      var t = kbVerse(books, code, v[1], v[2], v[3]); votdCache[key] = t ? { text: t, book: books[code] } : null; put(votdCache[key]);
    }).catch(function () {});
  }

  /* ---------- Demo contest: the 10-question sample, one tap ---------- */
  function runDemo() {
    var c = { qm: (user && user.name) || "", event: T("srcSample"), date: todayISO(), parts: 1, uiLang: ui, quizLang: "en", quizLangLabel: "English", mode: "individual", style: "normal",
              scope: "any", books: [], numQ: ROUNDS_SAMPLE.length, source: "sample", sample: true, saveResults: false };
    quizLang = "en"; track("sample_quiz"); lsSet("qms.demoDone", true);
    startQuiz(c, finalizeRounds(JSON.parse(JSON.stringify(ROUNDS_SAMPLE))));
  }

  /* ---------- OBQ Lite: a quick quiz in Simple style with almost no setup ---------- */
  var lite = { mode: "individual", numQ: 0, langPick: "en" };
  function liteCfg() {
    var lp = pickLang("lLang", "lOther"), part = $("lPart").value, preset = part === "bible" || part === "nt" || part === "ot";
    var c = { qm: (user && user.name) || "", event: normName($("lName").value) || T("liteDefaultName"), date: todayISO(), parts: 0, uiLang: ui, quizLang: lp.val, quizLangLabel: lp.label,
              mode: lite.mode, style: "simple", scope: preset ? part : "b1", books: preset ? [] : [part], numQ: lite.numQ, source: "", sample: false, saveResults: ownConnected(), lite: true, readAloud: speechOK && $("lRead").checked };
    if (!lp.val) c.source = "";
    else if (c.quizLang === "en" && S.builtInBank) c.source = "builtin";
    else if (kbList().some(function (m) { return m.lang === c.quizLang; })) c.source = "kb";
    else if (bank.some(function (q) { return q.lang === c.quizLang || q.lang === ""; })) c.source = "bank";
    return c;
  }
  function paintLite() {
    if (!lite.numQ) lite.numQ = S.questionCounts[0];
    if (S.edition === "basic") { lite.langPick = "en"; }
    langOptions($("lLang"), lite.langPick, true); $("lOtherWrap").hidden = $("lLang").value !== "other";
    var ps = $("lPart"), pv = ps.value || "bible"; clear(ps);
    [["bible", "scBible"], ["nt", "scNT"], ["ot", "scOT"]].forEach(function (p) { var o = el("option", null, T(p[1])); o.value = p[0]; ps.appendChild(o); });
    var sep = el("option", null, "- " + T("liteOneBook") + " -"); sep.disabled = true; ps.appendChild(sep);
    ALL_BOOKS.forEach(function (b) { var o = el("option", null, b); o.value = b; ps.appendChild(o); });
    ps.value = pv;
    var qc = $("lCounts"); clear(qc);
    S.questionCounts.forEach(function (n) {
      var b = el("button", null, String(n)); b.type = "button"; b.setAttribute("aria-pressed", n === lite.numQ ? "true" : "false");
      b.addEventListener("click", function () { lite.numQ = n; paintLite(); }); qc.appendChild(b);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".mode[data-lmode]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lmode") === lite.mode ? "true" : "false"); });
    $("lReadWrap").hidden = !speechOK; refreshVoicePickers();
    if (S.edition === "basic") {                                      // English quick quiz only, no voice picker, and the button goes back to the name page
      $("liteWho").hidden = false; $("liteWho").textContent = T("liteWho", { name: (user && user.name) || "" });
      $("lLangField").hidden = true; $("lOtherWrap").hidden = true; $("lVoiceWrap").hidden = true; $("liteHome").textContent = T("basicChange");
    }
    liteAvail();
  }
  function liteAvail() {
    var c = liteCfg(), t = $("liteAvail"); $("liteErr").textContent = ""; t.textContent = "";
    if (!c.quizLang) return;
    if (!c.source) { t.textContent = T("liteNone"); return; }
    if (c.source === "kb") { var have = scopeCodes(c).filter(function (code) { return kbHas(c.quizLang, code); }); t.textContent = have.length ? T("kbAvail", { n: have.length }) : T("kbNone"); return; }
    var n = buildPool(c).length; t.textContent = n ? T("avail", { n: n }) : T("availNone");
  }
  function openLite() { paintLite(); show("lite"); setUrl("quick-quiz"); }
  function liteStart() {
    var c = liteCfg(), box = $("liteErr");
    if (!c.quizLang) { box.textContent = T("errOtherLang"); return; }
    if (!c.source) { box.textContent = T("liteNone"); return; }
    box.textContent = ""; beginWith(c, box, true);
  }
  function wireHome() {
    Array.prototype.forEach.call(document.querySelectorAll(".jumpnav [data-jump]"), function (b) {
      b.addEventListener("click", function () { var p = $(b.getAttribute("data-jump")); if (p) p.scrollIntoView({ behavior: "smooth", block: "start" }); });
    });
    $("votdNext").addEventListener("click", function () { votdOffset++; paintVerse(); });
    $("lLang").addEventListener("change", function () { lite.langPick = $("lLang").value; $("lOtherWrap").hidden = lite.langPick !== "other"; liteAvail(); });
    $("lOther").addEventListener("input", liteAvail); $("lPart").addEventListener("change", liteAvail);
    Array.prototype.forEach.call(document.querySelectorAll(".mode[data-lmode]"), function (b) { b.addEventListener("click", function () { lite.mode = b.getAttribute("data-lmode"); paintLite(); }); });
    $("bSetupBtn").addEventListener("click", goSetup); $("resHome").addEventListener("click", goHomePage); $("anHome").addEventListener("click", goHomePage); $("resAnalytics").addEventListener("click", openAnalytics); $("anPdf").addEventListener("click", exportAnalytics);
    $("liteStart").addEventListener("click", liteStart); $("liteHome").addEventListener("click", function () { if (S.edition === "basic") showWelcome(); else goHomePage(); });
    $("wGo").addEventListener("click", welcomeGo); $("wName").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); welcomeGo(); } });
    $("wLang").addEventListener("change", function () { setUi($("wLang").value); });
  }
