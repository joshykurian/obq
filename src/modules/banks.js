/* @module {"name":"banks","exports":["libList","libSay","libId","bankQuestions","hasStarterExtra","bankChoices","bankStats","makeBankDoc","uniqueName","libStore","libLoad","libDelete","libDoc","readExcelRows","cleanQ","bankToAoa","slugOf","dateOf","libButton","paintLibrary","paintBankPick","wireBanks"],"uses":["$","CAT_KEYS","S","SAMPLE_BANK","STARTER_BANK","T","bank","bankShareStop","clear","ekey","el","ensureXlsx","fb","goSetup","idbDo","langInfo","langLabel","normName","openBankShare","openReview","paintBankInfo","paintDashboard","paintSelects","paintShareNeeds","parseRows","quizLangPick","readBuffer","refreshAvail","sampleQs","saveBank","saveFile","shOnline","starter","track","user"]} */

  /* =====================================================================
     QUESTION BANK LIBRARY
     Every question bank is a JSON file kept inside this app (in the browser's IndexedDB, with a copy in your own account when you are signed in
     online). Quiz Masters write their questions in the Excel template and upload it: the app converts it into a JSON bank. A JSON bank can also be
     uploaded and downloaded, and a bank can be downloaded again as Excel. The built-in OBQ questions are JSON banks too (read only).
     JSON bank file: { format: "obq-bank", version: 1, bid, name, lang, created, updated, source: {...}, count, questions: [ question, ... ] }
     question: { lang, book, cat: one|mc|oneword|clue|multi, level, q, a, ref, info, intro, opts, correct, clues, parts: [{q, a}], pts, secs }
     ===================================================================== */
  var LIB = [], LIBQ = {}, libNote = "";
  function libList() { return LIB; }                                 // the list of banks (other files ask for it: the variable itself changes, so it is not handed out)
  function libSay(text) { libNote = text; }                          // the note under the library
  function libId(bid) { return ekey() + "|" + bid; }
  function newBid() { return "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function bankQuestions(id) {
    if (id === "core") return starter();
    if (id === "starter") return sampleQs();
    if (!id || id === "main") return bank;
    return LIBQ[id] || [];
  }
  function hasStarterExtra() { return typeof SAMPLE_BANK !== "undefined" && SAMPLE_BANK.length > 0 && SAMPLE_BANK.length !== STARTER_BANK.length; }
  function bankChoices() {                                          // banks that can be chosen in the quiz set-up (not the built-in OBQ questions, which have their own choice)
    var out = [];
    if (hasStarterExtra()) out.push({ id: "starter", name: T("libStarter"), lang: "en", count: sampleQs().length, kind: "builtin" });
    if (bank.length) out.push({ id: "main", name: T("libMain"), lang: "", count: bank.length, kind: "main" });
    LIB.forEach(function (m) { out.push({ id: m.bid, name: m.name, lang: m.lang, count: m.count, kind: "lib" }); });
    return out;
  }
  function bankStats(qs) { var c = {}; qs.forEach(function (q) { c[q.cat] = (c[q.cat] || 0) + 1; }); return c; }
  function makeBankDoc(name, qs, source, lang) {
    var langs = {}; qs.forEach(function (q) { langs[q.lang || ""] = 1; }); var codes = Object.keys(langs), now = new Date().toISOString();
    return { format: "obq-bank", version: 1, bid: newBid(), name: name, lang: lang || (codes.length === 1 ? codes[0] : (codes.length ? "mixed" : "")), created: now, updated: now, source: source || {}, count: qs.length, questions: qs };
  }
  function uniqueName(name) { var n = name, k = 2; while (LIB.some(function (m) { return m.name === n; })) n = name + " (" + (k++) + ")"; return n; }
  function metaOf(doc) { return { bid: doc.bid, name: doc.name, lang: doc.lang, count: doc.count, created: doc.created, updated: doc.updated, source: doc.source || {}, flagged: doc.flagged || 0, shared: doc.shared || null }; }

  /* ---------- storage ---------- */
  function libStore(doc, noCloud) {
    var rec = Object.assign({}, doc, { id: libId(doc.bid) });
    return idbDo("banks", "readwrite", function (s) { return s.put(rec); }).then(function () {
      var m = metaOf(doc), i = -1; LIB.forEach(function (x, k) { if (x.bid === doc.bid) i = k; });
      if (i < 0) LIB.unshift(m); else LIB[i] = m; LIBQ[doc.bid] = doc.questions;
      if (!noCloud) fbLibSave(doc); paintBankInfo(); paintLibrary();
    });
  }
  function libLoad() {
    LIB = []; LIBQ = {}; var pre = ekey() + "|";
    return idbDo("banks", "readonly", function (s) { return s.getAll(); }).then(function (all) {
      (all || []).filter(function (r) { return r.id && r.id.indexOf(pre) === 0; }).sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); }).forEach(function (r) { LIB.push(metaOf(r)); LIBQ[r.bid] = r.questions || []; });
      paintBankInfo(); paintLibrary(); fbLibLoad();
    }).catch(function () { LIB = []; LIBQ = {}; });
  }
  function libDelete(bid) {
    return idbDo("banks", "readwrite", function (s) { return s.delete(libId(bid)); }).then(function () {
      LIB = LIB.filter(function (m) { return m.bid !== bid; }); delete LIBQ[bid]; fbLibDelete(bid); paintBankInfo(); paintLibrary(); paintDashboard();
    });
  }
  function libDoc(bid) { var m = LIB.filter(function (x) { return x.bid === bid; })[0]; return m ? Object.assign({ format: "obq-bank", version: 1 }, m, { questions: LIBQ[bid] || [] }) : null; }
  function fbLibRef(bid) { return fb.db.collection("quizMasters").doc(user.uid).collection("banks").doc("lib_" + bid); }
  function fbLibSave(doc) {                                          // a copy in the signed-in account (only banks small enough for one document)
    if (!(fb.on && user && user.uid)) return;
    var rows = JSON.stringify(doc.questions); if (rows.length > 900000) { libNote = T("libTooBig", { name: doc.name }); return; }
    try { fbLibRef(doc.bid).set({ rows: rows, name: doc.name, lang: doc.lang, count: doc.count, created: doc.created, updatedAt: doc.updated, source: JSON.stringify(doc.source || {}), flagged: doc.flagged || 0 }).catch(function () {}); } catch (e) {}
  }
  function fbLibDelete(bid) { if (!(fb.on && user && user.uid)) return; try { fbLibRef(bid).delete().catch(function () {}); } catch (e) {} }
  function fbLibLoad() {
    if (!(fb.on && user && user.uid)) return;
    try {
      fb.db.collection("quizMasters").doc(user.uid).collection("banks").get().then(function (snap) {
        (snap.docs || []).forEach(function (d) {
          if (String(d.id).indexOf("lib_") !== 0) return; var bid = String(d.id).slice(4); if (LIBQ[bid]) return; var x = d.data(), qs;
          try { qs = JSON.parse(x.rows || "[]"); } catch (e) { return; } if (!qs.length) return;
          var src = {}; try { src = JSON.parse(x.source || "{}"); } catch (e) {}
          libStore({ format: "obq-bank", version: 1, bid: bid, name: x.name || "Question bank", lang: x.lang || "", created: x.created || new Date().toISOString(), updated: x.updatedAt || x.created || "", source: src, count: qs.length, flagged: x.flagged || 0, questions: qs }, true);
        });
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- reading an Excel file or a JSON file ---------- */
  function readExcelRows(file) {
    return ensureXlsx().catch(function () { var e = new Error("xlsx"); e.xlsx = true; throw e; }).then(function () { return readBuffer(file); }).then(function (buf) {
      var wb = window.XLSX.read(buf, { type: "array" });
      var name = wb.SheetNames.filter(function (n) { return /^questions$/i.test(n); })[0] || wb.SheetNames[0];
      return window.XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "" });
    });
  }
  function cleanQ(o) {                                               // one question of a JSON bank: checked and tidied (the same rules as the Excel import)
    if (!o || typeof o !== "object") return { err: "not a question" };
    var cat = ["one", "mc", "oneword", "clue", "multi"].indexOf(o.cat) > -1 ? o.cat : null; if (!cat) return { err: "unknown category" };
    var q = { lang: String(o.lang || "").toLowerCase(), book: String(o.book || ""), cat: cat, level: ["trivia", "difficult"].indexOf(o.level) > -1 ? o.level : "", q: String(o.q || ""), a: String(o.a || ""), ref: String(o.ref || ""), info: String(o.info || ""),
      intro: String(o.intro || ""), opts: null, clues: Array.isArray(o.clues) ? o.clues.map(String).filter(Boolean).slice(0, 5) : [], parts: null, pts: Math.max(0, parseInt(o.pts, 10) || 0), secs: Math.max(0, parseInt(o.secs, 10) || 0) };
    ["flag", "refSrc", "srcQ", "srcA", "verse"].forEach(function (k) { if (o[k] !== undefined) q[k] = o[k]; });
    if (cat === "one" || cat === "oneword") { if (!q.q || !q.a) return { err: "question and answer are needed" }; }
    else if (cat === "mc") {
      q.opts = Array.isArray(o.opts) ? o.opts.map(String).filter(Boolean).slice(0, 4) : []; if (!q.q || q.opts.length < 2) return { err: "question and at least two options are needed" };
      var ci = typeof o.correct === "number" ? o.correct : q.opts.indexOf(q.a); if (ci < 0 || ci >= q.opts.length) return { err: "correct answer does not match any option" }; q.correct = ci; q.a = q.opts[ci];
    } else if (cat === "clue") { if (!q.a) return { err: "correct answer is missing" }; }
    else {
      var ps = Array.isArray(o.parts) ? o.parts.filter(function (p) { return p && p.q && p.a; }).map(function (p) { return { q: String(p.q), a: String(p.a) }; }) : [];
      if (ps.length < 2 || ps.length > 4) return { err: "multi-part needs 2 to 4 parts" }; q.parts = ps; q.q = "";
    }
    return { q: q };
  }
  function importJsonFile(file) {
    var msg = $("upMsg");
    return readBuffer(file).then(function (buf) {
      var data = JSON.parse(new TextDecoder("utf-8").decode(new Uint8Array(buf))), raw = Array.isArray(data) ? data : (data && data.format === "obq-bank" ? data.questions : null);
      if (!Array.isArray(raw)) throw new Error("format");
      var ok = [], skipped = []; raw.forEach(function (o, i) { var r = cleanQ(o); if (r.err) skipped.push({ row: i + 1, why: r.err }); else ok.push(r.q); });
      return finishImport(ok, skipped, (data && data.name) || file.name.replace(/\.[^.]+$/, ""), { type: "json", file: file.name }, data && data.lang);
    }).catch(function () { msg.className = "err"; msg.textContent = T("upErrJson"); });
  }
  function finishImport(ok, skipped, name, source, lang) {
    var msg = $("upMsg"); clear(msg); msg.className = "note";
    if (ok.length) {
      var doc = makeBankDoc(uniqueName(name), ok, source, lang && lang !== "mixed" ? lang : undefined);
      doc.flagged = ok.filter(function (q) { return q.flag === "check"; }).length;                 // a translated bank keeps its "needs a check" marks
      return libStore(doc).then(function () {
        var c = bankStats(ok), parts = Object.keys(CAT_KEYS).filter(function (k) { return c[k]; }).map(function (k) { return T(CAT_KEYS[k]) + ": " + c[k]; });
        msg.appendChild(el("div", "okmsg", T("libSaved", { name: doc.name, n: ok.length }))); msg.appendChild(el("div", "note", parts.join("   ")));
        track("bank_upload", { count: ok.length, skipped: skipped.length, kind: source.type });
        if (skipped.length) { var lines = [T("upSkip", { n: skipped.length })]; skipped.slice(0, 8).forEach(function (s) { lines.push("   " + s.row + ": " + s.why); }); if (skipped.length > 8) lines.push("   ..."); msg.appendChild(el("div", "err", lines.join("\n"))); }
        paintDashboard();
      });
    }
    msg.appendChild(el("div", "err", T("upNone"))); return Promise.resolve();
  }
  function importFile(file) {                                        // an Excel / CSV file becomes a new JSON bank; a JSON file is added as it is
    var msg = $("upMsg"); msg.className = "note"; msg.style.whiteSpace = "pre-line"; msg.textContent = "...";
    if (/\.json$/i.test(file.name)) return importJsonFile(file);
    return readExcelRows(file).then(function (rows) {
      var res = parseRows(rows); if (!res) { msg.className = "err"; msg.textContent = T("upErr"); return; }
      return finishImport(res.ok, res.skipped, file.name.replace(/\.[^.]+$/, ""), { type: "excel", file: file.name });
    }).catch(function (e) { msg.className = "err"; msg.textContent = T(e && e.xlsx ? "xlsxOffline" : "upErr"); });
  }

  /* ---------- downloading a bank: as JSON, or as an Excel file in the template layout ---------- */
  var XL_HEAD = ["Language", "Book", "Category", "Level", "Question", "Option A", "Option B", "Option C", "Option D", "Clue 1", "Clue 2", "Clue 3", "Clue 4", "Clue 5", "Correct answer", "Reference", "More to know", "Points", "Seconds", "Intro"];
  var XL_CAT = { one: "One answer", mc: "Multiple choice", oneword: "Short answer with hints", clue: "Clue based", multi: "Multi-part" };
  function bankToAoa(qs) {
    var rows = [XL_HEAD.slice()];
    qs.forEach(function (q) {
      var o = q.opts || [], c = q.clues || [], multi = q.cat === "multi";
      rows.push([langLabel(q.lang) || q.lang || "", q.book || "", XL_CAT[q.cat] || "", q.level ? q.level.charAt(0).toUpperCase() + q.level.slice(1) : "Regular",
        multi ? q.parts.map(function (p) { return p.q; }).join(" | ") : q.q, o[0] || "", o[1] || "", o[2] || "", o[3] || "", c[0] || "", c[1] || "", c[2] || "", c[3] || "", c[4] || "",
        multi ? q.parts.map(function (p) { return p.a; }).join(" | ") : q.a, q.ref || "", q.info || "", q.pts || "", q.secs || "", multi ? (q.intro || "") : ""]);
    });
    return rows;
  }
  function slugOf(s) { return String(s || "bank").toLowerCase().replace(/[^a-z0-9\u0900-\u0DFF]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "bank"; }
  function downloadBankJson(name, doc) { return saveFile("obq-bank-" + slugOf(name) + ".json", new TextEncoder().encode(JSON.stringify(doc, null, 1)), "application/json"); }
  function downloadBankExcel(name, qs) {
    return ensureXlsx().catch(function () { libNote = T("xlsxOffline"); paintLibrary(); throw new Error("xlsx"); }).then(function () {
      var X = window.XLSX, wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(bankToAoa(qs)), "Questions");
      var out = X.write(wb, { type: "array", bookType: "xlsx" }); return saveFile("obq-bank-" + slugOf(name) + ".xlsx", new Uint8Array(out), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    });
  }
  function coreDoc() { return { format: "obq-bank", version: 1, bid: "core", name: T("libCore"), lang: "en", created: "", updated: "", source: { type: "builtin" }, count: starter().length, questions: starter() }; }

  /* ---------- the library table in the Question Bank panel ---------- */
  var libArmed = null;
  function srcLabel2(s) {
    s = s || {}; if (s.type === "excel") return T("libSrcExcel", { f: s.file || "" }); if (s.type === "json") return T("libSrcJson", { f: s.file || "" });
    if (s.type === "translation") return T("libSrcTr", { b: s.bibleText || "", e: s.engine || "" }) + " | " + T("aiTag"); if (s.type === "builtin") return T("libSrcBuilt"); if (s.type === "shared") return T("libSrcShared", { by: s.by || "-", iso: s.code || "-" }) + " | " + T("aiTag"); return "";
  }
  function dateOf(v) { return v ? String(v).slice(0, 10) : ""; }
  function libButton(label, fn, cls) { var b = el("button", "ghost sm" + (cls ? " " + cls : ""), label); b.type = "button"; b.addEventListener("click", fn); return b; }
  function useBank(id) {
    goSetup();
    if (id === "core") { $("srcB").checked = true; } else { $("srcU").checked = true; paintBankPick(); $("fBankPick").value = id; var ch = bankChoices().filter(function (b) { return b.id === id; })[0]; if (ch && ch.lang && langInfo(ch.lang).code === ch.lang) { quizLangPick = ch.lang; paintSelects(); } }
    refreshAvail();
  }
  function paintLibrary() {
    var tb = $("libTable"); if (!tb) return; clear(tb);
    var hr = el("tr"); ["libName", "libLang", "libCount", "libSource", "libAdded", ""].forEach(function (h) { hr.appendChild(el("th", null, h ? T(h) : "")); }); tb.appendChild(hr);
    function row(id, name, lang, count, source, added, acts) {
      var tr = el("tr"); tr.setAttribute("data-bank", id); tr.appendChild(el("td", "libn", name)); tr.appendChild(el("td", null, lang)); tr.appendChild(el("td", null, String(count))); tr.appendChild(el("td", "note", source)); tr.appendChild(el("td", null, added));
      var td = el("td", "libact"); acts.forEach(function (a) { td.appendChild(a); }); tr.appendChild(td); tb.appendChild(tr); return tr;
    }
    function del(fn) {
      var b = libButton(T("libDelete"), function () {
        if (libArmed !== b) { libArmed = b; b.textContent = T("libDeleteSure"); setTimeout(function () { if (libArmed === b) { libArmed = null; b.textContent = T("libDelete"); } }, 4000); return; }
        libArmed = null; fn();
      }, "danger"); return b;
    }
    var core = starter();
    if (core.length) row("core", T("libCore"), langLabel("en"), core.length, T("libSrcBuilt"), "", [libButton(T("libUse"), function () { useBank("core"); })].concat(S.allowCoreExport ? [libButton(T("libExcelTr"), function () { downloadBankExcel("obq-core", core); })] : []));
    if (hasStarterExtra()) row("starter", T("libStarter"), langLabel("en"), sampleQs().length, T("libSrcBuilt"), "", [libButton(T("libUse"), function () { useBank("starter"); })]);
    if (bank.length) row("main", T("libMain"), "", bank.length, T("libSrcEarlier"), "", [libButton(T("libUse"), function () { useBank("main"); }), libButton("JSON", function () { downloadBankJson("my-bank", makeBankDoc("My question bank", bank, { type: "earlier" })); }),
      libButton("Excel", function () { downloadBankExcel("my-bank", bank); }), del(function () { bank = []; saveBank(); paintBankInfo(); paintLibrary(); paintDashboard(); })]);
    LIB.forEach(function (m) {
      var acts = [libButton(T("libUse"), function () { useBank(m.bid); }), libButton(T("libPreview"), function () { previewBank(m.bid); }), libButton("JSON", function () { downloadBankJson(m.name, libDoc(m.bid)); }),
        libButton("Excel", function () { downloadBankExcel(m.name, LIBQ[m.bid] || []); }), libButton(T("libRename"), function () { renameBank(m.bid, tr); })];
      if (m.flagged) acts.push(libButton(T("libReview", { n: m.flagged }), function () { openReview(m.bid); }));
      if (shOnline() && (m.source || {}).type !== "shared") {                                   // a bank taken from the server is not shared again
        acts.push(libButton(m.shared ? T("shUpdate") : T("shShare"), function () { openBankShare(m.bid); }));
        if (m.shared) { var sb = libButton(T("shStop"), function () { if (libArmed !== sb) { libArmed = sb; sb.textContent = T("shStopSure"); setTimeout(function () { if (libArmed === sb) { libArmed = null; sb.textContent = T("shStop"); } }, 4000); return; } libArmed = null; bankShareStop(m.bid); }, "danger"); acts.push(sb); }
      }
      acts.push(del(function () { libDelete(m.bid); }));
      var tr = row(m.bid, m.name, m.lang === "mixed" ? T("libMixed") : (langLabel(m.lang) || m.lang), m.count, srcLabel2(m.source) + (m.shared ? " | " + T("shTagShared") : ""), dateOf(m.created), acts);
    });
    if (tb.rows.length === 1) tb.appendChild(el("tr")).appendChild(el("td", "note", T("libEmpty")));
    $("libNote").textContent = libNote; paintShareNeeds();
  }
  function renameBank(bid, tr) {
    var td = tr.querySelector(".libn"), m = LIB.filter(function (x) { return x.bid === bid; })[0]; if (!m) return;
    var inp = el("input"); inp.type = "text"; inp.value = m.name; inp.maxLength = 80; clear(td); td.appendChild(inp); inp.focus(); inp.select();
    function save() { var v = normName(inp.value); if (v && v !== m.name) { var doc = libDoc(bid); doc.name = v; doc.updated = new Date().toISOString(); libStore(doc); } else paintLibrary(); }
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); inp.blur(); } if (e.key === "Escape") { inp.value = m.name; inp.blur(); } }); inp.addEventListener("blur", save);
  }
  function previewBank(bid) {
    var qs = bankQuestions(bid), m = LIB.filter(function (x) { return x.bid === bid; })[0], box = $("bankStats"), tb = $("bankTable"); clear(box); clear(tb);
    box.appendChild(el("p", "pickinfo", (m ? m.name : "") + ": " + T("bankN", { n: qs.length })));
    var counts = bankStats(qs), line = el("div"); Object.keys(CAT_KEYS).forEach(function (k) { if (counts[k]) line.appendChild(el("span", "tag2", T(CAT_KEYS[k]) + ": " + counts[k])); }); box.appendChild(line);
    box.appendChild(el("p", "note", T("preview")));
    var hr = el("tr"); ["#", "Question", "Category", "Book", "Answer"].forEach(function (h) { hr.appendChild(el("th", null, h)); }); tb.appendChild(hr);
    qs.slice(0, 10).forEach(function (q, i) {
      var tr = el("tr"); [String(i + 1), (q.q || (q.parts ? q.parts.map(function (p) { return p.q; }).join(" | ") : "")).slice(0, 110), T(CAT_KEYS[q.cat]), q.book || "-", (q.parts ? q.parts.map(function (p) { return p.a; }).join(" | ") : q.a).slice(0, 60)].forEach(function (v) { tr.appendChild(el("td", null, v)); }); tb.appendChild(tr);
    });
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------- the bank chosen in the quiz set-up ---------- */
  function paintBankPick() {
    var sel = $("fBankPick"), keep = sel.value, ch = bankChoices(); clear(sel);
    ch.forEach(function (b) { var o = el("option", null, b.name + " - " + (b.lang && b.lang !== "mixed" ? (langLabel(b.lang) || b.lang) + " - " : "") + b.count); o.value = b.id; sel.appendChild(o); });
    if (keep && ch.some(function (b) { return b.id === keep; })) sel.value = keep;
    $("bankPickRow").hidden = !$("srcU").checked || !ch.length;
  }
  function onBankPick() {
    var id = $("fBankPick").value, ch = bankChoices().filter(function (b) { return b.id === id; })[0];
    if (ch && ch.lang && ch.lang !== "mixed" && langInfo(ch.lang).code === ch.lang) { quizLangPick = ch.lang; paintSelects(); }
    refreshAvail();
  }
  function wireBanks() {
    $("upBtn").addEventListener("click", function () { $("fileIn").click(); });
    $("fileIn").addEventListener("change", function () { var f = $("fileIn").files && $("fileIn").files[0]; if (f) importFile(f).then(function () { $("fileIn").value = ""; }); });
    Array.prototype.forEach.call(document.querySelectorAll("input[name=src]"), function (r) { r.addEventListener("change", paintBankPick); });
    $("fBankPick").addEventListener("change", onBankPick);
  }
