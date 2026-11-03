/* @module {"name":"translate","exports":["TR_CODES","openTranslate","openReview","wireTranslate"],"uses":["$","ALL_BOOKS","BOOKS_OT","T","bankQuestions","bankToAoa","clear","codeOfEnglish","core","el","ensureXlsx","hasStarterExtra","idbOpen","kbLoadMerged","libDoc","libList","libStore","makeBankDoc","normName","parseRows","readExcelRows","sampleQs","saveFile","slugOf","starter","track","uniqueName"]} */

  /* =====================================================================
     QUESTIONS IN THE LANGUAGE OF A BIBLE TEXT
     Base: the OBQ questions (English, a JSON bank). For every question the Bible reference is looked up in the Bible text the Quiz Master added
     (USFM, USFX, USX, plain text or Bible Brain). The question, the options and the hints are translated (by a translation service, or by a person
     through an Excel file), the answer is matched to the wording of that Bible text, the reference gets the book name of that Bible, and "More to know"
     becomes the actual verse text. The result is saved as a JSON bank in that language, with the questions that need a human check marked.
     ===================================================================== */
  var TR = { kb: null, books: null, cancel: false, busy: false, plan: null, last: "" };
  var TR_CODES = { en: "en", hi: "hi", ml: "ml", or: "or", ta: "ta", te: "te", pa: "pa", bn: "bn", ne: "ne", ur: "ur", mr: "mr", kannada: "kn", gujarati: "gu", assamese: "as", sinhala: "si", sinhalese: "si",
                   burmese: "my", thai: "th", konkani: "gom", maithili: "mai", dogri: "doi", santali: "sat", indonesian: "id", swahili: "sw", spanish: "es", french: "fr", portuguese: "pt", arabic: "ar" };

  /* ---------- Bible references ("Genesis 28:12, 19", "Exodus 3:1; 18:1, 13-26") ---------- */
  var BOOK_ALIAS = { psalm: "Psalms", psalms: "Psalms", "song of songs": "Song of Solomon", songs: "Song of Solomon", revelations: "Revelation" };
  var ONE_CHAPTER = { Obadiah: 1, Philemon: 1, "2 John": 1, "3 John": 1, Jude: 1 };
  function bookByName(n) {
    n = String(n || "").replace(/\s+/g, " ").trim().toLowerCase(); if (!n) return ""; if (BOOK_ALIAS[n]) return BOOK_ALIAS[n];
    for (var i = 0; i < ALL_BOOKS.length; i++) if (ALL_BOOKS[i].toLowerCase() === n) return ALL_BOOKS[i];
    return "";
  }
  function parseRefs(ref, defBook) {
    var out = [], book = bookByName(defBook), chap = 0, ok = true;
    String(ref || "").split(/\s*;\s*/).forEach(function (seg) {
      seg = seg.trim(); if (!seg) return;
      var m = seg.match(/^((?:[1-3]\s?)?[A-Za-z][A-Za-z ]*?)\s*(\d.*)$/);
      if (m && bookByName(m[1])) { book = bookByName(m[1]); seg = m[2]; chap = 0; }
      if (ONE_CHAPTER[book] && seg.indexOf(":") < 0) chap = 1;                      // Philemon 16, 2 John 4, Jude 3: books with one chapter are cited by verse only
      var cv = seg.match(/^(\d+)\s*:\s*(.*)$/);
      if (cv) { chap = parseInt(cv[1], 10); seg = cv[2]; }
      else if (/^\d+$/.test(seg) && !chap) { out.push({ book: book, c: parseInt(seg, 10), whole: true }); return; }
      if (!chap || !book) { ok = false; return; }
      seg.split(/\s*,\s*/).forEach(function (item) {
        var r = item.match(/^(\d+)(?:\s*[-\u2013\u2014]\s*(?:(\d+)\s*:\s*)?(\d+))?$/);
        if (!r) { ok = false; return; }
        out.push({ book: book, c: chap, v1: +r[1], c2: r[2] ? +r[2] : chap, v2: r[3] ? +r[3] : +r[1] });
      });
    });
    return { items: out, ok: ok && out.length > 0 };
  }
  function verseIndex(books) {
    var cache = {};
    return function (code) {
      if (cache[code]) return cache[code]; var map = {}, list = []; ((books[code] && books[code].v) || []).forEach(function (v) { map[v[0] + ":" + v[1]] = v[2]; list.push(v); });
      return (cache[code] = { map: map, list: list });
    };
  }
  function resolveRefs(parsed, books, vi) {
    var texts = [], miss = 0;
    parsed.items.forEach(function (it) {
      var code = codeOfEnglish(it.book); if (!code || !books[code]) { miss += 2; return; } var ix = vi(code);
      if (it.whole) { ix.list.forEach(function (v) { if (+v[0] === it.c) texts.push(v[2]); }); return; }
      if (it.c2 === it.c) { for (var v = it.v1; v <= it.v2; v++) { var t = ix.map[it.c + ":" + v]; if (t === undefined) miss++; else texts.push(t); } }
      else { var on = false; ix.list.forEach(function (x) { if (+x[0] === it.c && +x[1] === it.v1) on = true; if (on) texts.push(x[2]); if (+x[0] === it.c2 && +x[1] === it.v2) on = false; }); }
    });
    return { texts: texts, miss: miss, ok: texts.length > 0 && miss <= 1 };      // one verse that this Bible does not have is tolerated
  }
  function localRef(ref, books) {                                    // the English book name in the reference becomes the book name of the Bible text
    return String(ref).replace(/(^|;\s*)((?:[1-3]\s?)?[A-Za-z][A-Za-z ]*?)\s*(?=\d)/g, function (m, pre, b) {
      var en = bookByName(b), code = en && codeOfEnglish(en); return (code && books[code] && books[code].n) ? pre + books[code].n + " " : m;
    });
  }

  /* ---------- matching an answer to the wording of the Bible text ---------- */
  function trNorm(s) { return String(s || "").normalize("NFC").replace(/[\u200b-\u200d\u2060\ufeff]/g, "").toLowerCase(); }
  function trSkel(s) { return trNorm(s).normalize("NFD").replace(/\p{M}/gu, ""); }         // letters without vowel signs and accents
  function levSim(a, b) {
    var x = Array.from(a), y = Array.from(b), n = x.length, m = y.length; if (!n || !m) return 0;
    var prev = [], cur = [], i, j; for (j = 0; j <= m; j++) prev[j] = j;
    for (i = 1; i <= n; i++) { cur = [i]; for (j = 1; j <= m; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)); prev = cur; }
    return 1 - prev[m] / Math.max(n, m);
  }
  function wordSim(a, b) {
    var s = Math.max(levSim(trNorm(a), trNorm(b)), levSim(trSkel(a), trSkel(b))), na = trSkel(a), nb = trSkel(b);
    if (Math.min(na.length, nb.length) >= 3 && (nb.indexOf(na) === 0 || na.indexOf(nb) === 0)) s = Math.max(s, 0.88);      // the same word with an ending (Malayalam, Marathi, Tamil, ...)
    return s;
  }
  var TR_MATCH = 0.6;
  function isNumberish(s) { return /^[\s\d\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0D66-\u0D6F\u0660-\u0669.,%-]+$/.test(String(s)); }
  function alignAnswer(ans, text) {                                  // the part of the Bible verse text that best matches the translated answer, or null
    var a = core(String(ans).trim()); if (!a || Array.from(a).length < 2 || isNumberish(a)) return null;
    var words = String(text).split(/\s+/).filter(Boolean), n = Math.max(1, String(ans).trim().split(/\s+/).length), best = { s: 0 }, len, i;
    for (len = Math.max(1, n - 1); len <= Math.min(words.length, n + 1); len++) {
      for (i = 0; i + len <= words.length; i++) {
        var span = core(words.slice(i, i + len).join(" ")); if (!span) continue;
        var s = wordSim(a, span) - (len !== n ? 0.04 : 0); if (s > best.s) best = { s: s, text: span };
      }
    }
    return best.s >= TR_MATCH ? best : null;
  }

  /* ---------- the translation services (the Quiz Master's own key; nothing is stored) ---------- */
  function decodeEntities(s) { var t = document.createElement("textarea"); t.innerHTML = s; return t.value; }
  function trPost(url, headers, body) {
    return fetch(url, { method: "POST", headers: headers, body: JSON.stringify(body) }).then(function (r) { if (!r.ok) { var e = new Error("http"); e.status = r.status; throw e; } return r.json(); });
  }
  var chromeTr = {};
  function chromeTranslator(code) {                                  // one translator per language; the pack is downloaded the first time (this needs a click, so it is started from the button)
    if (chromeTr[code]) return chromeTr[code];
    return (chromeTr[code] = Translator.create({ sourceLanguage: "en", targetLanguage: code, monitor: function (m) { m.addEventListener("downloadprogress", function (e) { try { $("trStatus").textContent = T("trChromeDl", { p: Math.round((e.loaded || 0) * 100) }); } catch (x) {} }); } })
      .catch(function (e) { var er = new Error("chrome"); er.chrome = (e && e.name) || "x"; throw er; }));
  }
  var TR_ENGINES = {
    google: { name: "Google Cloud Translation", batch: 40, translate: function (texts, code, cfg) {
      return trPost("https://translation.googleapis.com/language/translate/v2?key=" + encodeURIComponent(cfg.key), { "Content-Type": "application/json" }, { q: texts, source: "en", target: code, format: "text" })
        .then(function (j) { return j.data.translations.map(function (x) { return decodeEntities(x.translatedText); }); }); } },
    microsoft: { name: "Microsoft Translator", batch: 40, translate: function (texts, code, cfg) {
      var h = { "Content-Type": "application/json", "Ocp-Apim-Subscription-Key": cfg.key }; if (cfg.region) h["Ocp-Apim-Subscription-Region"] = cfg.region;
      return trPost("https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=" + encodeURIComponent(code) + "&textType=plain", h, texts.map(function (t) { return { Text: t }; }))
        .then(function (j) { return j.map(function (x) { return x.translations[0].text; }); }); } },
    gemini: { name: "Google Gemini", batch: 25, workers: 1, gap: 4000, wait429: 25000, tries: 6, translate: function (texts, code, cfg) {          // the free plan of Google AI Studio is slow: one request at a time
      var model = cfg.model || "gemini-flash-latest";
      var prompt = "Translate every string of this JSON array from English into " + (cfg.langName || code) + " (language code " + code + "). Use the words that Bible translations in that language use for names and Bible terms. Keep numbers. Reply with ONLY a JSON array of strings, in the same order and with exactly " + texts.length + " items, and no comments.\n" + JSON.stringify(texts);
      return trPost("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", { "Content-Type": "application/json", "x-goog-api-key": cfg.key },
        { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } })
        .then(function (j) {
          var c = ((j.candidates || [])[0] || {}).content, s = c && c.parts ? c.parts.map(function (p) { return p.text || ""; }).join("") : "", arr = null;
          try { arr = JSON.parse(s); } catch (e) {} if (!Array.isArray(arr) || arr.length !== texts.length) { var er = new Error("shape"); er.status = 0; throw er; }          /* a wrong count is tried again */
          return arr.map(function (x) { return String(x); });
        }); } },
    chrome: { name: "Chrome / Edge on this computer", batch: 20, workers: 2, translate: function (texts, code) {           // free, no key, nothing leaves the computer (Chrome 138+ or Edge 148+ on a computer)
      return chromeTranslator(code).then(function (tr) { return Promise.all(texts.map(function (t) { return tr.translate(t); })); }); } },
    libre: { name: "LibreTranslate", batch: 20, translate: function (texts, code, cfg) {
      var base = String(cfg.url || "").replace(/\/+$/, "");
      return trPost(base + "/translate", { "Content-Type": "application/json" }, { q: texts, source: "en", target: code, format: "text", api_key: cfg.key || "" })
        .then(function (j) { var r = j.translatedText; return Array.isArray(r) ? r : [r]; }); } }
  };
  function idbGetMany(store, keys) {
    return idbOpen().then(function (d) { return new Promise(function (res) {
      var out = {}, tx = d.transaction(store, "readonly"), os = tx.objectStore(store);
      keys.forEach(function (k) { os.get(k).onsuccess = function (e) { if (e.target.result) out[k] = e.target.result; }; });
      tx.oncomplete = function () { res(out); }; tx.onerror = tx.onabort = function () { res(out); };
    }); });
  }
  function idbPutMany(store, recs) {
    return idbOpen().then(function (d) { return new Promise(function (res) { var tx = d.transaction(store, "readwrite"), os = tx.objectStore(store); recs.forEach(function (r) { os.put(r); }); tx.oncomplete = function () { res(); }; tx.onerror = tx.onabort = function () { res(); }; }); });
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function trRetry(fn, tries, E) {
    return fn().catch(function (e) {
      var st = e && e.status; if (TR.cancel || tries <= 1 || st === 400 || st === 401 || st === 403 || st === 404 || (e && e.chrome)) throw e;
      var wait = (st === 429 && E && E.wait429) ? E.wait429 : (4 - Math.min(tries, 4) + 1) * 1200;
      return sleep(wait).then(function () { return trRetry(fn, tries - 1, E); });
    });
  }
  function translateAll(texts, eng, code, cfg, progress) {           // every different text once; texts already translated before are taken from the cache
    var E = TR_ENGINES[eng], uniq = Array.from(new Set(texts)), map = {};
    var ck = function (t) { return eng + "|" + code + "|" + t; };
    return idbGetMany("trcache", uniq.map(ck)).then(function (hit) {
      var todo = []; uniq.forEach(function (t) { var h = hit[ck(t)]; if (h) map[t] = h.v; else todo.push(t); });
      var done = uniq.length - todo.length, batches = [], cur = [], chars = 0;
      todo.forEach(function (t) { if (cur.length >= E.batch || chars + t.length > 4000) { batches.push(cur); cur = []; chars = 0; } cur.push(t); chars += t.length; }); if (cur.length) batches.push(cur);
      progress(done, uniq.length); var next = 0, failed = null;
      function worker() {
        if (failed || TR.cancel || next >= batches.length) return Promise.resolve();
        var b = batches[next++];
        return trRetry(function () { return E.translate(b, code, cfg); }, E.tries || 4, E).then(function (out) {
          if (!out || out.length !== b.length) { var e = new Error("shape"); e.status = 0; throw e; }
          var recs = []; b.forEach(function (t, i) { map[t] = String(out[i] == null ? t : out[i]); recs.push({ k: ck(t), v: map[t] }); });
          done += b.length; progress(done, uniq.length); return idbPutMany("trcache", recs);
        }).then(function () { return E.gap ? sleep(E.gap) : 0; }).then(worker, function (e) { failed = failed || e; });
      }
      return Promise.all(Array.apply(null, Array(E.workers || 3)).map(function () { return worker(); })).then(function () { if (failed) throw failed; if (TR.cancel) { var c = new Error("cancel"); c.cancel = true; throw c; } return map; });
    });
  }

  /* ---------- planning, translating and composing the questions ---------- */
  function qStrings(q) {
    var s = [];
    if (q.cat === "multi") { s.push(q.intro); q.parts.forEach(function (p) { s.push(p.q, p.a); }); }
    else { s.push(q.q); if (q.cat === "mc") q.opts.forEach(function (o) { s.push(o); }); else s.push(q.a); (q.clues || []).forEach(function (c) { s.push(c); }); }
    return s.filter(Boolean);
  }
  function trPlan(baseQs, books, limit) {                            // the questions whose verses are all in this Bible text
    var vi = verseIndex(books), items = [];
    var ot = 0, nt = 0;
    baseQs.forEach(function (q) {
      if (q.lang && q.lang !== "en") return; var p = parseRefs(q.ref, q.book); if (!p.ok) return; var r = resolveRefs(p, books, vi); if (!r.ok) return;
      items.push({ q: q, verse: r.texts.join(" "), refLocal: localRef(q.ref, books) });
      var bk = (p.items[0] && p.items[0].book) || bookByName(q.book); if (BOOKS_OT.indexOf(bk) > -1) ot++; else nt++;
    });
    var eligible = items.length;
    if (limit && eligible > limit) { var step = eligible / limit, pick = []; for (var i = 0; i < limit; i++) pick.push(items[Math.floor(i * step)]); items = pick; }      // a test run is spread over the Bible
    var chars = 0; items.forEach(function (it) { qStrings(it.q).forEach(function (t) { chars += t.length; }); });
    return { items: items, eligible: eligible, base: baseQs.length, chars: chars, ot: ot, nt: nt };
  }
  function shortVerse(t) { t = String(t); if (t.length <= 700) return t; var cut = t.slice(0, 700), sp = cut.lastIndexOf(" "); return (sp > 400 ? cut.slice(0, sp) : cut) + " \u2026"; }
  function composeQuestion(it, get, lang) {                          // one translated question, with the Bible's own wording for the answers where it can be found
    var q = it.q, t = function (x) { return x ? (get(x) || x) : x; }, ok = true, verse = it.verse;
    function ans(en) { var tr = t(en), al = alignAnswer(tr, verse); if (al) return al.text; if (!isNumberish(en)) ok = false; return tr; }
    var n = { lang: lang, book: q.book, cat: q.cat, level: q.level || "", q: t(q.q), a: "", ref: it.refLocal, info: shortVerse(verse), intro: t(q.intro || ""), opts: null, clues: (q.clues || []).map(t), parts: null, pts: q.pts || 0, secs: q.secs || 0,
              refSrc: q.ref, srcQ: q.cat === "multi" ? (q.intro || "") : q.q, srcA: q.cat === "multi" ? q.parts.map(function (p) { return p.a; }).join(" | ") : q.a, verse: verse };
    if (q.cat === "multi") { n.q = ""; n.parts = q.parts.map(function (p) { return { q: t(p.q), a: ans(p.a) }; }); }
    else if (q.cat === "mc") { n.opts = q.opts.map(t); n.correct = q.correct; n.opts[n.correct] = ans(q.opts[q.correct]); n.a = n.opts[n.correct]; }
    else n.a = ans(q.a);
    n.flag = ok ? "ok" : "check"; if (ok) delete n.verse; return n;                // the full verse is kept only for the questions that need a check (smaller banks)
  }
  function trRun(plan, eng, code, cfg, lang, progress) {
    var texts = []; plan.items.forEach(function (it) { qStrings(it.q).forEach(function (s) { texts.push(s); }); });
    return translateAll(texts, eng, code, cfg, progress).then(function (map) {
      var qs = plan.items.map(function (it) { return composeQuestion(it, function (x) { return map[x]; }, lang); });
      return { questions: qs, ok: qs.filter(function (q) { return q.flag === "ok"; }).length, check: qs.filter(function (q) { return q.flag === "check"; }).length };
    });
  }
  function trSave(res, name, source, lang) {
    var doc = makeBankDoc(uniqueName(name), res.questions, source, lang); doc.flagged = res.check; return libStore(doc).then(function () { return doc; });
  }

  /* ---------- the Excel route: a person translates the English questions, the app adds the Bible wording ---------- */
  function trExportExcel(plan, label, code) {
    var aoa = bankToAoa(plan.items.map(function (it) { return it.q; })); for (var i = 1; i < aoa.length; i++) aoa[i][0] = label;
    return ensureXlsx().then(function () { var X = window.XLSX, wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(aoa), "Questions"); return saveFile("obq-translate-to-" + slugOf(label) + ".xlsx", new Uint8Array(X.write(wb, { type: "array", bookType: "xlsx" })), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); });
  }
  function trImportExcel(file, books, lang) {
    return readExcelRows(file).then(function (rows) {
      var res = parseRows(rows); if (!res || !res.ok.length) return null; var vi = verseIndex(books);
      var qs = res.ok.map(function (q) {
        var p = parseRefs(q.ref, q.book), r = p.ok ? resolveRefs(p, books, vi) : { ok: false, texts: [] };
        if (!r.ok) { q.lang = lang; q.flag = "check"; q.refSrc = q.ref; return q; }
        var it = { q: q, verse: r.texts.join(" "), refLocal: localRef(q.ref, books) }, n = composeQuestion(it, function (x) { return x; }, lang); n.srcQ = ""; n.srcA = ""; return n;
      });
      return { questions: qs, ok: qs.filter(function (q) { return q.flag !== "check"; }).length, check: qs.filter(function (q) { return q.flag === "check"; }).length, skipped: res.skipped.length };
    });
  }

  /* ---------- the "Make questions" window of a Bible text ---------- */
  function trBaseChoices() {
    var out = [{ id: "core", name: T("libCore"), n: starter().length }];
    if (hasStarterExtra()) out.push({ id: "starter", name: T("libStarter"), n: sampleQs().length });
    libList().forEach(function (m) { if (m.lang === "en") out.push({ id: m.bid, name: m.name, n: m.count }); });
    return out;
  }
  function trEngineUi() {
    var e = $("trEngine").value, manual = e === "manual", noChrome = e === "chrome" && !("Translator" in self);
    $("trKeyWrap").hidden = manual || e === "chrome"; $("trRegionWrap").hidden = e !== "microsoft"; $("trUrlWrap").hidden = e !== "libre"; $("trModelWrap").hidden = e !== "gemini";
    $("trAutoRow").hidden = manual; $("trManualRow").hidden = !manual;
    $("trEngineNote").textContent = T(noChrome ? "trNote_chrome_no" : "trNote_" + e);
    $("trKeyWrap").querySelector("label").textContent = T(e === "libre" ? "trKeyOpt" : (e === "gemini" ? "trKeyGemini" : "trKey"));
    trRefreshPlan(); if (noChrome) $("trStart").disabled = true;
  }
  function trRefreshPlan() {
    if (!TR.kb) return; var base = bankQuestions($("trBase").value); TR.plan = trPlan(base, TR.books || {}, $("trTest").checked ? 20 : 0);
    $("trCover").textContent = T("trCover", { n: TR.plan.eligible, m: TR.plan.base, k: TR.plan.items.length });
    $("trSplit").textContent = T("trSplit", { a: TR.plan.ot, b: TR.plan.nt });
    $("trCost").textContent = $("trEngine").value === "manual" ? "" : ($("trEngine").value === "chrome" ? T("trCostChrome") : T("trCost", { c: TR.plan.chars.toLocaleString() }));
    $("trStart").disabled = !TR.plan.items.length;
  }
  function openTranslate(m) {
    TR.kb = m; TR.busy = false; TR.cancel = false; TR.books = null; TR.plan = null;
    $("trResult").textContent = ""; $("trResult").className = "note"; $("trWork").hidden = true; $("trForm").hidden = false; $("trReview").hidden = true; $("trKey").value = "";
    $("trIntro").textContent = T("trIntro", { b: m.name, l: m.langLabel || m.lang });
    $("trCode").value = TR_CODES[m.lang] || TR_CODES[String(m.langLabel || "").toLowerCase()] || (String(m.lang).length <= 3 ? m.lang : "");
    var sel = $("trBase"); clear(sel); trBaseChoices().forEach(function (b) { var o = el("option", null, b.name + " (" + b.n + ")"); o.value = b.id; sel.appendChild(o); });
    $("trModal").hidden = false; trEngineUi(); $("trCover").textContent = "...";
    kbLoadMerged(m.lang).then(function (books) { TR.books = books; trRefreshPlan(); });
  }
  function closeTranslate() { if (TR.busy) TR.cancel = true; $("trKey").value = ""; $("trModal").hidden = true; }
  function trFail(e) {
    if (e && e.chrome) return T(e.chrome === "NotAllowedError" ? "trErrChromeGesture" : (e.chrome === "NotSupportedError" ? "trErrChromeLang" : "trErrChrome"));
    if (e && e.status === 400 && TR.engine === "gemini") return T("trErrGemini400");
    var st = e && e.status, k = e && e.cancel ? "trCancelled" : (st === 401 || st === 403 ? "trErrKey2" : (st === 400 ? "trErrBad" : (st === 429 ? "trErrLimit" : "trErrNet"))); return T(k);
  }
  function trShowDone(r, doc, skipped) {
    var res = $("trResult"); res.className = "okmsg"; clear(res);
    res.appendChild(el("div", "okmsg", T("trDone", { name: doc.name, n: r.questions.length, ok: r.ok, c: r.check })));
    if (skipped) res.appendChild(el("div", "note", T("upSkip", { n: skipped })));
    if (r.check) { var b = $("trReview"); b.hidden = false; b.textContent = T("libReview", { n: r.check }); b.onclick = function () { closeTranslate(); openReview(doc.bid); }; }
    track("bank_translate", { count: r.questions.length, check: r.check });
  }
  function trStart() {
    var eng = $("trEngine").value, code = normName($("trCode").value).toLowerCase(), res = $("trResult"), cfg = { key: $("trKey").value.trim(), region: normName($("trRegion").value), url: normName($("trUrl").value), model: normName($("trModel").value), langName: (TR.kb && (TR.kb.langLabel || TR.kb.lang)) || code };
    TR.engine = eng; chromeTr = {};
    res.className = "err"; res.textContent = "";
    if (!TR.plan || !TR.plan.items.length) { res.textContent = T("trNoItems"); return; }
    if (!code) { res.textContent = T("trErrCode"); return; }
    if ((eng === "google" || eng === "microsoft" || eng === "gemini") && !cfg.key) { res.textContent = T("trErrNoKey"); return; }
    if (eng === "chrome") { if (!("Translator" in self)) { res.textContent = T("trErrChromeNo"); return; } chromeTranslator(code).catch(function () {}); }          // the language pack download is started now, while the click is fresh
    if (eng === "libre" && !/^https?:\/\//i.test(cfg.url)) { res.textContent = T("trErrUrl"); return; }
    res.className = "note"; TR.busy = true; TR.cancel = false; $("trForm").hidden = true; $("trWork").hidden = false; $("trBar").max = 1; $("trBar").value = 0; $("trStatus").textContent = T("trWorking");
    var test = $("trTest").checked, lang = TR.kb.lang, name = T("trBankName", { l: TR.kb.langLabel || lang, b: TR.kb.name }) + (test ? " (" + T("trTestTag") + ")" : "");
    trRun(TR.plan, eng, code, cfg, lang, function (d, t) { $("trBar").max = t || 1; $("trBar").value = d; $("trStatus").textContent = T("trProgress", { d: d, t: t }); })
      .then(function (r) { return trSave(r, name, { type: "translation", baseBank: $("trBase").selectedOptions[0].textContent, engine: TR_ENGINES[eng].name, bibleText: TR.kb.name, bibleId: TR.kb.id, code: code }, lang).then(function (doc) { $("trWork").hidden = true; $("trForm").hidden = false; trShowDone(r, doc, 0); }); })
      .catch(function (e) { $("trWork").hidden = true; $("trForm").hidden = false; res.className = e && e.cancel ? "note" : "err"; res.textContent = trFail(e); })
      .then(function () { TR.busy = false; $("trKey").value = ""; });
  }
  function trDownloadExcel() {
    var code = normName($("trCode").value).toLowerCase(), label = TR.kb.langLabel || TR.kb.lang; if (!TR.plan || !TR.plan.items.length) { $("trResult").className = "err"; $("trResult").textContent = T("trNoItems"); return; }
    trExportExcel(TR.plan, label, code).then(function () { $("trResult").className = "note"; $("trResult").textContent = T("trDlDone"); }).catch(function () { $("trResult").className = "err"; $("trResult").textContent = T("upErr"); });
  }
  function trUploadExcel(file) {
    var res = $("trResult"), lang = TR.kb.lang; res.className = "note"; res.textContent = T("trWorking");
    trImportExcel(file, TR.books || {}, lang).then(function (r) {
      if (!r) { res.className = "err"; res.textContent = T("upErr"); return; }
      var name = T("trBankName", { l: TR.kb.langLabel || lang, b: TR.kb.name }) + " (Excel)";
      return trSave(r, name, { type: "translation", baseBank: "OBQ", engine: "Excel", bibleText: TR.kb.name, bibleId: TR.kb.id }, lang).then(function (doc) { trShowDone(r, doc, r.skipped); });
    }).catch(function () { res.className = "err"; res.textContent = T("upErr"); });
  }

  /* ---------- reviewing the questions that need a check ---------- */
  var RV = { bid: "", doc: null, items: [], page: 0, per: 8 };
  function openReview(bid) {
    var doc = libDoc(bid); if (!doc) return; RV.bid = bid; RV.doc = doc; RV.page = 0; RV.items = doc.questions.filter(function (q) { return q.flag === "check"; });
    $("rvTitle").textContent = T("rvTitle", { name: doc.name }); $("rvMsg").textContent = ""; $("rvModal").hidden = false; paintReview();
  }
  function rvPick(wrap, q, item) {                                   // tap the words of the Bible verse to use them as the answer
    var words = String(q.verse || q.info || "").split(/\s+/).filter(Boolean), start = -1, spans = [];
    words.forEach(function (w, i) {
      var s = el("span", "rvw", w + " "); s.addEventListener("click", function () {
        if (start < 0) { start = i; spans.forEach(function (x, k) { x.classList.toggle("on", k === i); }); return; }
        var a = Math.min(start, i), b = Math.max(start, i); start = -1; spans.forEach(function (x, k) { x.classList.toggle("on", k >= a && k <= b); });
        item.setAnswer(core(words.slice(a, b + 1).join(" ")));
      }); spans.push(s); wrap.appendChild(s);
    });
  }
  function rvItem(q) {
    var d = el("div", "rvq"), item = { active: null, setAnswer: function () {} };
    d.appendChild(el("div", "note rven", T("rvEnglish") + " " + (q.srcQ || "") + (q.srcA ? "  \u2192  " + q.srcA : "") + (q.refSrc ? "  (" + q.refSrc + ")" : "")));
    function field(label, val, onSet, area) {
      var f = el("div", "field"); f.appendChild(el("label", null, label)); var inp = el(area ? "textarea" : "input"); if (!area) inp.type = "text"; else inp.rows = 2; inp.value = val || "";
      inp.addEventListener("input", function () { onSet(inp.value); }); inp.addEventListener("focus", function () { item.active = { inp: inp, set: onSet }; }); f.appendChild(inp); d.appendChild(f); return { inp: inp, set: onSet };
    }
    var first = null;
    if (q.cat === "multi") {
      field(T("rvIntro"), q.intro, function (v) { q.intro = v; }, true);
      q.parts.forEach(function (p, i) { field(T("rvPartQ", { n: i + 1 }), p.q, function (v) { p.q = v; }); var a = field(T("rvPartA", { n: i + 1 }), p.a, function (v) { p.a = v; }); if (!first) first = a; });
    } else {
      field(T("rvQuestion"), q.q, function (v) { q.q = v; }, true);
      if (q.cat === "mc") q.opts.forEach(function (o, i) { if (i !== q.correct) field(T("rvOption", { n: i + 1 }), o, function (v) { q.opts[i] = v; }); });
      first = field(T("rvAnswer"), q.a, function (v) { q.a = v; if (q.cat === "mc") q.opts[q.correct] = v; });
    }
    item.active = first ? { inp: first.inp, set: first.set } : null;
    item.setAnswer = function (v) { var tgt = item.active || first; if (!tgt) return; tgt.inp.value = v; tgt.set(v); };
    d.appendChild(el("div", "note", T("rvVerse"))); var vw = el("div", "rvverse"); rvPick(vw, q, item); d.appendChild(vw);
    var row = el("div", "row"), ok = el("button", "ghost sm", T("rvOk")), rm = el("button", "ghost sm danger", T("rvRemove")); ok.type = rm.type = "button";
    ok.addEventListener("click", function () { q.flag = "ok"; RV.items = RV.items.filter(function (x) { return x !== q; }); paintReview(); });
    rm.addEventListener("click", function () { q._rm = true; RV.items = RV.items.filter(function (x) { return x !== q; }); paintReview(); });
    row.appendChild(ok); row.appendChild(rm); d.appendChild(row); return d;
  }
  function paintReview() {
    var box = $("rvList"); clear(box); var n = RV.items.length, pages = Math.max(1, Math.ceil(n / RV.per)); RV.page = Math.min(RV.page, pages - 1);
    $("rvInfo").textContent = n ? T("rvInfo", { n: n }) : T("rvNone"); RV.items.slice(RV.page * RV.per, RV.page * RV.per + RV.per).forEach(function (q) { box.appendChild(rvItem(q)); });
    $("rvPage").textContent = n ? T("rvPage", { a: RV.page + 1, b: pages }) : ""; $("rvPrev").disabled = RV.page <= 0; $("rvNext").disabled = RV.page >= pages - 1;
  }
  function rvSave() {
    var doc = RV.doc; if (!doc) return; doc.questions = doc.questions.filter(function (q) { return !q._rm; }); doc.questions.forEach(function (q) { delete q._rm; });
    doc.count = doc.questions.length; doc.flagged = doc.questions.filter(function (q) { return q.flag === "check"; }).length; doc.updated = new Date().toISOString();
    libStore(doc).then(function () { $("rvMsg").className = "okmsg"; $("rvMsg").textContent = T("rvSaved"); });
  }
  function wireTranslate() {
    $("trEngine").addEventListener("change", trEngineUi); $("trBase").addEventListener("change", trRefreshPlan); $("trTest").addEventListener("change", trRefreshPlan);
    $("trStart").addEventListener("click", trStart); $("trCancel").addEventListener("click", function () { TR.cancel = true; $("trStatus").textContent = T("trStopping"); });
    $("trClose").addEventListener("click", closeTranslate); $("trDlXl").addEventListener("click", trDownloadExcel); $("trUpXl").addEventListener("click", function () { $("trXlFile").click(); });
    $("trXlFile").addEventListener("change", function () { var f = $("trXlFile").files && $("trXlFile").files[0]; $("trXlFile").value = ""; if (f) trUploadExcel(f); });
    $("trModal").addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); closeTranslate(); } });
    $("rvClose").addEventListener("click", function () { $("rvModal").hidden = true; }); $("rvSave").addEventListener("click", rvSave);
    $("rvPrev").addEventListener("click", function () { RV.page--; paintReview(); }); $("rvNext").addEventListener("click", function () { RV.page++; paintReview(); });
    $("rvModal").addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); $("rvModal").hidden = true; } });
  }
