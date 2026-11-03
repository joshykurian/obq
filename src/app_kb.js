
  /* =====================================================================
     BIBLE KNOWLEDGE BASE
     Reads USFM / USFX / USX / plain-text Bibles (single files or .zip), keeps them on this
     device (IndexedDB) and makes quiz questions from the verses.
     ===================================================================== */
  var CODES = "GEN|EXO|LEV|NUM|DEU|JOS|JDG|RUT|1SA|2SA|1KI|2KI|1CH|2CH|EZR|NEH|EST|JOB|PSA|PRO|ECC|SNG|ISA|JER|LAM|EZK|DAN|HOS|JOL|AMO|OBA|JON|MIC|NAM|HAB|ZEP|HAG|ZEC|MAL|MAT|MRK|LUK|JHN|ACT|ROM|1CO|2CO|GAL|EPH|PHP|COL|1TH|2TH|1TI|2TI|TIT|PHM|HEB|JAS|1PE|2PE|1JN|2JN|3JN|JUD|REV".split("|");
  function codeOfEnglish(n) { var i = ALL_BOOKS.indexOf(n); return i < 0 ? "" : CODES[i]; }
  function englishOfCode(c) { var i = CODES.indexOf(c); return i < 0 ? "" : ALL_BOOKS[i]; }
  function codeFromLabel(label) {
    var s = normName(label).toUpperCase().replace(/\.$/, "");
    if (CODES.indexOf(s) > -1) return s;
    var low = normName(label).toLowerCase().replace(/\./g, ""), i;
    for (i = 0; i < ALL_BOOKS.length; i++) if (ALL_BOOKS[i].toLowerCase() === low) return CODES[i];
    var m = /(?:^|[^A-Z0-9])([1-3]?[A-Z]{2,3})(?:[^A-Z]|$)/.exec(String(label).toUpperCase());
    return (m && CODES.indexOf(m[1]) > -1) ? m[1] : "";
  }

  /* ---- USFM ---- */
  var SKIP_TAGS = /^(s\d?|r|d|sp|ms\d?|mr|mt\d?|cl|cp|cd|ca|va|vp|rem|ide|sts|toc\d|imt\d?|is\d?|ip|ipi|im|imi|ipq|imq|ipr|iq\d?|ib|ili\d?|iot|io\d?|iex|imte\d?|ie|periph|b|lit|restore|usfm|sts)$/;
  var PARA_TAGS = /^(p|m|mi|pi\d?|ph\d?|pc|pr|pm[orc]?|nb|q\d?|qr|qc|qm\d?|qd|li\d?|lh|lf|lim\d?|tr|tc\d?)$/;
  function cleanUsfm(s) {
    s = s.replace(/\\(f|fe|x|fig|ef|ex)\s[\s\S]*?\\\1\*/g, " ");          // footnotes, cross references, figures
    s = s.replace(/\\bdit\s*\([^)]*\)\s*\\bdit\*/g, " ");                      // publisher cross-reference notes such as (Ps 47:5)
    s = s.replace(/\\\+?w\s+([^\\|]*?)(\|[^\\]*)?\\\+?w\*/g, "$1");       // \w word|attributes\w*
    s = s.replace(/\\\+?[A-Za-z][A-Za-z0-9]*\*?/g, " ");                   // every other marker (\wj, \nd, \it ...)
    return s.replace(/\s+/g, " ").trim();
  }
  function parseUSFM(text) {
    var lines = text.replace(/^\uFEFF/, "").split(/\r?\n/), code = "", name = "", toc = "", ch = 0, vs = "", buf = null, out = [];
    function flush() { if (buf !== null && ch) { var t = cleanUsfm(buf); if (t) out.push([ch, vs, t]); } buf = null; }
    lines.forEach(function (ln) {
      var m = /^\\([A-Za-z0-9]+)\*?(?:\s(.*))?$/.exec(ln);
      if (!m) { if (buf !== null) buf += " " + ln; return; }
      var tag = m[1], rest = m[2] || "";
      if (tag === "id") { code = rest.trim().split(/\s+/)[0].toUpperCase(); return; }
      if (tag === "h") { name = rest.trim(); return; }
      if (tag === "toc1") { if (!toc) toc = rest.trim(); return; }
      if (tag === "c") { flush(); ch = parseInt(rest, 10) || 0; return; }
      if (tag === "v") {
        flush();
        var vm = /^(\d+[a-z]?)(?:[\u200E\u200F]*[-\u2013][\u200E\u200F]*(\d+[a-z]?))?[\u200E\u200F]*\s*([\s\S]*)$/.exec(rest);
        if (vm) { vs = vm[2] ? vm[1] + "-" + vm[2] : vm[1]; buf = vm[3]; }
        return;
      }
      if (SKIP_TAGS.test(tag)) return;                       // headings and front matter are not verse text
      if (buf === null) return;
      buf += " " + (PARA_TAGS.test(tag) ? rest : ln);        // paragraph markers carry text after them; character/note markers keep their own marker
    });
    flush();
    return { code: code, name: name || toc, verses: out };
  }

  /* ---- USFX / USX (XML) ---- */
  function parseXMLBible(text) {
    var doc = new DOMParser().parseFromString(text, "text/xml"), books = [], cur = null, ch = 0, vs = "", buf = null;
    var SKIPEL = { f: 1, x: 1, fe: 1, note: 1, fig: 1, toc: 1, id: 1, ide: 1, rem: 1, s: 1, s1: 1, s2: 1, s3: 1, r: 1, mt: 1, mt1: 1, mt2: 1, d: 1, cl: 1, ca: 1, cp: 1, cd: 1, sp: 1, ms: 1, ip: 1, is: 1, io: 1, imt: 1, periph: 1, ref: 0 };
    var SKIPSTYLE = /^(s\d?|r|d|sp|ms\d?|mr|mt\d?|cl|cp|cd|ca|rem|ide|toc\d|imt\d?|is\d?|ip|im|io\d?|ib|iot|periph|b|lit)$/;
    function flush() { if (cur && buf !== null && ch) { var t = buf.replace(/\s+/g, " ").trim(); if (t) cur.verses.push([ch, vs, t]); } buf = null; }
    (function walk(n) {
      var c;
      if (n.nodeType === 3) { if (buf !== null) buf += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      var nm = n.nodeName.toLowerCase(), st = n.getAttribute("style") || "";
      if (nm === "book") {
        flush(); cur = { code: (n.getAttribute("id") || n.getAttribute("code") || "").toUpperCase(), name: "", verses: [] }; books.push(cur); ch = 0;
        if (n.getAttribute("code")) return;                                 // USX: the element text is only a description
      }
      if (nm === "h" || (nm === "para" && st === "h")) { if (cur && !cur.name) cur.name = n.textContent.trim(); return; }
      if (nm === "c" || nm === "chapter") { flush(); if (n.getAttribute("eid")) return; ch = parseInt(n.getAttribute("id") || n.getAttribute("number"), 10) || 0; return; }
      if (nm === "ve") { flush(); return; }
      if (nm === "v" || nm === "verse") { flush(); if (n.getAttribute("eid")) return; vs = n.getAttribute("id") || n.getAttribute("number") || ""; buf = ""; return; }
      if (SKIPEL[nm] || (nm === "para" && SKIPSTYLE.test(st)) || (nm === "char" && /^(f|x|fr|fq|ft|xo|xt)/.test(st))) return;
      for (c = n.firstChild; c; c = c.nextSibling) walk(c);
    })(doc.documentElement);
    flush();
    return books.filter(function (b) { return b.code; });
  }

  /* ---- plain text lines such as  "Genesis 1:1 In the beginning ..." ---- */
  function parsePlain(name, text) {
    var map = {}, order = [], fileCode = codeFromLabel(name);
    text.replace(/^\uFEFF/, "").split(/\r?\n/).forEach(function (ln) {
      var m = /^\s*(.*?)\s*(\d+)\s*[:.]\s*(\d+)\s+(\S[\s\S]*)$/.exec(ln);
      if (!m) return;
      var code = m[1] ? codeFromLabel(m[1]) : fileCode;
      if (!code) return;
      if (!map[code]) { map[code] = { code: code, name: "", verses: [] }; order.push(code); }
      map[code].verses.push([parseInt(m[2], 10), m[3], m[4].trim()]);
    });
    return order.map(function (c) { return map[c]; });
  }
  function parseAny(name, text) {
    text = text.replace(/^\uFEFF/, "");
    if (/^\s*</.test(text.slice(0, 500))) return parseXMLBible(text);
    if (/\\id\s/.test(text.slice(0, 3000)) || /\\c\s+\d/.test(text.slice(0, 30000))) { var b = parseUSFM(text); return b.code ? [b] : []; }
    return parsePlain(name, text);
  }

  /* ---- .zip files (stored or deflate), read in the browser ---- */
  function u8text(u8) { return new TextDecoder("utf-8").decode(u8); }
  function readZip(buf) {
    return readZipRaw(buf, /\.(usfm|sfm|usx|usfx|xml|txt|ptx)$/i).then(function (es) { return es.map(function (e) { return { name: e.name, text: u8text(e.bytes) }; }); });
  }
  function readZipRaw(buf, pattern) {
    var u8 = new Uint8Array(buf), dv = new DataView(buf), i = u8.length - 22;
    while (i >= 0 && dv.getUint32(i, true) !== 0x06054b50) i--;
    if (i < 0) return Promise.reject(new Error("not a zip"));
    var n = dv.getUint16(i + 10, true), p = dv.getUint32(i + 16, true), list = [], k;
    for (k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      var nl = dv.getUint16(p + 28, true), el2 = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      list.push({ method: dv.getUint16(p + 10, true), csize: dv.getUint32(p + 20, true), lho: dv.getUint32(p + 42, true), name: u8text(u8.subarray(p + 46, p + 46 + nl)) });
      p += 46 + nl + el2 + cl;
    }
    list = list.filter(function (e) { return !/\/$/.test(e.name) && !/__MACOSX|\/\./.test(e.name) && pattern.test(e.name); });
    return list.reduce(function (chain, e) {
      return chain.then(function (acc) {
        var ln = dv.getUint16(e.lho + 26, true), le = dv.getUint16(e.lho + 28, true), start = e.lho + 30 + ln + le, data = u8.subarray(start, start + e.csize);
        var get = e.method === 0 ? Promise.resolve(data) :
          new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
        return get.then(function (bytes) { acc.push({ name: e.name, bytes: bytes }); return acc; });
      });
    }, Promise.resolve([]));
  }

  /* ---- storage on this device ---- */
  var kbMeta = [], idb = null;
  function idbOpen() {
    if (idb) return Promise.resolve(idb);
    return new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error("no indexedDB")); return; }
      var rq = indexedDB.open("obq", 2);
      rq.onupgradeneeded = function () {
        var d = rq.result; ["kb", "meta", "banks", "trcache"].forEach(function (n) { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: n === "trcache" ? "k" : "id" }); });          // kb, meta: Bible texts. banks: the JSON question banks. trcache: translations already paid for
      };
      rq.onsuccess = function () { idb = rq.result; res(idb); };
      rq.onerror = function () { rej(rq.error); };
    });
  }
  function idbDo(store, mode, fn) {
    return idbOpen().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction(store, mode), rq = fn(tx.objectStore(store));
        tx.oncomplete = function () { res(rq ? rq.result : undefined); }; tx.onerror = function () { rej(tx.error); }; tx.onabort = function () { rej(tx.error); };
      });
    });
  }
  function loadKb() {
    var pre = ekey() + "|";
    return idbDo("meta", "readonly", function (s) { return s.getAll(); }).then(function (all) {
      kbMeta = (all || []).filter(function (m) { return m.id.indexOf(pre) === 0; }).sort(function (a, b) { return b.added - a.added; });
      paintBankInfo(); if ($("dashboard").classList.contains("active")) paintKb();
    }).catch(function () { kbMeta = []; });
  }
  function kbSave(kb) {
    var meta = { id: kb.id, name: kb.name, lang: kb.lang, langLabel: kb.langLabel, fileset: kb.fileset || "", added: kb.added, books: {}, verses: 0 };
    Object.keys(kb.books).forEach(function (c) { meta.books[c] = kb.books[c].v.length; meta.verses += kb.books[c].v.length; });
    return idbDo("kb", "readwrite", function (s) { return s.put(kb); }).then(function () { return idbDo("meta", "readwrite", function (s) { return s.put(meta); }); }).then(loadKb);
  }
  function kbRemove(id) {
    return idbDo("kb", "readwrite", function (s) { return s.delete(id); }).then(function () { return idbDo("meta", "readwrite", function (s) { return s.delete(id); }); }).then(loadKb);
  }
  function kbHas(lang, code) { return kbMeta.some(function (m) { return m.lang === lang && m.books[code]; }); }
  function kbLoadMerged(lang) {
    var ids = kbMeta.filter(function (m) { return m.lang === lang; }).map(function (m) { return m.id; });
    return Promise.all(ids.map(function (id) { return idbDo("kb", "readonly", function (s) { return s.get(id); }); })).then(function (texts) {
      var merged = {};
      texts.forEach(function (kb) { if (kb) Object.keys(kb.books).forEach(function (c) { if (!merged[c]) merged[c] = kb.books[c]; }); });
      return merged;
    });
  }

  /* ---- importing files into the knowledge base ---- */
  function addBooks(kb, parsed) {
    var n = 0;
    parsed.forEach(function (b) {
      if (CODES.indexOf(b.code) < 0 || !b.verses.length || kb.books[b.code]) return;
      kb.books[b.code] = { n: b.name || englishOfCode(b.code), v: b.verses }; n++;
    });
    return n;
  }
  function importBuffers(items, meta, status) {
    // items: [{name, buf}]  ->  one knowledge-base text
    var kb = { id: ekey() + "|" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: meta.name, lang: meta.lang, langLabel: meta.langLabel, fileset: meta.fileset || "", added: Date.now(), books: {} };
    return items.reduce(function (chain, it, i) {
      return chain.then(function () {
        status(i + 1, items.length);
        var isZip = /\.zip$/i.test(it.name) || new Uint8Array(it.buf.slice(0, 4)).join() === "80,75,3,4";
        var files = isZip ? readZip(it.buf) : Promise.resolve([{ name: it.name, text: u8text(new Uint8Array(it.buf)) }]);
        return files.then(function (fs) { fs.forEach(function (f) { try { addBooks(kb, parseAny(f.name, f.text)); } catch (e) {} }); });
      });
    }, Promise.resolve()).then(function () { return kb; });
  }
  function readFileBuf(f) { return f.arrayBuffer ? f.arrayBuffer() : new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsArrayBuffer(f); }); }

  /* ---- a ready-made bundle: one zip holding several Bible zips and a manifest.json ---- */
  function importBundle(buf, status) {
    return readZipRaw(buf, /\.(zip|json)$/i).then(function (es) {
      var mf = es.filter(function (e) { return /(^|\/)manifest\.json$/i.test(e.name); })[0];
      if (!mf) throw new Error("no manifest");
      var list = JSON.parse(u8text(mf.bytes)).texts || [], done = 0;
      return list.reduce(function (chain, m, i) {
        return chain.then(function () {
          var f = es.filter(function (e) { return e.name.split("/").pop() === m.file; })[0];
          if (!f) return;
          status(i + 1, list.length, m.name);
          return importBuffers([{ name: m.file, buf: f.bytes.slice().buffer }], { name: m.name, lang: m.lang, langLabel: m.langLabel || m.lang, fileset: "" }, function () {})
            .then(function (kb) { if (Object.keys(kb.books).length) { done++; return kbSave(kb); } });
        });
      }, Promise.resolve()).then(function () { return done; });
    });
  }

  /* ---- Bible Brain download (same calls as the desktop downloader main.py) ---- */
  var BB_API = "https://4.dbt.io/api/";
  function bbUrl(path, params, key) {
    var q = ["v=4", "key=" + encodeURIComponent(key)];
    Object.keys(params || {}).forEach(function (n) { if (params[n] !== "" && params[n] != null) q.push(n + "=" + encodeURIComponent(params[n])); });
    return BB_API + path + "?" + q.join("&");
  }
  function bbGet(url) { return fetch(url).then(function (r) { if (!r.ok) { var e = new Error("http"); e.status = r.status; throw e; } return r.json(); }); }
  /* every page of a list endpoint (Bible Brain answers { data: [...], meta: { pagination } }) */
  function bbAll(path, params, key) {
    var out = [];
    function page(n) {
      var p = {}; Object.keys(params || {}).forEach(function (x) { p[x] = params[x]; }); p.limit = 200; p.page = n;
      return bbGet(bbUrl(path, p, key)).then(function (j) {
        var d = j && j.data; out = out.concat(Array.isArray(d) ? d : []);
        var pg = j && j.meta && j.meta.pagination;
        return (pg && pg.current_page < pg.total_pages && n < 15) ? page(n + 1) : out;
      });
    }
    return page(1);
  }
  function bbDownload(filesetId, key, status, type) {
    var url = bbUrl("bibles/filesets/" + encodeURIComponent(filesetId), type ? { type: type } : {}, key);
    return fetch(url).then(function (r) {
      if (!r.ok) { var e = new Error("http"); e.status = r.status; throw e; }
      return r.json();
    }).then(function (j) {
      var links = (j.data || []).map(function (d) { return d.path; }).filter(Boolean), out = [];
      return links.reduce(function (chain, link, i) {
        return chain.then(function () {
          status(i + 1, links.length);
          return fetch(link).then(function (r) { if (!r.ok) { var e = new Error("http"); e.status = r.status; throw e; } return r.arrayBuffer(); })
            .then(function (buf) { out.push({ name: link.split("/").pop().split("?")[0], buf: buf }); });
        });
      }, Promise.resolve()).then(function () { return out; });
    });
  }

  /* ---- making questions from verses ---- */
  function kbWords(t) { return t.split(/\s+/).filter(Boolean); }
  function core(w) { return w.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, ""); }
  function glen(w) { return Array.from(w.replace(/\p{M}/gu, "")).length; }   // letters only, vowel signs and diacritics are not counted
  function pickBlank(words, hard) {
    var cand = [], i, c;
    for (i = 1; i < words.length - 1; i++) { c = core(words[i]); if (glen(c) >= 3 && !/[0-9\u0966-\u096F\u0660-\u0669]/.test(c)) cand.push(i); }
    if (!cand.length) return -1;
    cand.sort(function (a, b) { return glen(core(words[b])) - glen(core(words[a])); });
    var top = hard ? cand.slice(0, 1) : cand.slice(0, Math.max(1, Math.ceil(cand.length / 2)));   // difficult: the longest word
    return top[Math.floor(Math.random() * top.length)];
  }
  function bookName(books, code) { return (books[code] && books[code].n) || englishOfCode(code); }
  function genKbQuestions(books, codes, n, langVal, style) {
    var have = function (c) { return books[c] && books[c].v.length; };
    var avail = codes.filter(have), all = Object.keys(books).filter(have);
    if (!avail.length) return [];
    var order = shuffle(avail), out = [], used = {}, tries = 0, bp = style === "simple" ? (S.simpleBlueprint || ["regular", "mc"]) : (S.useBlueprint ? (S.blueprint || []) : []);
    while (out.length < n && tries < n * 40 + 50) {
      var code = order[tries % order.length], bk = books[code], v = bk.v[Math.floor(Math.random() * bk.v.length)];
      var slot = bp.length ? bp[out.length % bp.length] : "", kind = slot ? ((slot === "mc" || slot === "mc50") ? "book" : "blank") : (out.length % 2 === 0 ? "blank" : "book");
      if (all.length < 2) kind = "blank";
      var ref = bookName(books, code) + " " + v[0] + ":" + v[1];
      tries++;
      if (used[code + v[0] + ":" + v[1]]) continue;
      if (/\d+\s*[:.]\s*\d+/.test(v[2])) continue;                       // skip verses that carry a printed reference
      var words = kbWords(v[2]), q;
      if (kind === "blank") {
        if (words.length < 6 || words.length > 30) continue;
        var bi = pickBlank(words, slot === "difficult"); if (bi < 0) continue;
        var ans = core(words[bi]), shown = words.slice(); shown[bi] = words[bi].replace(ans, "_____");
        q = { cat: slot === "oneword" ? "oneword" : "one", q: TQ("kbQ1") + "  " + shown.join(" "), a: ans, info: v[2], level: slot === "difficult" ? "difficult" : "" };
      } else {
        if (words.length < 8 || words.length > 40) continue;
        var others = shuffle(all.filter(function (x) { return x !== code; })).slice(0, 3).map(function (x) { return bookName(books, x); });
        var correct = bookName(books, code);
        if (others.indexOf(correct) > -1) continue;
        q = { cat: "mc", q: TQ("kbQ2") + "  \u201C" + v[2] + "\u201D", a: correct, opts: [correct].concat(others), info: "", level: "", fifty: slot === "mc50" };
      }
      used[code + v[0] + ":" + v[1]] = 1;
      q.lang = langVal; q.book = englishOfCode(code); q.ref = ref; q.builtin = true; q.clues = []; q.parts = null; q.pts = 0; q.secs = 0;
      if (q.cat === "mc") q.correct = 0;
      out.push(q);
    }
    return out;
  }
  function scopeCodes(c) {
    if (c.scope === "b1" || c.scope === "b2" || c.scope === "bmore") return c.books.map(codeOfEnglish).filter(Boolean);
    if (c.scope === "nt") return CODES.slice(39);
    if (c.scope === "ot") return CODES.slice(0, 39);
    return CODES.slice();
  }

  /* ---- the knowledge-base panel of the Quiz Builder ---- */
  function pickLang(selId, otherId) {
    var v = $(selId).value;
    if (v !== "other") return { val: v, label: langLabel(v) };
    var nm = normName($(otherId).value);
    if (!nm) return { val: "", label: "" };
    var code = langByName(nm);
    return code ? { val: code, label: langLabel(code) } : { val: nm.toLowerCase(), label: nm };
  }
  function kbStatus(text, cls) { var m = $("kbMsg"); m.className = cls || "note"; m.textContent = text; }
  function kbFinish(items, fs) {
    var lp = pickLang("fKbLang", "fKbOther");
    if (!lp.val) { kbStatus(T("errOtherLang"), "err"); return Promise.resolve(false); }
    var name = normName($("fKbName").value) || (fs ? fs : (items[0] ? items[0].name.replace(/\.[^.]+$/, "") : "Bible"));
    kbStatus(T("kbBusy")); $("kbOffer").hidden = true; $("bbOffer").hidden = true;
    return importBuffers(items, { name: name, lang: lp.val, langLabel: lp.label, fileset: fs }, function (a, b) { kbStatus(T("kbBusy") + " " + a + "/" + b); }).then(function (kb) {
      var nb = Object.keys(kb.books).length;
      if (!nb) { kbStatus(T("kbNoBooks"), "err"); return false; }
      return kbSave(kb).then(function () {
        var vc = 0; Object.keys(kb.books).forEach(function (c) { vc += kb.books[c].v.length; });
        kbStatus(T("kbDone", { name: name, b: nb, v: vc }), "okmsg"); kbOfferMake(kb.id, lp.label || lp.val); track("bible_text_added", { books: nb, source: fs ? "biblebrain" : "upload" }); return true;
      });
    }).catch(function (e) { kbStatus(e && /zip/i.test(e.message || "") ? T("kbNoBooks") : T("kbNoIdb"), "err"); return false; });
  }
  function kbOfferMake(id, label) {                                  // right after a Bible text is added: offer to put the OBQ questions into its language
    var m = kbMeta.filter(function (x) { return x.id === id; })[0];
    [["kbOffer", "kbOfferText", "kbOfferBtn"], ["bbOffer", "bbOfferText", "bbOfferBtn"]].forEach(function (ids) {
      var box = $(ids[0]); if (!m) { box.hidden = true; return; }
      $(ids[1]).textContent = T("trOfferText", { l: label }); $(ids[2]).textContent = T("trOfferBtn", { l: label }); $(ids[2]).onclick = function () { openTranslate(m); }; box.hidden = false;
    });
  }
  function paintKb() {
    var box = $("kbList"); clear(box); clear($("kbPrev"));
    if (!kbMeta.length) { box.appendChild(el("p", "note", T("kbEmpty"))); return; }
    kbMeta.forEach(function (m) {
      var row = el("div", "kbrow"), nb = Object.keys(m.books).length;
      row.appendChild(el("div", "kbname", m.name + " - " + (m.langLabel || m.lang)));
      row.appendChild(el("div", "note", T("kbCount", { b: nb, v: m.verses }) + (m.fileset ? " - " + m.fileset : "")));
      var pv = el("button", "ghost sm", T("kbPreview")); pv.type = "button";
      pv.addEventListener("click", function () { previewKb(m); });
      var dl = el("button", "ghost sm", T("kbDelete")); dl.type = "button";
      dl.addEventListener("click", function () { kbRemove(m.id).then(paintKb); });
      var mk = el("button", "primary sm", T("trMake")); mk.type = "button"; mk.addEventListener("click", function () { openTranslate(m); });
      var act = el("div", "row"); act.appendChild(mk); act.appendChild(pv); act.appendChild(dl); row.appendChild(act); box.appendChild(row);
    });
  }
  function previewKb(m) {
    var prev = $("kbPrev"); clear(prev);
    quizLang = m.lang;
    kbLoadMerged(m.lang).then(function (books) {
      var qs = genKbQuestions(books, CODES.slice(), 6, m.lang);
      prev.appendChild(el("p", "pickinfo", T("kbPreview") + " - " + m.name));
      qs.forEach(function (q, i) {
        var d = el("div", "kbq"); d.appendChild(el("div", null, (i + 1) + ". " + q.q));
        d.appendChild(el("div", "note", (q.opts ? q.opts.join("  |  ") + "   " : "") + "\u2192 " + q.a + "  (" + q.ref + ")")); prev.appendChild(d);
      });
    });
  }
  /* ---- Bible Brain browser: country > language > text filesets ---- */
  var BB_ISO = { eng: "en", hin: "hi", mal: "ml", ory: "or", ori: "or", tam: "ta", tel: "te", pan: "pa", ben: "bn", npi: "ne", nep: "ne", urd: "ur", mar: "mr" };
  var bbLangs = [];
  function bbFail(e) { return e && e.status ? T("bbHttp", { s: e.status }) : T("kbErrNet"); }
  function bbLabel(l) { var a = l.autonym && l.autonym !== l.name ? " (" + l.autonym + ")" : ""; return (l.name || l.iso || String(l.id)) + a; }
  function bbFillSelect(sel, placeholder, items) {
    clear(sel); var o0 = el("option", null, placeholder); o0.value = ""; sel.appendChild(o0);
    items.forEach(function (it) { var o = el("option", null, it.label); o.value = it.value; sel.appendChild(o); });
    sel.disabled = !items.length;
  }
  function bbLoadCountries() {
    var key = normName($("fKbKey").value), m = $("bbMsg");
    if (!key) { m.className = "err"; m.textContent = T("bbKeyNeeded"); return; }
    m.className = "note"; m.textContent = T("bbLoading"); clear($("bbTable")); bbFillSelect($("bbLang"), T("bbPickLang"), []);
    bbAll("countries", {}, key).then(function (cs) {
      var items = cs.map(function (c) { var code = (c.codes && (c.codes.iso_a2 || c.codes.iso_a3)) || c.iso || c.id || ""; return { label: c.name || code, value: String(code) }; })
        .filter(function (x) { return x.value; }).sort(function (a, b) { return a.label.localeCompare(b.label); });
      bbFillSelect($("bbCountry"), T("bbPickCountry"), items); m.className = "okmsg"; m.textContent = T("bbCountries", { n: items.length });
    }).catch(function (e) { m.className = "err"; m.textContent = bbFail(e); });
  }
  function bbLoadLanguages() {
    var key = normName($("fKbKey").value), cc = $("bbCountry").value, m = $("bbMsg");
    clear($("bbTable")); bbFillSelect($("bbLang"), T("bbPickLang"), []); if (!cc) return;
    m.className = "note"; m.textContent = T("bbLoading");
    bbAll("languages", { country: cc }, key).then(function (ls) {
      var seen = {}; bbLangs = ls.filter(function (l) { var id = l.iso || l.id; if (seen[id]) return false; seen[id] = 1; return true; })
        .sort(function (a, b) { return bbLabel(a).localeCompare(bbLabel(b)); });
      bbFillSelect($("bbLang"), T("bbPickLang"), bbLangs.map(function (l, i) { return { label: bbLabel(l), value: String(i) }; }));
      m.className = bbLangs.length ? "okmsg" : "note"; m.textContent = bbLangs.length ? T("bbLangsN", { n: bbLangs.length }) : T("bbNoLangs");
    }).catch(function (e) { m.className = "err"; m.textContent = bbFail(e); });
  }
  function bbSizeLabel(s) { s = String(s || "").toUpperCase(); return s === "C" ? T("bbSizeC") : (s === "NT" ? T("bbSizeNT") : (s === "OT" ? T("bbSizeOT") : (s ? T("bbSizeP") + " (" + s + ")" : ""))); }
  /* all text filesets found, and the ones that are shown: only text_usx and text_usfm */
  function bbFilesetsOf(bibles) {
    var rows = [], seen = {}, all = 0, other = {};
    bibles.forEach(function (b) {
      var fsets = b.filesets, list = [];
      if (Array.isArray(fsets)) list = fsets; else if (fsets && typeof fsets === "object") Object.keys(fsets).forEach(function (bucket) { list = list.concat(fsets[bucket] || []); });
      list.forEach(function (f) {
        if (!f || !f.id || !/^text/i.test(f.type || "") || seen[f.id]) return;
        seen[f.id] = 1; all++;
        if (/^text_(usx|usfm)$/i.test(f.type)) rows.push({ id: f.id, type: f.type, size: f.size, bible: b.vname || b.name || b.abbr || "", abbr: b.abbr || "" });
        else other[f.type] = (other[f.type] || 0) + 1;
      });
    });
    return { rows: rows, all: all, other: other };
  }
  function bbPickRow(row, lang) {                                  // fill the form below the list, set the language, then download
    $("fKbFs").value = row.id; $("fKbFs").setAttribute("data-type", row.type || ""); $("fKbName").value = row.bible || row.id;
    var code = BB_ISO[String(lang.iso || "").toLowerCase()];
    if (code) { $("fKbLang").value = code; } else { $("fKbLang").value = "other"; $("fKbOther").value = lang.name || lang.iso || ""; }
    $("kbOtherWrap").hidden = $("fKbLang").value !== "other";
    bbDownloadNow();
  }
  function bbLoadFilesets() {
    var key = normName($("fKbKey").value), idx = $("bbLang").value, m = $("bbMsg"), tb = $("bbTable"); clear(tb);
    if (idx === "") return;
    var lang = bbLangs[+idx]; m.className = "note"; m.textContent = T("bbLoading");
    bbAll("bibles", { language_code: lang.iso || "" }, key).then(function (bibles) {
      var res = bbFilesetsOf(bibles), rows = res.rows, lab = bbLabel(lang);
      var others = Object.keys(res.other).sort().map(function (t) { return t + " " + res.other[t]; }).join(", ");
      if (!res.all) { m.className = "note"; m.textContent = T("bbNone"); return; }
      if (!rows.length) { m.className = "note"; m.textContent = T("bbNoneShown", { all: res.all, lang: lab, list: others }); return; }
      m.className = "okmsg"; m.textContent = T("bbFoundN", { all: res.all, shown: rows.length, lang: lab }) + (others ? " " + T("bbOthers", { list: others }) : "");
      var hr = el("tr"); [T("bbColBible"), T("bbColType"), T("bbColSize"), T("bbColId"), ""].forEach(function (h) { hr.appendChild(el("th", null, h)); }); tb.appendChild(hr);
      rows.forEach(function (row) {
        var tr = el("tr");
        [row.bible + (row.abbr ? " (" + row.abbr + ")" : ""), row.type, bbSizeLabel(row.size), row.id].forEach(function (t) { tr.appendChild(el("td", null, t)); });
        var td = el("td"), b = el("button", "primary sm", T("bbDl")); b.type = "button"; b.addEventListener("click", function () { bbPickRow(row, lang); }); td.appendChild(b); tr.appendChild(td); tb.appendChild(tr);
      });
    }).catch(function (e) { m.className = "err"; m.textContent = bbFail(e); });
  }
  function bbResetAfterDownload() {        // only the country stays selected; the language, the fileset list and the fileset fields are cleared
    clear($("bbTable")); $("bbLang").value = ""; $("bbMsg").textContent = ""; $("fKbFs").value = ""; $("fKbFs").removeAttribute("data-type"); $("fKbName").value = "";
  }
  function bbDownloadNow() {
    var fs = normName($("fKbFs").value), key = normName($("fKbKey").value), type = $("fKbFs").getAttribute("data-type") || "";
    if (!fs || !key) { kbStatus(T("errFill"), "err"); return; }
    kbStatus(T("kbBusy"));
    bbDownload(fs, key, function (a, b) { kbStatus(T("kbProg", { a: a, b: b })); }, type).then(function (items) {
      if (!items.length) { kbStatus(T("kbNoFiles"), "err"); return; }
      return kbFinish(items, fs).then(function (ok) { if (ok) bbResetAfterDownload(); });
    }).catch(function (e) { kbStatus(e && e.status ? T("kbErrKey", { s: e.status }) : T("kbErrNet"), "err"); });
  }
  function wireKb() {
    $("bbLoad").addEventListener("click", bbLoadCountries); $("bbCountry").addEventListener("change", bbLoadLanguages); $("bbLang").addEventListener("change", bbLoadFilesets);
    $("fKbFs").addEventListener("input", function () { $("fKbFs").removeAttribute("data-type"); });
    $("fKbLang").addEventListener("change", function () { $("kbOtherWrap").hidden = $("fKbLang").value !== "other"; });
    $("kbUp").addEventListener("click", function () { $("kbFiles").click(); });
    $("kbFiles").addEventListener("change", function () {
      var fl = Array.prototype.slice.call($("kbFiles").files || []); if (!fl.length) return;
      Promise.all(fl.map(function (f) { return readFileBuf(f).then(function (b) { return { name: f.name, buf: b }; }); }))
        .then(function (items) { return kbFinish(items, ""); }).then(function () { $("kbFiles").value = ""; });
    });
    $("kbBundleBtn").addEventListener("click", function () { $("kbBundleFile").click(); });
    $("kbBundleFile").addEventListener("change", function () {
      var f = $("kbBundleFile").files && $("kbBundleFile").files[0]; if (!f) return;
      kbStatus(T("kbBusy"));
      readFileBuf(f).then(function (b) { return importBundle(b, function (a, n, name) { kbStatus(T("kbBusy") + " " + a + "/" + n + " - " + name); }); })
        .then(function (n) { kbStatus(n ? T("kbBundleDone", { n: n }) : T("kbNoBooks"), n ? "okmsg" : "err"); if (n) track("bible_bundle_added", { texts: n }); })
        .catch(function () { kbStatus(T("kbBundleErr"), "err"); }).then(function () { $("kbBundleFile").value = ""; });
    });
    $("kbDl").addEventListener("click", bbDownloadNow);
  }
