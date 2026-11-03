
  /* =====================================================================
     SAVED QUIZZES: reusable templates, scheduled events, frozen questions
     Kept per Quiz Master on this device and, in Firebase mode, in quizMasters/{uid}/setups/main
     ===================================================================== */
  var setups = [];
  function setupsKey() { return "qms.setups." + ekey(); }
  function fbSetupsDoc() { return fb.db.collection("quizMasters").doc(user.uid).collection("setups").doc("main"); }
  function persistSetups() {
    lsSet(setupsKey(), setups);
    if (!(fb.on && user && user.uid)) return;
    var s = JSON.stringify(setups);
    if (s.length > 900000) return;                                   // Firestore documents are limited to 1 MB: keep very large sets on this device only
    try { fbSetupsDoc().set({ rows: s, count: setups.length, updated: window.firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {}); } catch (e) {}
  }
  function loadSetups() {
    setups = lsGet(setupsKey(), []); renderSaved();
    if (!(fb.on && user && user.uid) || setups.length) return;
    try {
      fbSetupsDoc().get().then(function (d) {
        if (d && d.exists) { var rows = JSON.parse(d.data().rows || "[]"); if (rows.length && !setups.length) { setups = rows; lsSet(setupsKey(), setups); renderSaved(); } }
      }).catch(function () {});
    } catch (e) {}
  }
  function freezeKey(c) { return JSON.stringify([c.quizLang, c.scope, c.books, c.numQ, c.source, c.bankId || "", c.style || "normal"]); }

  /* picks the questions for a setup (used when freezing); resolves to rounds, or null when nothing matches */
  function buildRounds(c) {
    quizLang = c.quizLang;
    if (c.source === "kb") {
      return kbLoadMerged(c.quizLang).then(function (books) {
        var qs = genKbQuestions(books, scopeCodes(c), c.numQ, c.quizLang, c.style);
        return qs.length ? finalizeRounds(qs.map(toRound)) : null;
      }).catch(function () { return null; });
    }
    if (c.source === "builtin" && c.quizLang !== "en") return Promise.resolve(null);
    var pool = buildPool(c);
    return Promise.resolve(pool.length ? finalizeRounds(pickForQuiz(pool, c.numQ, c.style).map(toRound)) : null);
  }

  function sortedSetups() {
    return setups.slice().sort(function (a, b) {
      if (a.kind !== b.kind) return a.kind === "event" ? -1 : 1;
      return a.kind === "event" ? String(a.cfg.date).localeCompare(String(b.cfg.date)) : a.name.localeCompare(b.name);
    });
  }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + z2(d.getMonth() + 1) + "-" + z2(d.getDate()); }
  function renderSaved() {
    var box = $("savedList"), up = $("upcoming"); clear(box); up.textContent = "";
    $("savedBox").hidden = !setups.length;
    if (!setups.length) return;
    var today = todayISO(), soon = plusDays(7), notes = [];
    sortedSetups().forEach(function (it) {
      var c = it.cfg, row = el("div", "kbrow"), badge;
      if (it.kind === "event") {
        badge = fmtDate(c.date) + (c.date === today ? " - " + T("ssToday") : (c.date < today ? " - " + T("ssPast") : ""));
        if (c.date >= today && c.date <= soon) notes.push(c.date === today ? T("ssTodayIs", { name: it.name }) : T("ssUpcoming", { name: it.name, date: fmtDate(c.date) }));
      } else badge = T("ssTplBadge");
      row.appendChild(el("div", "kbname", it.name + "  -  " + badge));
      row.appendChild(el("div", "note", [scopeLabel(c), T("ssQs", { n: it.frozen ? it.frozen.length : c.numQ }), c.quizLangLabel || langLabel(c.quizLang)].concat(c.style === "simple" ? [T("styleSimple")] : []).concat(it.frozen ? [T("ssFrozen")] : []).join("  -  ")));
      var start = el("button", "primary sm", T("ssStart")); start.type = "button"; start.addEventListener("click", function () { useSetup(it); onBegin(); });
      var use = el("button", "ghost sm", T("ssOpen")); use.type = "button"; use.addEventListener("click", function () { useSetup(it); });
      var del = el("button", "ghost sm", T("ssDelete")); del.type = "button";
      var armed = null;
      del.addEventListener("click", function () {
        if (!armed) { armed = setTimeout(function () { armed = null; del.textContent = T("ssDelete"); }, 4000); del.textContent = T("ssSure"); return; }
        clearTimeout(armed); setups = setups.filter(function (s) { return s.id !== it.id; }); persistSetups(); renderSaved();
      });
      var act = el("div", "row"); act.appendChild(start); act.appendChild(use); act.appendChild(del); row.appendChild(act); box.appendChild(row);
    });
    up.textContent = notes.join("\n"); up.style.whiteSpace = "pre-line";
  }
  function useSetup(it) {
    var c = it.cfg;
    $("fQM").value = c.qm || (user && user.name) || ""; $("fEvent").value = c.event || "";
    $("fDate").value = (it.kind === "event" && c.date) ? c.date : todayISO(); $("fParts").value = c.parts || "";
    sel.mode = c.mode || "individual"; sel.style = c.style || "normal"; if (c.numQ) sel.numQ = c.numQ;
    if (langInfo(c.quizLang).code === c.quizLang) quizLangPick = c.quizLang; else { quizLangPick = "other"; $("fOtherLang").value = c.quizLangLabel || c.quizLang; }
    $("fScope").value = c.scope === "b3" ? "bmore" : (c.scope || "");
    bookBoxes().forEach(function (cb) { cb.checked = (c.books || []).indexOf(cb.value) > -1; });
    if (c.source === "kb") $("srcK").checked = true; else if (c.source === "bank") { $("srcU").checked = true; paintBankPick(); if (c.bankId && bankChoices().some(function (b) { return b.id === c.bankId; })) $("fBankPick").value = c.bankId; } else if (S.builtInBank) $("srcB").checked = true;
    $("fSaveRes").checked = c.saveResults !== false; $("fRead").checked = !!c.readAloud;
    sel.frozen = it.frozen || null; sel.frozenKey = it.frozen ? freezeKey(c) : "";
    ["fQM", "fEvent", "fParts", "fScope", "fOtherLang"].forEach(function (id) { markBad(id, false); });
    paintSelects(); refreshBooks(); $("setupErr").textContent = ""; $("ssMsg").textContent = ""; $("saveForm").hidden = true;
    var m = $("availTxt"); refreshAvail(); m.textContent = T("ssLoaded", { name: it.name }) + (m.textContent ? "  " + m.textContent : "");
    window.scrollTo(0, 0);
  }
  function saveCurrentSetup() {
    var c = readCfg(), msg = $("ssMsg"), kind = $("ssEvt").checked ? "event" : "template", errs = [];
    var name = normName($("ssName").value) || c.event;
    if (!name) errs.push(T("ssName"));
    if (!c.quizLang) errs.push(T("errOtherLang"));
    if (!c.scope) errs.push(T("errScope"));
    else if (!scopeComplete(c)) { var lim = limitFor(c.scope); errs.push(lim ? T("pickExact", { n: lim, a: c.books.length }) : T("pickMin", { n: 3, a: c.books.length })); }
    if (kind === "event" && !c.event) errs.push(T("errEvent"));
    if (errs.length) { msg.className = "err"; msg.textContent = errs.join("\n"); return; }
    var item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: name, kind: kind, savedAt: Date.now(), frozen: null,
      cfg: { qm: c.qm, event: c.event, date: kind === "event" ? c.date : "", parts: c.parts, quizLang: c.quizLang, quizLangLabel: c.quizLangLabel, mode: c.mode, style: c.style,
             scope: c.scope, books: c.books, numQ: c.numQ, source: c.source, bankId: c.bankId || "", saveResults: c.saveResults, readAloud: c.readAloud }
    };
    var commit = function () {
      setups = setups.filter(function (s) { return s.name.toLowerCase() !== name.toLowerCase(); }); setups.push(item); persistSetups(); renderSaved();
      track("setup_saved", { kind: kind, frozen: !!item.frozen });
      clearSetup(); $("savedMsg").textContent = T("ssSaved", { name: name }) + " " + T("ssCleared");
    };
    if (!$("ssFreeze").checked) { commit(); return; }
    msg.className = "note"; msg.textContent = "...";
    buildRounds(c).then(function (rounds) {
      if (!rounds) { msg.className = "err"; msg.textContent = c.source === "kb" ? T("kbNone") : (c.source === "bank" && !bankQuestions(c.bankId).length ? T("noBank") : T("availNone")); return; }
      item.frozen = rounds; commit();
    });
  }
  /* Clears the setup form after a quiz is saved or finished. Kept: the Quiz Master name and the interface language. */
  var clearOnNextSetup = false;
  function clearSetup() {
    ["fEvent", "fParts", "fOtherLang", "ssName"].forEach(function (id) { $(id).value = ""; markBad(id, false); });
    $("fDate").value = todayISO(); markBad("fScope", false);
    quizLangPick = S.defaultQuizLang; sel.mode = "individual"; sel.style = "normal"; sel.numQ = S.questionCounts[0]; sel.frozen = null; sel.frozenKey = ""; sel.ack = false;
    $("fScope").value = ""; bookBoxes().forEach(function (cb) { cb.checked = false; });
    if (S.builtInBank) $("srcB").checked = true; else $("srcU").checked = true;
    $("fSaveRes").checked = true; $("fRead").checked = false; $("ssTpl").checked = true; $("ssFreeze").checked = false;
    $("saveForm").hidden = true; $("ssMsg").textContent = ""; $("setupErr").textContent = "";
    paintSelects(); refreshBooks();
  }
  /* The quiz that was just played, saved as a template with its exact questions, so it can be redone later */
  function saveFinished() {
    if (!cfg || cfg.sample || !ROUNDS.length) return;
    var base = normName(cfg.event) || "Quiz", name = base, n = 2;
    while (setups.some(function (s) { return s.name.toLowerCase() === name.toLowerCase(); })) name = base + " (" + (n++) + ")";
    setups.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: name, kind: "template", savedAt: Date.now(),
      cfg: { qm: cfg.qm, event: cfg.event, date: "", parts: cfg.parts, quizLang: cfg.quizLang, quizLangLabel: cfg.quizLangLabel, mode: cfg.mode, style: cfg.style, scope: cfg.scope, books: cfg.books || [], numQ: cfg.numQ, source: cfg.source, saveResults: cfg.saveResults, readAloud: cfg.readAloud },
      frozen: JSON.parse(JSON.stringify(ROUNDS))
    });
    persistSetups(); renderSaved(); $("saveRedo").hidden = true; $("exportMsg").textContent = T("ssRedoSaved", { name: name }); track("setup_saved", { kind: "finished", frozen: true });
  }
  function wireSaved() {
    $("saveRedo").addEventListener("click", saveFinished);
    $("saveSetupBtn").addEventListener("click", function () {
      var f = $("saveForm"); f.hidden = !f.hidden; $("ssMsg").textContent = "";
      if (!f.hidden && !$("ssName").value) $("ssName").value = normName($("fEvent").value);
    });
    $("ssSave").addEventListener("click", saveCurrentSetup);
  }
