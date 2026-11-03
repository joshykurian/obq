
  /* ---------- saving files (PDF, Excel template) ---------- */
  function saveFile(name, bytes, mime) {
    var viaClaude = (window.claude && window.claude.use) ? window.claude.use("downloads") : Promise.resolve(null);
    return viaClaude.then(function (dl) {
      if (dl) {
        return dl.save({ filename: name, data: bytes.buffer.slice(0) }).then(
          function () { return true; },
          function (err) { if (err && err.code === "declined") return false; throw err; }
        );
      }
      var blob = new Blob([bytes], { type: mime }), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
      return true;
    });
  }

  /* ---------- question bank (kept per Quiz Master) ---------- */
  function ekey() { return (user && user.email) ? user.email.toLowerCase() : "guest"; }
  function bankKey() { return "qms.bank." + ekey(); }
  function loadBank() { bank = lsGet(bankKey(), []); }
  function saveBank() { lsSet(bankKey(), bank); fbSaveBank(); }
  function fbDoc() { return fb.db.collection("quizMasters").doc(user.uid).collection("banks").doc("main"); }
  function fbSaveBank() {
    if (!(fb.on && user && user.uid)) return;
    try { fbDoc().set({ rows: JSON.stringify(bank), count: bank.length, updated: window.firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {}); } catch (e) {}
  }
  function fbLoadBank() {
    if (!(fb.on && user && user.uid) || bank.length) return;
    try {
      fbDoc().get().then(function (d) {
        if (d && d.exists) {
          var rows = JSON.parse(d.data().rows || "[]");
          if (rows.length && !bank.length) { bank = rows; lsSet(bankKey(), bank); paintBankInfo(); if ($("dashboard").classList.contains("active")) paintDashboard(); }
        }
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- reading the Excel / CSV question bank ---------- */
  var HEAD_ALIASES = {
    lang: ["language", "quiz language"], book: ["book", "topic", "book / topic"], cat: ["category", "question type", "type"], level: ["level", "tag", "difficulty"], q: ["question"],
    oa: ["option a"], ob: ["option b"], oc: ["option c"], od: ["option d"],
    c1: ["clue 1"], c2: ["clue 2"], c3: ["clue 3"], c4: ["clue 4"], c5: ["clue 5"],
    ans: ["correct answer", "answer"], ref: ["reference", "ref"], info: ["more to know", "info", "note"],
    pts: ["points"], secs: ["seconds", "timer"], intro: ["intro", "intro (multi-part)"]
  };
  function mapHeaders(row) {
    var idx = {}, k;
    Object.keys(HEAD_ALIASES).forEach(function (key) { idx[key] = -1; });
    row.forEach(function (c, i) {
      var h = normName(c).toLowerCase().replace(/\s*\(.*\)\s*$/, "");
      for (k in HEAD_ALIASES) if (idx[k] < 0 && HEAD_ALIASES[k].indexOf(h) > -1) { idx[k] = i; break; }
    });
    return idx;
  }
  function catFrom(v) {
    v = normName(v).toLowerCase();
    if (!v) return null;
    if (/part/.test(v)) return "multi";
    if (/video/.test(v)) return "video";                         // no longer supported: reported when a file is uploaded
    if (/one\s*word|short|hint/.test(v)) return "oneword";
    if (/multi|mcq|option|choice/.test(v)) return "mc";
    if (/clue|who/.test(v)) return "clue";
    if (/one|single|answer|quick|regular/.test(v)) return "one";
    return null;
  }
  function levelFrom(v) {
    v = normName(v).toLowerCase();
    if (/trivia|fun/.test(v)) return "trivia";
    if (/diff|hard/.test(v)) return "difficult";
    return "";
  }
  function bookFrom(v) {
    v = normName(v);
    if (!v || /^general$/i.test(v)) return "";
    for (var i = 0; i < ALL_BOOKS.length; i++) if (ALL_BOOKS[i].toLowerCase() === v.toLowerCase()) return ALL_BOOKS[i];
    return v;   // any other text is kept as a custom topic label
  }
  function splitBar(s) { return String(s || "").split("|").map(normName).filter(Boolean); }
  function parseOne(g) {
    var cat = catFrom(g("cat")); if (!cat) return { err: "unknown category" };
    if (cat === "video") return { err: "video questions are no longer supported" };
    var lang = langByName(g("lang")); if (lang === null) lang = normName(g("lang")).toLowerCase();   // any other language name is accepted as typed
    var q = { lang: lang, book: bookFrom(g("book")), cat: cat, level: levelFrom(g("level")), q: g("q"), a: g("ans"), ref: g("ref"), info: g("info"), intro: g("intro"), opts: null, clues: [], parts: null, pts: 0, secs: 0 };
    var p = parseInt(g("pts"), 10), s = parseInt(g("secs"), 10);
    if (p > 0) q.pts = p; if (s > 0) q.secs = s;
    if (cat === "one") { if (!q.q || !q.a) return { err: "question and correct answer are needed" }; }
    else if (cat === "oneword") {
      if (!q.q || !q.a) return { err: "question and correct answer are needed" };
      q.clues = ["c1", "c2", "c3", "c4", "c5"].map(g).filter(Boolean);       // hints, shown one at a time (optional: made automatically when blank)
    } else if (cat === "mc") {
      if (!q.q) return { err: "question is missing" };
      q.opts = ["oa", "ob", "oc", "od"].map(g).filter(Boolean);
      if (q.opts.length < 2) return { err: "at least two options are needed" };
      var ca = q.a, li = /^[a-d]$/i.test(ca) ? ca.toUpperCase().charCodeAt(0) - 65 : -1, ci = -1;
      if (li > -1) { var all = ["oa", "ob", "oc", "od"].map(g), k = 0, i; for (i = 0; i < all.length; i++) { if (all[i]) { if (i === li) ci = k; k++; } } }
      if (ci < 0) q.opts.forEach(function (o, i) { if (ci < 0 && o.toLowerCase() === ca.toLowerCase()) ci = i; });
      if (ci < 0) return { err: "correct answer does not match any option" };
      q.correct = ci; q.a = q.opts[ci];
    } else if (cat === "clue") {
      if (!q.a) return { err: "correct answer is missing" };
      q.clues = ["c1", "c2", "c3", "c4", "c5"].map(g).filter(Boolean);
    } else {                                                                   // multi-part
      var qs = splitBar(g("q")), as = splitBar(g("ans"));
      if (qs.length < 2 || qs.length > 4 || qs.length !== as.length) return { err: "multi-part needs 2 to 4 parts in Question and the same number of answers in Correct answer, separated by |" };
      q.parts = qs.map(function (t, i) { return { q: t, a: as[i] }; }); q.q = "";
    }
    return { q: q };
  }
  function parseRows(rows) {
    var hi = -1, i, r;
    for (i = 0; i < Math.min(rows.length, 12); i++) { if (rows[i].some(function (c) { return /^question$/i.test(normName(c)); })) { hi = i; break; } }
    if (hi < 0) return null;
    var idx = mapHeaders(rows[hi]), ok = [], skipped = [];
    for (r = hi + 1; r < rows.length; r++) {
      var row = rows[r];
      if (!row || row.every(function (c) { return normName(c) === ""; })) continue;
      var g = (function (rw) { return function (k) { return idx[k] >= 0 ? normName(rw[idx[k]]) : ""; }; })(row);
      var res = parseOne(g);
      if (res.err) skipped.push({ row: r + 1, why: res.err }); else ok.push(res.q);
    }
    return { ok: ok, skipped: skipped };
  }
  var xlsxLoading = null;
  function ensureXlsx() {
    if (window.XLSX) return Promise.resolve();
    if (!xlsxLoading) xlsxLoading = loadScript(XLSX_URL).catch(function (e) { xlsxLoading = null; throw e; });
    return xlsxLoading;
  }
  function readBuffer(file) {
    if (file.arrayBuffer) return file.arrayBuffer();
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsArrayBuffer(file); });
  }
  function dlTemplate() {
    var msg = $("upMsg");
    if (TEMPLATE_B64.indexOf("TEMPLATE_B64") > -1) { msg.className = "err"; msg.textContent = "Template not embedded in this build."; return; }
    var bin = atob(TEMPLATE_B64), u = new Uint8Array(bin.length), i;
    for (i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    saveFile("question-bank-template.xlsx", u, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    track("template_download");
  }

  /* ---------- turning bank rows into quiz questions ---------- */
  var STARTER = null, SAMPLEQ = null;
  function rowsToQs(rows) {
    return rows.map(function (r) {
      var cat = { M: "mc", C: "clue", P: "multi", W: "oneword" }[r[1]] || "one";
      var q = { lang: "en", book: r[0], cat: cat, level: r[8] === "T" ? "trivia" : (r[8] === "D" ? "difficult" : ""), q: r[2], a: r[3], ref: r[4] || "", opts: r[5] || null, clues: r[6] || [], info: r[7] || "",
                parts: r[9] || null, intro: "", pts: r[10] || 0, secs: r[11] || 0, builtin: true };
      if (cat === "multi") { q.intro = r[2]; q.q = ""; }
      if (cat === "mc") q.correct = q.opts.indexOf(q.a);
      return q;
    });
  }
  function starter() { if (!STARTER) STARTER = rowsToQs(STARTER_BANK); return STARTER; }                    // the built-in OBQ questions (a JSON bank, read only)
  function sampleQs() { if (!SAMPLEQ) SAMPLEQ = rowsToQs(typeof SAMPLE_BANK !== "undefined" ? SAMPLE_BANK : []); return SAMPLEQ; }
  function firstChar(s) {
    try { if (window.Intl && Intl.Segmenter) { var it = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)[Symbol.iterator]().next(); if (it && it.value) return it.value.segment; } } catch (e) {}
    return Array.from(s)[0] || "";
  }
  function autoClues(q) {
    var out = [], words = String(q.a).split(/\s+/).filter(Boolean);
    if (q.book && ALL_BOOKS.indexOf(q.book) > -1) out.push(TQ("ac1", { b: q.book }));
    out.push(TQ("ac2", { n: words.length }));
    out.push(TQ("ac3", { c: firstChar(String(q.a)) }));
    if (q.ref) out.push(TQ("ac4", { r: q.ref }));
    return out;
  }
  function autoHints(q) {
    var ans = String(q.a), n = Array.from(ans.replace(/\s+/g, "")).length;
    return [TQ("ac3", { c: firstChar(ans) }).replace(/\.$/, ""), TQ("hintLen", { n: n })];
  }
  function toRound(q) {
    var secs = q.secs || (q.cat === "multi" ? 45 : S.defaultSeconds);
    var base = { ref: q.ref || "", why: "", info: q.info || "", secs: secs };
    var pts = q.pts || S.defaultPoints, rd;
    if (q.cat === "one") { rd = { type: "quick", pts: pts, q: q.q, a: q.a }; }
    else if (q.cat === "oneword") {
      var hints = q.clues.length ? q.clues : autoHints(q), stages = hints.map(function (h, i) { return hints.slice(0, i + 1); });
      rd = { type: "quick", pts: pts, q: q.q, a: q.a, hintStages: stages, hintNext: TQ("nextHint") };
    } else if (q.cat === "mc") {
      var opts = q.opts.slice(), correct = q.correct;
      if (q.builtin) { opts = shuffle(opts); correct = opts.indexOf(q.a); }
      rd = { type: "quick", pts: pts, q: q.q, options: opts, correct: correct, a: opts[correct] };
      if (q.fifty && opts.length >= 3) rd.fifty = true;               // the two wrong options to remove are chosen in finalizeRounds
    } else if (q.cat === "clue") {
      var cl = q.clues.length ? q.clues.slice() : autoClues(q);
      rd = { type: "who", maxPts: cl.length, q: q.q || TQ("whoAmI"), intro: TQ("whoIntro"), clues: cl, a: q.a };
    } else {                                                           // multi-part: all parts shown together, points = parts answered correctly
      var n = q.parts.length, ch = [], i;
      for (i = n; i >= 1; i--) ch.push(i);
      rd = { type: "quick", pts: 1, q: q.intro || TQ("multiIntro"), pointChoices: ch, parts: q.parts, a: "" };
    }
    if (q.level) rd.level = q.level;
    Object.keys(base).forEach(function (k) { rd[k] = base[k]; });
    return rd;
  }
  function inScope(q, c) {
    var b = q.book;
    switch (c.scope) {
      case "any": return true;
      case "bible": return ALL_BOOKS.indexOf(b) > -1 || b === "";
      case "nt": return BOOKS_NT.indexOf(b) > -1;
      case "ot": return BOOKS_OT.indexOf(b) > -1;
      default: return c.books.indexOf(b) > -1;
    }
  }
  function buildPool(c) {
    var src = c.source === "bank" ? bankQuestions(c.bankId) : (S.builtInBank ? starter() : []);
    return src.filter(function (q) { return (q.lang === "" || q.lang === c.quizLang) && inScope(q, c); });
  }
  function pickQuestions(pool, n) {
    var groups = {}, order = [], out = [], i = 0, k, g, added;
    shuffle(pool).forEach(function (q) { var key = q.book || "~"; if (!groups[key]) { groups[key] = []; order.push(key); } groups[key].push(q); });
    order = shuffle(order);
    while (out.length < n) {
      added = false;
      for (k = 0; k < order.length && out.length < n; k++) { g = groups[order[k]]; if (i < g.length) { out.push(g[i]); added = true; } }
      if (!added) break;
      i++;
    }
    return shuffle(out);
  }
  /* Builds a quiz in the order of settings.blueprint: regular, mc, mc, trivia, mc50, mc50, oneword, who, multi, difficult (repeating) */
  function isOneWord(a) { a = normName(a); return a.length >= 3 && a.indexOf(" ") < 0; }
  function slotOK(q, slot) {
    var simple = q.cat === "one" || q.cat === "mc" || q.cat === "oneword";
    switch (slot) {
      case "regular": return q.cat === "one" && !q.level;
      case "mc": case "mc50": return q.cat === "mc" && !q.level;
      case "oneword": return q.cat === "oneword" || (q.cat === "one" && !q.level && isOneWord(q.a));
      case "who": return q.cat === "clue";
      case "trivia": return q.level === "trivia" && simple;
      case "difficult": return q.level === "difficult" && simple;
      case "multi": return q.cat === "multi";
    }
    return false;
  }
  function pickByBlueprint(pool, n) {
    var bp = S.blueprint || [], avail = shuffle(pool), used = [], usedBooks = {}, out = [], i;
    function take(slot) {
      var cand = avail.filter(function (q) { return used.indexOf(q) < 0 && slotOK(q, slot); });
      if (!cand.length) return null;
      var fresh = cand.filter(function (q) { return !usedBooks[q.book]; });
      return (fresh.length ? fresh : cand)[0];
    }
    for (i = 0; i < n; i++) {
      var slot = bp[i % bp.length], q = take(slot);
      if (!q) {                                                       // nothing of this kind: use the closest kind that exists
        var alt = { regular: ["oneword", "mc", "trivia"], mc: ["mc50", "regular", "oneword"], mc50: ["mc", "regular", "oneword"], oneword: ["regular", "trivia", "mc"],
                    who: ["regular", "oneword", "mc"], trivia: ["regular", "oneword", "mc"], difficult: ["regular", "oneword", "mc"], multi: ["regular", "oneword", "mc"] }[slot] || ["regular", "mc"];
        for (var k = 0; k < alt.length && !q; k++) q = take(alt[k]);
        if (!q) q = avail.filter(function (x) { return used.indexOf(x) < 0; })[0] || null;
        if (!q) break;
        slot = slot === "mc50" && q.cat === "mc" ? "mc50" : (slot === "oneword" ? "oneword" : "other");
      }
      used.push(q); usedBooks[q.book] = true;
      var c = {}; Object.keys(q).forEach(function (key) { c[key] = q[key]; });
      if (slot === "mc50" && c.cat === "mc") c.fifty = true;
      if (slot === "oneword" && c.cat === "one") c.cat = "oneword";
      out.push(c);
    }
    return out;
  }
  /* Simple style: only regular and multiple-choice questions (alternating), 1 point each, no 50:50, no hints, no levels */
  function pickSimple(pool, n) {
    var avail = shuffle(pool), used = [], usedBooks = {}, out = [], bp = S.simpleBlueprint || ["regular", "mc"], i;
    function take(kind, strict) {
      var cand = avail.filter(function (q) {
        if (used.indexOf(q) > -1 || !(q.cat === "one" || q.cat === "mc" || q.cat === "oneword")) return false;
        if (strict && q.level) return false;
        return kind === "mc" ? q.cat === "mc" : q.cat !== "mc";
      });
      if (!cand.length) return null;
      var fresh = cand.filter(function (q) { return !usedBooks[q.book]; });
      return (fresh.length ? fresh : cand)[0];
    }
    for (i = 0; i < n; i++) {
      var kind = bp[i % bp.length], other = kind === "mc" ? "regular" : "mc";
      var q = take(kind, true) || take(kind, false) || take(other, true) || take(other, false);
      if (!q) break;
      used.push(q); usedBooks[q.book] = true;
      var c = {}; Object.keys(q).forEach(function (key) { c[key] = q[key]; });
      if (c.cat === "oneword") c.cat = "one";
      c.level = ""; c.fifty = false; c.pts = 1; c.secs = q.secs || S.defaultSeconds;
      out.push(c);
    }
    return out;
  }
  function pickForQuiz(pool, n, style) { return style === "simple" ? pickSimple(pool, n) : (S.useBlueprint ? pickByBlueprint(pool, n) : pickQuestions(pool, n)); }
  function finalizeRounds(rounds) {
    return rounds.map(function (rd) {
      var c = {}; Object.keys(rd).forEach(function (k) { c[k] = rd[k]; });
      if (!c.secs) c.secs = S.defaultSeconds;
      if (c.type === "who") { if (!c.q) c.q = TQ("whoAmI"); if (!c.intro) c.intro = TQ("whoIntro"); }
      if (c.fifty === true && c.options && typeof c.correct === "number") {
        var wrong = []; c.options.forEach(function (_, i) { if (i !== c.correct) wrong.push(i); });
        c.fifty = shuffle(wrong).slice(0, Math.max(1, c.options.length - 2));       // 50:50: keep the right answer and one wrong option
      }
      return c;
    });
  }

  /* ---------- set up page ---------- */
  var sel = { mode: "individual", style: "normal", numQ: 0, ack: false };
  var SCOPES = [["b1", "sc1"], ["b2", "sc2"], ["bmore", "scMore2"], ["nt", "scNT"], ["ot", "scOT"], ["bible", "scBible"], ["any", "scAny"]];
  function limitFor(v) { return v === "b1" ? 1 : v === "b2" ? 2 : 0; }
  function bookBoxes() { return Array.prototype.slice.call(document.querySelectorAll("#booksOT input, #booksNT input")); }
  function selectedBooks() { return bookBoxes().filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); }
  function langOptions(selectEl, current, withOther) {
    clear(selectEl);
    LANGS.forEach(function (L) { var o = el("option", null, L.code === "en" ? "English" : L.native + " (" + L.english + ")"); o.value = L.code; if (L.code === current) o.selected = true; selectEl.appendChild(o); });
    if (withOther) { var oo = el("option", null, T("langOther")); oo.value = "other"; if (current === "other") oo.selected = true; selectEl.appendChild(oo); }
  }
  function paintSelects() {
    langOptions($("authLang"), ui); langOptions($("fUiLang"), ui); langOptions($("tbLang"), ui); langOptions($("fQuizLang"), quizLangPick, true);
    var kv = $("fKbLang").value || "en"; langOptions($("fKbLang"), kv, true);
    $("otherWrap").hidden = $("fQuizLang").value !== "other"; $("kbOtherWrap").hidden = $("fKbLang").value !== "other";
    var u = $("upUsage"), uv = u.value; clear(u);
    var o0 = el("option", null, T("usage")); o0.value = ""; u.appendChild(o0);
    [["church", "use1"], ["school", "use2"], ["community", "use3"], ["work", "use4"]].forEach(function (p) { var o = el("option", null, T(p[1])); o.value = p[0]; u.appendChild(o); });
    u.value = uv;
    var sc = $("fScope"), sv = sc.value; clear(sc);
    var s0 = el("option", null, T("scopeHow")); s0.value = ""; sc.appendChild(s0);
    SCOPES.forEach(function (p) { var o = el("option", null, T(p[1])); o.value = p[0]; sc.appendChild(o); });
    sc.value = sv;
    var qc = $("qCounts"); clear(qc);
    S.questionCounts.forEach(function (n) {
      var b = el("button", null, String(n)); b.type = "button"; b.setAttribute("aria-pressed", n === sel.numQ ? "true" : "false");
      b.addEventListener("click", function () { sel.numQ = n; paintSelects(); refreshAvail(); });
      qc.appendChild(b);
    });
    $("keysHelp").textContent = T("keysHelp");
    $("authNote").textContent = fb.on ? T("onlineNote") : T("localNote");
    paintNavTitles(); $("forgotBtn").hidden = !fb.on; $("btnLink").hidden = !fb.on; $("inRemember").checked = rememberPref(); $("upRemember").checked = rememberPref();
    var pu = $("pfUsage"), pv = pu.value; clear(pu); var po = el("option", null, T("usage")); po.value = ""; pu.appendChild(po);
    [["church", "use1"], ["school", "use2"], ["community", "use3"], ["work", "use4"]].forEach(function (x) { var o = el("option", null, T(x[1])); o.value = x[0]; pu.appendChild(o); }); pu.value = pv;
    Array.prototype.forEach.call(document.querySelectorAll(".mode[data-mode]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-mode") === sel.mode ? "true" : "false"); });
    Array.prototype.forEach.call(document.querySelectorAll(".mode[data-style]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-style") === sel.style ? "true" : "false"); });
    refreshBooks(true);
  }
  var quizLangPick = "en";
  function paintBankInfo() {
    var nb = bankChoices().reduce(function (n, b) { return b.kind === "builtin" ? n : n + b.count; }, 0);
    $("bankInfo").textContent = nb ? T("bankN", { n: nb }) : T("noBank"); paintBankPick();
    $("kbInfo").textContent = kbList().length ? T("kbInfoN", { n: kbList().length }) : T("kbEmpty");
  }
  function buildBooks() {
    function build(box, list) {
      clear(box);
      list.forEach(function (b) {
        var lab = el("label", "bk"), cb = document.createElement("input");
        cb.type = "checkbox"; cb.value = b; cb.addEventListener("change", function (ev) {
          var lim = limitFor($("fScope").value);
          if (lim && selectedBooks().length > lim) ev.target.checked = false;
          refreshBooks();
        });
        lab.appendChild(cb); lab.appendChild(document.createTextNode(b)); box.appendChild(lab);
      });
    }
    build($("booksOT"), BOOKS_OT); build($("booksNT"), BOOKS_NT);
  }
  function refreshBooks(noAvail) {
    var v = $("fScope").value, lim = limitFor(v), boxes = bookBoxes(), n = boxes.filter(function (c) { return c.checked; }).length;
    var needs = v === "b1" || v === "b2" || v === "bmore";
    $("bookWrap").hidden = !needs; $("scopeAuto").hidden = !(v === "nt" || v === "ot" || v === "bible" || v === "any");
    boxes.forEach(function (c) { var off = !!lim && !c.checked && n >= lim; c.disabled = off; c.parentNode.classList.toggle("off", off); c.parentNode.classList.toggle("on", c.checked); });
    $("pickInfo").textContent = !needs ? "" : (v === "bmore" ? T("pickMin", { n: 3, a: n }) : T("pickExact", { n: lim, a: n }));
    if (!noAvail) refreshAvail();
  }
  function onScopeChange() {
    var lim = limitFor($("fScope").value);
    if (lim) { var seen = 0; bookBoxes().forEach(function (c) { if (c.checked) { seen++; if (seen > lim) c.checked = false; } }); }
    refreshBooks();
  }
  function readCfg() {
    var lp = pickLang("fQuizLang", "fOtherLang");
    return {
      qm: normName($("fQM").value), event: normName($("fEvent").value), date: $("fDate").value || todayISO(),
      parts: parseInt($("fParts").value, 10) || 0, uiLang: ui, quizLang: lp.val, quizLangLabel: lp.label, mode: sel.mode, style: sel.style,
      scope: $("fScope").value, books: selectedBooks(), numQ: sel.numQ, source: $("srcK").checked ? "kb" : ($("srcU").checked ? "bank" : "builtin"), bankId: $("srcU").checked ? ($("fBankPick").value || "main") : "", sample: false, saveResults: !$("saveResWrap").hidden && $("fSaveRes").checked, readAloud: speechOK && $("fRead").checked
    };
  }
  function scopeComplete(c) {
    if (!c.scope) return false;
    var lim = limitFor(c.scope);
    if (lim) return c.books.length === lim;
    if (c.scope === "bmore") return c.books.length >= 3;
    return true;
  }
  function scopeLabel(c) {
    if (c.scope === "b1" || c.scope === "b2" || c.scope === "bmore") return c.books.join(", ");
    return T({ nt: "scNT", ot: "scOT", bible: "scBible", any: "scAny" }[c.scope] || "scAny");
  }
  function paintAiNote(c) {                                          // a reminder when the questions were made with AI or machine translation (or come from another Quiz Master)
    var need = false;
    if (c && c.quizLang) {
      if (c.source === "kb") need = true;
      else if (c.source === "bank") { var m = libList().filter(function (x) { return x.bid === c.bankId; })[0], ty = m && m.source && m.source.type; need = ty === "translation" || ty === "shared"; }
      else if (c.quizLang !== "en") need = true;                       // the sample and demo questions in other languages
    }
    $("setupAiNote").hidden = !need;
  }
  function refreshAvail() {
    sel.ack = false;
    var c = readCfg(), t = $("availTxt"); t.textContent = ""; $("setupErr").textContent = ""; paintAiNote(c);
    if (!scopeComplete(c) || !c.quizLang) return;
    if (sel.frozen && sel.frozenKey === freezeKey(c)) { t.textContent = T("ssFrozenNote", { n: sel.frozen.length }); return; }
    if (c.source === "kb") {
      var have = scopeCodes(c).filter(function (code) { return kbHas(c.quizLang, code); });
      t.textContent = have.length ? T("kbAvail", { n: have.length }) : T("kbNone"); return;
    }
    if (c.source === "builtin" && c.quizLang !== "en") { t.textContent = T("builtinEn"); return; }
    if (c.source === "bank" && !bankQuestions(c.bankId).length) { t.textContent = T("noBank"); return; }
    var n = buildPool(c).length;
    t.textContent = n ? T("avail", { n: n }) : T("availNone");
  }
  function markBad(id, on) { var n = $(id); if (n) n.classList.toggle("bad", !!on); }
  function validateSetup(c) {
    var errs = [];
    ["fQM", "fEvent", "fParts", "fScope"].forEach(function (id) { markBad(id, false); });
    if (!c.qm) { errs.push(T("errQM")); markBad("fQM", true); }
    if (!c.event) { errs.push(T("errEvent")); markBad("fEvent", true); }
    if (!(c.parts >= 1)) { errs.push(T("errParts")); markBad("fParts", true); }
    if (!c.scope) { errs.push(T("errScope")); markBad("fScope", true); }
    else if (!scopeComplete(c)) { var lim = limitFor(c.scope); errs.push(lim ? T("pickExact", { n: lim, a: c.books.length }) : T("pickMin", { n: 3, a: c.books.length })); markBad("fScope", true); }
    markBad("fOtherLang", false);
    if (!c.quizLang) { errs.push(T("errOtherLang")); markBad("fOtherLang", true); }
    if (c.source === "bank" && !bankQuestions(c.bankId).length) errs.push(T("noBank"));
    if (c.source === "kb" && c.quizLang && !kbList().some(function (m) { return m.lang === c.quizLang; })) errs.push(T("errNoKb"));
    return errs;
  }
  function onBegin() {
    var c = readCfg(), errs = validateSetup(c), box = $("setupErr");
    if (errs.length) { box.textContent = errs.join("\n"); var bad = document.querySelector(".bad"); if (bad) bad.focus(); return; }
    box.textContent = "";
    quizLang = c.quizLang;
    if (sel.frozen && sel.frozenKey === freezeKey(c)) {          // a saved quiz with its questions frozen
      track("setup_complete", { ui_lang: c.uiLang, quiz_lang: c.quizLang, scope: c.scope, books: c.books.length, num_q: sel.frozen.length, source: "frozen", mode: c.mode, participants: c.parts });
      startQuiz(c, JSON.parse(JSON.stringify(sel.frozen))); return;
    }
    beginWith(c, box, false);
  }
  /* shared by the setup page and OBQ Lite. quiet = no "press Start again" step when fewer questions exist */
  function beginWith(c, box, quiet) {
    quizLang = c.quizLang;
    if (c.source === "kb") {
      kbLoadMerged(c.quizLang).then(function (books) {
        var qs = genKbQuestions(books, scopeCodes(c), c.numQ, c.quizLang, c.style);
        if (!qs.length) { box.textContent = T("kbNone"); return; }
        track("setup_complete", { ui_lang: c.uiLang, quiz_lang: c.quizLang, scope: c.scope, books: c.books.length, num_q: qs.length, source: "kb", mode: c.mode, participants: c.parts });
        startQuiz(c, finalizeRounds(qs.map(toRound)));
      }).catch(function () { box.textContent = T("kbNoIdb"); });
      return;
    }
    if (c.source === "builtin" && c.quizLang !== "en") { box.textContent = T("builtinEn"); return; }
    var pool = buildPool(c);
    if (!pool.length) { box.textContent = T("availNone"); return; }
    if (pool.length < c.numQ && !quiet && !sel.ack) { sel.ack = true; box.textContent = T("availShort", { n: pool.length }); return; }
    var picked = pickForQuiz(pool, c.numQ, c.style);
    track("setup_complete", { ui_lang: c.uiLang, quiz_lang: c.quizLang, scope: c.scope, books: c.books.length, num_q: picked.length, source: c.source, mode: c.mode, style: c.style, participants: c.parts });
    startQuiz(c, finalizeRounds(picked.map(toRound)));
  }
  function onSample() {
    var c = readCfg();
    c.qm = c.qm || (user && user.name) || ""; c.event = c.event || T("srcSample"); c.parts = c.parts || 1;
    c.scope = "any"; c.books = []; c.numQ = ROUNDS_SAMPLE.length; c.source = "sample"; c.sample = true; c.saveResults = false; c.style = "normal"; c.quizLang = "en"; c.quizLangLabel = "English";
    quizLang = "en";
    track("sample_quiz");
    startQuiz(c, finalizeRounds(JSON.parse(JSON.stringify(ROUNDS_SAMPLE))));
  }
  function goSetup() {
    if (!sel.numQ) sel.numQ = S.questionCounts[0];
    if (popClearSetup()) clearSetup();
    if (!$("fQM").value && user) $("fQM").value = user.name || "";
    if (!$("fDate").value) $("fDate").value = todayISO();
    $("srcBWrap").hidden = !S.builtInBank; if (!S.builtInBank) $("srcU").checked = true;
    $("trySample").hidden = !S.sampleQuizButton; $("readWrap").hidden = !speechOK; refreshVoicePickers();
    $("saveResWrap").hidden = !(user && ownConnected());              // only when the Quiz Master has connected their own Firebase
    paintSelects(); paintBankInfo(); renderSaved(); show("setup"); setUrl("setup"); refreshAvail();
  }
  function wireSetup() {
    buildBooks();
    $("fScope").addEventListener("change", onScopeChange);
    $("fUiLang").addEventListener("change", function () { setUi($("fUiLang").value); });
    $("tbLang").addEventListener("change", function () { setUi($("tbLang").value); });
    $("fQuizLang").addEventListener("change", function () { quizLangPick = $("fQuizLang").value; $("otherWrap").hidden = quizLangPick !== "other"; refreshAvail(); });
    $("fOtherLang").addEventListener("input", function () { markBad("fOtherLang", false); refreshAvail(); });
    $("srcB").addEventListener("change", refreshAvail); $("srcU").addEventListener("change", refreshAvail); $("srcK").addEventListener("change", refreshAvail);
    wireKb(); wireSaved(); wireOwn(); wireHome();
    wireVoicePicker({ wrap: "voiceWrap", sel: "fVoice", test: "fVoiceTest", note: "fVoiceNote", tick: "fRead", getLang: function () { return pickLang("fQuizLang", "fOtherLang").val; } });
    wireVoicePicker({ wrap: "lVoiceWrap", sel: "lVoice", test: "lVoiceTest", note: "lVoiceNote", tick: "lRead", getLang: function () { return pickLang("lLang", "lOther").val; } });
    ["fQuizLang", "lLang"].forEach(function (id) { $(id).addEventListener("change", refreshVoicePickers); }); ["fOtherLang", "lOther"].forEach(function (id) { $(id).addEventListener("input", refreshVoicePickers); });
    ["fQM", "fEvent", "fParts"].forEach(function (id) { $(id).addEventListener("input", function () { markBad(id, false); $("setupErr").textContent = ""; }); });
    Array.prototype.forEach.call(document.querySelectorAll(".mode[data-mode]"), function (b) {
      b.addEventListener("click", function () { sel.mode = b.getAttribute("data-mode"); paintSelects(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".mode[data-style]"), function (b) {
      b.addEventListener("click", function () { sel.style = b.getAttribute("data-style"); paintSelects(); refreshAvail(); });
    });
    $("begin").addEventListener("click", onBegin);
    $("trySample").addEventListener("click", onSample);
    $("goHome").addEventListener("click", goHomePage); wireNav(); wirePhoto(); wireAbout();
    $("goDash").addEventListener("click", function () { openBuilder(""); });
    $("dashBack").addEventListener("click", goHomePage);
    $("dlTpl").addEventListener("click", dlTemplate);
    wireBanks(); wireTranslate(); wireShare();
  }

  /* ---------- dashboard ---------- */
  var CAT_KEYS = { one: "catOne", mc: "catMC", oneword: "catWord", clue: "catClue", multi: "catMulti" };
  function paintBuilder() {
    clear($("bankStats")); clear($("bankTable")); paintLibrary();
    paintKb();
  }
  /* the pages that used to be part of the Quiz Builder */
  function paintResults() { paintOwn(); }                         // my quiz results + my Firebase (on the Quiz Results page)
  function analyticsTiles() {                                       // the numbers of the dashboard (also used for the PDF report)
    var st = stats(), hist = history(), names = hist.reduce(function (n, r) { return n + (r.resultsCount || 0); }, 0), since = startDateISO();
    var kbBooks = kbList().reduce(function (n, m) { return n + Object.keys(m.books || {}).length; }, 0), langs = st.langs || [];
    var days = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86400000));
    return [["aSince", fmtDate(since.slice(0, 10)), "date"], ["aDays", days], ["aQuizzes", st.quizzes || 0], ["aFinished", hist.length], ["aParts", st.participants || 0], ["aLangs", langs.length],
      ["aQs", st.questions || 0], ["aPdf", st.pdfs || 0], ["aPeople", names], ["aSaved", setupList().length], ["aBankMine", bankChoices().reduce(function (n, b) { return b.kind === "builtin" ? n : n + b.count; }, 0)], ["aBankBuilt", starter().length], ["aKbTexts", kbList().length], ["aKbBooks", kbBooks]];
  }
  function paintAnalytics() {
    Array.prototype.forEach.call(document.querySelectorAll("#panelActivity .langlist"), function (n) { n.remove(); });
    var st = stats(), sb = $("stats"); clear(sb); var langs = st.langs || [];
    analyticsTiles().forEach(function (p) {
      var d = el("div", "stat" + (p[2] === "date" ? " small" : "")); d.appendChild(el("b", null, String(p[1]))); d.appendChild(document.createTextNode(T(p[0]))); sb.appendChild(d);
    });
    if (langs.length) { var ln = el("p", "note", T("aLangList", { list: langs.join(", ") })); sb.parentNode.insertBefore(ln, sb.nextSibling); ln.className = "note langlist"; }
    $("fbStatus").textContent = fb.on ? T("fbOn") : T("fbOff");
    paintShare();
  }
  function paintDashboard() { paintBuilder(); paintResults(); paintAnalytics(); }
