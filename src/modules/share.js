/* @module {"name":"share","exports":["shOnline","openBankShare","bankShareStop","paintAdminBanks","wireShare","paintShareNeeds"],"uses":["$","T","TR_CODES","bankStats","cleanQ","clear","dateOf","el","fb","iso","langInfo","langLabel","libButton","libDoc","libList","libSay","libStore","makeBankDoc","paintLibrary","track","tsOf","uniqueName","user"]} */
  var shArmed = null;                                                // the two-click delete of a shared bank in Admin

  /* =====================================================================
     SHARE A QUESTION BANK WITH OTHER QUIZ MASTERS, and import the banks that others shared
     A shared bank is stored in the OBQ Firebase project (collection "sharedBanks"): one document with the facts about the bank (name, language, ISO code,
     number of questions, who shared it) and "chunks" documents with the questions (as compressed JSON text). Every signed-in Quiz Master can list the shared banks
     in the Bible Knowledge Base and add one to their own offline question banks. The Bible text of the Bible versions is NOT shared unless the owner says
     they may. An administrator can hide or remove a bank (Admin screen).
     ===================================================================== */
  var SH = { bid: "", list: [], busy: false };
  var SHARE_CHUNK = 700000, SHARE_MAX_Q = 3000, SHARE_MAX_CHUNKS = 4, SHARE_SLOTS = 10;           // at most 10 shared banks per Quiz Master, 4 chunks each (the database rules say the same)
  function shOnline() { return !!(fb.on && user && user.uid); }
  function shCol() { return fb.db.collection("sharedBanks"); }
  function b64FromBytes(u8) { var s = "", i; for (i = 0; i < u8.length; i += 30000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 30000)); return btoa(s); }
  function bytesFromB64(b) { var s = atob(b), u = new Uint8Array(s.length), i; for (i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function gzipText(text) {                                          // JSON text -> compressed text (or the plain text when this browser cannot compress)
    if (typeof CompressionStream === "undefined") return Promise.resolve({ enc: "json", data: text });
    var cs = new CompressionStream("gzip"), w = cs.writable.getWriter(); w.write(new TextEncoder().encode(text)); w.close();
    return new Response(cs.readable).arrayBuffer().then(function (buf) { return { enc: "gzip64", data: b64FromBytes(new Uint8Array(buf)) }; });
  }
  function gunzipText(enc, data) {
    if (enc === "json") return Promise.resolve(data);
    if (typeof DecompressionStream === "undefined") return Promise.reject(new Error("nodecomp"));
    var ds = new DecompressionStream("gzip"), w = ds.writable.getWriter(); w.write(bytesFromB64(data)); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (buf) { return new TextDecoder("utf-8").decode(buf); });
  }
  function isoOfBank(m) {                                            // the language code (ISO 639) of a bank, as far as it is known
    var s = m.source || {}; if (s.code) return String(s.code).toLowerCase();
    var li = langInfo(m.lang); if (li && li.code && li.code.length <= 3 && li.code !== "other") return li.code;
    var k = TR_CODES[String(m.lang || "").toLowerCase()]; return k || (String(m.lang || "").length <= 3 ? String(m.lang || "").toLowerCase() : "");
  }
  function shErr(e) { return T(e && e.code === "permission-denied" ? "shNoRules" : (e && e.message === "big" ? "shTooBig" : (e && e.message === "slots" ? "shSlotsFull" : "shFail"))); }

  /* ---------- sharing ---------- */
  function openBankShare(bid) {
    var doc = libDoc(bid); if (!doc || !shOnline()) return; SH.bid = bid;
    var qs = doc.questions || [], check = qs.filter(function (q) { return q.flag === "check"; }).length, isTr = (doc.source || {}).type === "translation";
    $("shTitle").textContent = T("shTitle", { name: doc.name }); $("shInfo").textContent = T("shInfo", { n: qs.length, l: langLabel(doc.lang) || doc.lang });
    $("shIso").value = isoOfBank(doc); $("shNotes").value = ""; $("shConsent").checked = false; $("shVerseWrap").hidden = !isTr; $("shVerse").checked = false;
    $("shCheckWrap").hidden = !check; $("shCheck").checked = false; $("shCheckTxt").textContent = T("shCheck", { n: check });
    $("shMsg").className = "note"; $("shMsg").textContent = ""; $("shSend").disabled = false; $("shModal").hidden = false; setTimeout(function () { $("shIso").focus(); }, 40);
  }
  function closeBankShare() { $("shModal").hidden = true; }
  function bankShareList(doc, o) {                                       // what is sent: no verse text unless allowed, no unchecked machine translations unless allowed
    var isTr = (doc.source || {}).type === "translation", out = [];
    (doc.questions || []).forEach(function (q) {
      if (q.flag === "check" && !o.withCheck) return; var c = JSON.parse(JSON.stringify(q));
      delete c.verse; delete c.srcQ; delete c.srcA; delete c.refSrc; if (isTr && !o.withVerse) c.info = ""; out.push(c);
    });
    return out;
  }
  function bankShareSend() {
    var doc = libDoc(SH.bid), m = $("shMsg"), iso = $("shIso").value.trim().toLowerCase(); m.className = "err"; m.textContent = "";
    if (!doc || !shOnline()) return;
    if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(iso)) { m.textContent = T("shErrIso"); return; }
    if (!$("shConsent").checked) { m.textContent = T("shErrConsent"); return; }
    var o = { withVerse: $("shVerse").checked, withCheck: $("shCheck").checked }, qs = bankShareList(doc, o);
    if (!qs.length) { m.textContent = T("shErrNone"); return; } if (qs.length > SHARE_MAX_Q) { m.textContent = T("shTooBig"); return; }
    var src = doc.source || {}, F = window.firebase.firestore.FieldValue, id = "";
    m.className = "note"; m.textContent = T("shSending"); $("shSend").disabled = true;
    var slotOf = function (docId) { var k = /_s(\d+)$/.exec(String(docId || "")); return k ? parseInt(k[1], 10) : 0; };
    shCol().where("owner", "==", user.uid).get().then(function (snap) {                   // which of my 10 places are in use
      var used = {}; (snap.docs || []).forEach(function (d) { used[slotOf(d.id)] = 1; }); var mine = doc.shared && slotOf(doc.shared.id), n = mine && used[mine] !== undefined ? mine : 0;
      if (!n) { for (var k = 1; k <= SHARE_SLOTS; k++) if (!used[k]) { n = k; break; } }
      if (!n) { var e = new Error("slots"); throw e; } id = user.uid + "_s" + n;
    }).then(function () { return gzipText(JSON.stringify(qs)); }).then(function (z) {
      var chunks = []; for (var i = 0; i < z.data.length; i += SHARE_CHUNK) chunks.push(z.data.slice(i, i + SHARE_CHUNK));
      if (chunks.length > SHARE_MAX_CHUNKS) throw new Error("big");
      return shCol().doc(id).get().then(function (old) {
        var od = old && old.exists ? old.data() : null, ref = shCol().doc(id).collection("chunks"), rev = (od && doc.shared && doc.shared.rev && od.rev === doc.shared.rev) ? od.rev : Math.random().toString(36).slice(2, 10);
        var meta = { owner: user.uid, ownerName: String(user.name || "").slice(0, 80), ownerOrg: String(user.org || "").slice(0, 80), name: String(doc.name).slice(0, 80), lang: String(doc.lang || "").slice(0, 40), langLabel: String(langLabel(doc.lang) || doc.lang || "").slice(0, 60),
          iso: iso, count: qs.length, cats: bankStats(qs), bibleText: String(src.bibleText || "").slice(0, 80), engine: String(src.engine || "").slice(0, 60), kind: String(src.type || "").slice(0, 20),
          flagged: qs.filter(function (q) { return q.flag === "check"; }).length, hasVerse: !!o.withVerse, notes: $("shNotes").value.trim().slice(0, 300), chunks: chunks.length, size: z.data.length, enc: z.enc, rev: rev,
          hidden: od ? !!od.hidden : false, downloads: od ? (od.downloads || 0) : 0, createdAt: od ? od.createdAt : F.serverTimestamp(), updatedAt: F.serverTimestamp() };
        return Promise.all(chunks.map(function (c, k) { return ref.doc("c" + k).set({ i: k, data: c }); })).then(function () { return shCol().doc(id).set(meta); }).then(function () {
          var extra = []; if (od) for (var k = chunks.length; k < (od.chunks || 0); k++) extra.push(ref.doc("c" + k).delete()); return Promise.all(extra);
        }).then(function () { doc.shared = { id: id, rev: rev, at: new Date().toISOString(), count: qs.length, iso: iso }; return libStore(doc); });
      });
    }).then(function () { m.className = "okmsg"; m.textContent = T("shDone", { n: qs.length }); track("bank_shared", { count: qs.length, iso: iso }); setTimeout(closeBankShare, 1800); })
      .catch(function (e) { m.className = "err"; m.textContent = shErr(e); $("shSend").disabled = false; });
  }
  function bankShareStop(bid) {                                          // the bank is removed from the server; the owner keeps their own copy
    var doc = libDoc(bid); if (!doc || !doc.shared || !shOnline()) return; var id = doc.shared.id, ref = shCol().doc(id).collection("chunks");
    shCol().doc(id).get().then(function (d) { var n = d && d.exists ? (d.data().chunks || 0) : 0, dels = []; for (var k = 0; k < n; k++) dels.push(ref.doc("c" + k).delete()); return Promise.all(dels); })
      .then(function () { return shCol().doc(id).delete(); }).then(function () { doc.shared = null; return libStore(doc); }).then(function () { libSay(T("shStopped")); paintLibrary(); })
      .catch(function (e) { libSay(shErr(e)); paintLibrary(); });
  }

  /* ---------- the list of shared banks and importing one ---------- */
  function tsMs(v) { var d = tsOf(v); return d ? d.getTime() : 0; }
  function openImport() {
    if (!shOnline()) return; $("imModal").hidden = false; $("imMsg").className = "note"; $("imMsg").textContent = T("imLoading"); clear($("imTable")); SH.list = [];
    shCol().where("hidden", "==", false).limit(300).get().then(function (snap) {
      SH.list = (snap.docs || []).map(function (d) { return Object.assign({ id: d.id }, d.data()); }).sort(function (a, b) { return tsMs(b.updatedAt) - tsMs(a.updatedAt); });
      var sel = $("imLang"), keep = sel.value, seen = {}; clear(sel); var all = el("option", null, T("imAllLang")); all.value = ""; sel.appendChild(all);
      SH.list.forEach(function (b) { var k = b.iso || b.lang; if (seen[k]) return; seen[k] = 1; var o = el("option", null, (b.langLabel || b.lang) + (b.iso ? " (" + b.iso + ")" : "")); o.value = k; sel.appendChild(o); });
      if (keep) sel.value = keep; paintImport();
    }).catch(function (e) { $("imMsg").className = "err"; $("imMsg").textContent = shErr(e); });
  }
  function importedIds() { var ids = {}; libList().forEach(function (m) { if (m.source && m.source.sharedId) ids[m.source.sharedId + "|" + (m.source.sharedRev || "")] = 1; }); return ids; }
  function paintImport() {
    var tb = $("imTable"); clear(tb); var lang = $("imLang").value, f = $("imFind").value.trim().toLowerCase(), have = importedIds();
    var rows = SH.list.filter(function (b) { return (!lang || (b.iso || b.lang) === lang) && (!f || (b.name + " " + b.ownerName + " " + b.ownerOrg + " " + (b.notes || "") + " " + (b.langLabel || "") + " " + (b.iso || "")).toLowerCase().indexOf(f) > -1); });
    $("imMsg").className = "note"; $("imMsg").textContent = SH.list.length ? T("imCount", { n: rows.length, m: SH.list.length }) : T("imNone");
    if (!rows.length) return;
    var hr = el("tr"); ["imName", "imLangCol", "imQs", "imBy", "imDate", "imDetails", ""].forEach(function (h) { hr.appendChild(el("th", null, h ? T(h) : "")); }); tb.appendChild(hr);
    rows.forEach(function (b) {
      var tr = el("tr"); tr.setAttribute("data-shared", b.id);
      tr.appendChild(el("td", "libn", b.name)); tr.appendChild(el("td", null, (b.langLabel || b.lang) + (b.iso ? " (" + b.iso + ")" : ""))); tr.appendChild(el("td", null, String(b.count)));
      tr.appendChild(el("td", null, (b.ownerName || "-") + (b.ownerOrg ? " - " + b.ownerOrg : ""))); tr.appendChild(el("td", null, dateOf(iso(b.updatedAt))));
      var det = []; if (b.kind === "translation") det.push(T("shKindTr", { b: b.bibleText || "-", e: b.engine || "-" })); else if (b.kind === "excel") det.push(T("shKindExcel")); if (b.flagged) det.push(T("shFlagged", { n: b.flagged })); if (b.hasVerse) det.push(T("shHasVerse"));
      if (b.downloads) det.push(T("shDownloads", { n: b.downloads })); if (b.notes) det.push(b.notes); tr.appendChild(el("td", "note", det.join(" | ")));
      var td = el("td", "libact");
      if (b.owner === user.uid) td.appendChild(el("span", "note", T("imMine")));
      else if (have[b.id + "|" + (b.rev || "")]) td.appendChild(el("span", "note", T("imHave")));
      else td.appendChild(libButton(T("imGet"), function (ev) { importShared(b, ev.target); }));
      tr.appendChild(td); tb.appendChild(tr);
    });
  }
  function importShared(b, btn) {
    var m = $("imMsg"); m.className = "note"; m.textContent = T("imGetting", { name: b.name }); if (btn) btn.disabled = true;
    var ref = shCol().doc(b.id).collection("chunks"), n = Math.max(1, Math.min(SHARE_MAX_CHUNKS, b.chunks || 1)), reads = [];
    for (var k = 0; k < n; k++) reads.push(ref.doc("c" + k).get());
    Promise.all(reads).then(function (snaps) {
      var data = ""; snaps.forEach(function (s) { if (!s || !s.exists) throw new Error("missing"); data += s.data().data; });
      return gunzipText(b.enc || "gzip64", data);
    }).then(function (text) {
      var raw = JSON.parse(text); if (!Array.isArray(raw)) throw new Error("format");
      var ok = [], skipped = 0; raw.slice(0, SHARE_MAX_Q).forEach(function (o) { var r = cleanQ(o); if (r.err) skipped++; else ok.push(r.q); });
      if (!ok.length) throw new Error("empty");
      var doc = makeBankDoc(uniqueName(b.name), ok, { type: "shared", sharedId: b.id, sharedRev: b.rev || "", by: b.ownerName || "", org: b.ownerOrg || "", code: b.iso || "", from: b.kind || "", bibleText: b.bibleText || "", engine: b.engine || "" }, b.lang);
      doc.flagged = ok.filter(function (q) { return q.flag === "check"; }).length;
      return libStore(doc).then(function () { return { doc: doc, skipped: skipped }; });
    }).then(function (r) {
      m.className = "okmsg"; m.textContent = T("imAdded", { name: r.doc.name, n: r.doc.count }) + (r.skipped ? " " + T("upSkip", { n: r.skipped }) : ""); paintImport(); track("bank_imported", { count: r.doc.count });
      try { shCol().doc(b.id).update({ downloads: window.firebase.firestore.FieldValue.increment(1) }).catch(function () {}); } catch (e) {}
    }).catch(function (e) { m.className = "err"; m.textContent = e && e.code === "permission-denied" ? T("shNoRules") : T("imFail"); if (btn) btn.disabled = false; });
  }
  function closeImport() { $("imModal").hidden = true; }

  /* ---------- the Admin screen: hide or remove a shared bank ---------- */
  function paintAdminBanks(list) {
    var tb = $("admBanksT"); clear(tb); var hr = el("tr"); ["Name", "Language", "Questions", "Shared by", "Updated", "Downloads", "Visible", ""].forEach(function (h) { hr.appendChild(el("th", null, h)); }); tb.appendChild(hr);
    list.slice(0, 100).forEach(function (b) {
      var tr = el("tr"), td = el("td", "libact"); [b.name, (b.langLabel || b.lang) + (b.iso ? " (" + b.iso + ")" : ""), b.count, (b.ownerName || "") + (b.ownerOrg ? " - " + b.ownerOrg : ""), iso(b.updatedAt), b.downloads || 0, b.hidden ? "hidden" : "visible"].forEach(function (v) { tr.appendChild(el("td", null, String(v == null ? "" : v))); });
      td.appendChild(libButton(b.hidden ? T("admShow") : T("admHide"), function () { shCol().doc(b.id).update({ hidden: !b.hidden }).then(function () { b.hidden = !b.hidden; paintAdminBanks(list); }).catch(function () {}); }));
      var del = libButton(T("libDelete"), function () {
        if (shArmed !== del) { shArmed = del; del.textContent = T("libDeleteSure"); setTimeout(function () { if (shArmed === del) { shArmed = null; del.textContent = T("libDelete"); } }, 4000); return; }
        shArmed = null; var ref = shCol().doc(b.id).collection("chunks"), dels = []; for (var k = 0; k < (b.chunks || 0); k++) dels.push(ref.doc("c" + k).delete());
        Promise.all(dels).then(function () { return shCol().doc(b.id).delete(); }).then(function () { var i = list.indexOf(b); if (i > -1) list.splice(i, 1); paintAdminBanks(list); }).catch(function () {});
      }, "danger"); td.appendChild(del); tr.appendChild(td); tb.appendChild(tr);
    });
  }
  function wireShare() {
    $("shSend").addEventListener("click", bankShareSend); $("shCancel").addEventListener("click", closeBankShare); $("shModal").addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); closeBankShare(); } });
    $("imOpen").addEventListener("click", openImport); $("imClose").addEventListener("click", closeImport); $("imLang").addEventListener("change", paintImport); $("imFind").addEventListener("input", paintImport);
    $("imModal").addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); closeImport(); } });
  }
  function paintShareNeeds() { var on = shOnline(); $("imOpen").disabled = !on; $("imNeed").hidden = on; $("shNeed").hidden = on; }
