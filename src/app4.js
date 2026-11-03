
  /* =====================================================================
     RESULTS PDF  (drawn on a canvas so every script is shaped correctly)
     ===================================================================== */
  function pdfFont() {
    return langInfo(ui).font + ', "Noto Sans Malayalam", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Oriya", "Noto Sans Gurmukhi", "Noto Sans Bengali", "Noto Naskh Arabic", "DM Sans", "Nirmala UI", system-ui, sans-serif';
  }
  function srcLabel(c) { return c.source === "bank" ? T("srcBank") : (c.source === "kb" ? T("srcKB") : (c.source === "sample" ? T("srcSample") : T("srcRandom"))); }
  function langLabel(code) { var L = langInfo(code); if (L.code !== code) return code ? code.charAt(0).toUpperCase() + code.slice(1) : ""; return L.code === "en" ? "English" : L.native + " (" + L.english + ")"; }
  function detailRows() {
    var c = cfg, u = user || {};
    var rows = [
      [T("dQM"), c.qm], [T("dEmail"), u.email || "-"],
      [T("dOrg"), u.org || "-"], [T("dEvent"), c.event],
      [T("dDate"), fmtDate(c.date)], [T("dParts"), c.parts ? String(c.parts) : "-"],
      [T("dQLang"), c.quizLangLabel || langLabel(c.quizLang)], [T("dNumQ"), String(ROUNDS.length)],
      [T("dMode"), isGroup() ? T("mGroup") : T("mInd")], [T("dStyle"), c.style === "simple" ? T("styleSimple") : T("styleNormal")]
    ];
    if (S.edition === "basic") rows = rows.filter(function (r) { return r[1] !== "-"; });          // no login: leave out the email, organisation and participant lines
    return rows;
  }
  function loadLogo() {
    return new Promise(function (res) {
      if (!S.logo || S.logo === "@logo" || (location.protocol === "file:" && !/^data:/.test(S.logo))) { res(null); return; }
      var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = S.logo;
    });
  }
  function drawResultPages(list, logo, photo) {
    var W = 1240, H = 1754, M = 90, ROW = 74, FONT = pdfFont(), C = S.colors, group = isGroup();
    var photoW = 0, photoH = 0;                                          // the winners' photo, if one was added: fitted into the page width and at most 440 px high
    if (photo && photo.width && photo.height) { var psc = Math.min((W - 2 * M) / photo.width, 440 / photo.height, 1.5); photoW = photo.width * psc; photoH = photo.height * psc; }
    var firstTop = 1060 + (photoH ? Math.round(photoH) + 60 : 0), nextTop = 250, bottom = H - 130;
    var perFirst = Math.max(1, Math.floor((bottom - firstTop) / ROW)), perNext = Math.max(1, Math.floor((bottom - nextTop) / ROW));
    var chunks = [], i = 0, first = true;
    do { var cap = first ? perFirst : perNext; chunks.push(list.slice(i, i + cap)); i += cap; first = false; } while (i < list.length);
    var total = chunks.length, winners = list.filter(function (x) { return x.rank === 1; }).map(function (x) { return x.name; });
    var rows = detailRows(), ev = cfg.event, dstr = fmtDate(cfg.date);

    return chunks.map(function (chunk, pi) {
      var c = document.createElement("canvas"); c.width = W; c.height = H;
      var g = c.getContext("2d");
      function dirOf(t) { return /[\u0590-\u08FF]/.test(t) ? "rtl" : "ltr"; }
      function text(t, x, y, size, weight, color, align) {
        g.font = weight + " " + size + "px " + FONT; g.fillStyle = color; g.textAlign = align || "left"; g.direction = dirOf(String(t)); g.fillText(t, x, y);
      }
      function width(t, size, weight) { g.font = weight + " " + size + "px " + FONT; return g.measureText(t).width; }
      function fitText(t, maxW, size, weight) {
        t = String(t);
        if (width(t, size, weight) <= maxW) return t;
        while (t.length > 1 && width(t + "\u2026", size, weight) > maxW) t = t.slice(0, -1);
        return t + "\u2026";
      }
      function wrap(t, maxW, size, weight, maxLines) {
        var words = String(t).split(/\s+/), lines = [], cur = "";
        words.forEach(function (w) {
          var tryL = cur ? cur + " " + w : w;
          if (width(tryL, size, weight) <= maxW || !cur) cur = tryL; else { lines.push(cur); cur = w; }
        });
        if (cur) lines.push(cur);
        if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = fitText(lines[maxLines - 1] + " \u2026", maxW, size, weight); }
        return lines;
      }
      g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, W, H); g.textBaseline = "alphabetic";
      var top;
      if (pi === 0) {
        g.fillStyle = C.bg; g.fillRect(0, 0, W, 330); g.fillStyle = C.accent; g.fillRect(0, 330, W, 10);
        if (logo) { var lh = 110, lw = logo.width * lh / logo.height; g.drawImage(logo, W - M - lw, 40, lw, lh); }
        text(fitText(S.appName, W - 2 * M - 220, 32, 700), M, 90, 32, 700, C.muted);
        var esz = 64; while (esz > 44 && width(ev, esz, 800) > W - 2 * M) esz -= 4;
        var el2 = width(ev, esz, 800) > W - 2 * M ? wrap(ev, W - 2 * M, 44, 800, 2) : [ev];
        el2.forEach(function (ln, li) { text(ln, M, 160 + li * 50, el2.length > 1 ? 44 : esz, 800, C.accent); });
        var ty = el2.length > 1 ? 262 : 245;
        text(T("pdfTitle"), M, ty, 40, 700, C.ink);
        text(dstr + "   |   " + (group ? T("grp") : T("ppl")), M, ty + 50, 30, 500, C.muted);
        // event details
        var colW = (W - 2 * M) / 2, gy = 392, k;
        for (k = 0; k < rows.length; k++) {
          var cx = M + (k % 2) * colW, cy = gy + Math.floor(k / 2) * 50 + 34, lab = rows[k][0] + ": ";
          text(lab, cx, cy, 24, 500, "#7A6A5C");
          var lw2 = width(lab, 24, 500);
          text(fitText(rows[k][1], colW - lw2 - 24, 28, 700), cx + lw2, cy, 28, 700, "#1B1410");
        }
        var sy = gy + Math.ceil(rows.length / 2) * 50 + 16;
        text(T("dScope") + ":", M, sy + 26, 24, 500, "#7A6A5C");
        var sl = wrap(scopeLabel(cfg), W - 2 * M, 28, 700, 2);
        sl.forEach(function (ln, li) { text(ln, M, sy + 62 + li * 38, 28, 700, "#1B1410"); });
        var srcY = sy + 62 + (sl.length - 1) * 38 + 52, srcLab = T("dSource") + ": ", srcLW = width(srcLab, 24, 500);
        text(srcLab, M, srcY, 24, 500, "#7A6A5C");
        text(fitText(srcLabel(cfg), W - 2 * M - srcLW, 28, 700), M + srcLW, srcY, 28, 700, "#1B1410");
        // winner
        var wy = srcY + 72;
        if (winners.length) {
          var label = (winners.length > 1 ? T("winsL") : T("winL")) + " ", labelW = width(label, 46, 800);
          text(label, M, wy, 46, 800, "#7A6A5C");
          text(fitText(winners.join(", "), W - 2 * M - labelW, 46, 800), M + labelW, wy, 46, 800, "#1B1410");
        } else text(T("noWin"), M, wy, 40, 700, "#1B1410");
        if (photoH) {
          var availTop = wy + 34, availBottom = firstTop - ROW - 24, py = availTop + Math.max(0, (availBottom - availTop - photoH) / 2), px = M + (W - 2 * M - photoW) / 2;
          g.drawImage(photo, px, py, photoW, photoH); g.strokeStyle = "#E8D3BC"; g.lineWidth = 3; g.strokeRect(px, py, photoW, photoH);
        }
        top = firstTop;
      } else {
        g.fillStyle = C.bg; g.fillRect(0, 0, W, 150);
        text(fitText(ev + " - " + T("pdfTitle"), W - 2 * M, 38, 700), M, 80, 38, 700, C.accent);
        text(dstr, M, 126, 30, 500, C.muted);
        top = nextTop;
      }
      g.fillStyle = "#FDE8D0"; g.fillRect(M, top - ROW, W - 2 * M, ROW);
      text(T("rank"), M + 30, top - 24, 32, 700, "#1B1410");
      text(group ? T("grpC") : T("nameC"), M + 230, top - 24, 32, 700, "#1B1410");
      text(T("ptsC"), W - M - 30, top - 24, 32, 700, "#1B1410", "right");
      var rankColors = { 1: "#B8860B", 2: "#6F768A", 3: "#A0612B" };
      chunk.forEach(function (x, kk) {
        var y = top + kk * ROW;
        if (kk % 2 === 0) { g.fillStyle = "#FFF5EA"; g.fillRect(M, y, W - 2 * M, ROW); }
        var base = y + 50;
        text(String(x.rank), M + 30, base, 36, 800, rankColors[x.rank] || "#1B1410");
        text(fitText(x.name, W - 2 * M - 230 - 280, 36, 500), M + 230, base, 36, 500, "#1B1410");
        text(String(x.total), W - M - 30, base, 38, 800, "#1B1410", "right");
      });
      g.fillStyle = C.bg; g.fillRect(M, top + chunk.length * ROW, W - 2 * M, 3);
      text(fitText(S.appName + " - " + ev, W - 2 * M - 260, 26, 500), M, H - 60, 26, 500, "#7A6A5C");
      text(T("page", { a: pi + 1, b: total }), W - M, H - 60, 26, 500, "#7A6A5C", "right");
      return c;
    });
  }
  function canvasJpeg(c) {
    var b64s = c.toDataURL("image/jpeg", 0.92).split(",")[1], bin = atob(b64s), u = new Uint8Array(bin.length), i;
    for (i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  /* A small PDF writer: one A4 page per picture */
  function makePdf(jpegs, w, h) {
    var parts = [], offsets = [], size = 0;
    function enc(str) { var a = new Uint8Array(str.length); for (var i = 0; i < str.length; i++) a[i] = str.charCodeAt(i) & 255; return a; }
    function push(u8) { parts.push(u8); size += u8.length; }
    function obj(n, head, stream) {
      offsets[n] = size; push(enc(n + " 0 obj\n" + head));
      if (stream) { push(enc("\nstream\n")); push(stream); push(enc("\nendstream")); }
      push(enc("\nendobj\n"));
    }
    function pad10(n) { var t = String(n); while (t.length < 10) t = "0" + t; return t; }
    var n = jpegs.length, i;
    push(enc("%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n"));
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    var kids = []; for (i = 0; i < n; i++) kids.push((3 + 3 * i) + " 0 R");
    obj(2, "<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + n + " >>");
    for (i = 0; i < n; i++) {
      obj(3 + 3 * i, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 " + (5 + 3 * i) + " 0 R >> >> /Contents " + (4 + 3 * i) + " 0 R >>");
      var content = enc("q 595.28 0 0 841.89 0 0 cm /Im0 Do Q");
      obj(4 + 3 * i, "<< /Length " + content.length + " >>", content);
      obj(5 + 3 * i, "<< /Type /XObject /Subtype /Image /Width " + w + " /Height " + h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpegs[i].length + " >>", jpegs[i]);
    }
    var xrefPos = size, count = 3 * n + 3, x = "xref\n0 " + count + "\n0000000000 65535 f \n";
    for (i = 1; i < count; i++) x += pad10(offsets[i]) + " 00000 n \n";
    x += "trailer\n<< /Size " + count + " /Root 1 0 R >>\nstartxref\n" + xrefPos + "\n%%EOF";
    push(enc(x));
    var out = new Uint8Array(size), pos = 0;
    parts.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }
  /* ---------- the analytics report (PDF) ---------- */
  function drawAnalyticsPages(d, logo) {
    var W = 1240, H = 1754, M = 90, ROW = 74, FONT = pdfFont(), C = S.colors, pages = [];
    function ctx() {
      var c = document.createElement("canvas"); c.width = W; c.height = H; var g = c.getContext("2d");
      var o = { c: c, g: g };
      o.text = function (t, x, y, size, weight, color, align) { g.font = weight + " " + size + "px " + FONT; g.fillStyle = color; g.textAlign = align || "left"; g.direction = /[\u0590-\u08FF]/.test(String(t)) ? "rtl" : "ltr"; g.fillText(t, x, y); };
      o.width = function (t, size, weight) { g.font = weight + " " + size + "px " + FONT; return g.measureText(t).width; };
      o.fit = function (t, maxW, size, weight) { t = String(t); if (o.width(t, size, weight) <= maxW) return t; while (t.length > 1 && o.width(t + "\u2026", size, weight) > maxW) t = t.slice(0, -1); return t + "\u2026"; };
      o.wrap = function (t, maxW, size, weight, maxLines) {
        var words = String(t).split(/\s+/), lines = [], cur = "";
        words.forEach(function (w) { var tl = cur ? cur + " " + w : w; if (o.width(tl, size, weight) <= maxW || !cur) cur = tl; else { lines.push(cur); cur = w; } });
        if (cur) lines.push(cur); if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = o.fit(lines[maxLines - 1] + " \u2026", maxW, size, weight); } return lines;
      };
      g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, W, H); g.textBaseline = "alphabetic"; return o;
    }
    var total = d.recent.length ? 2 : 1, title = T("anPdfTitle");
    function footer(o, n) { o.text(o.fit(S.appName + " - " + title, W - 2 * M - 260, 26, 500), M, H - 60, 26, 500, "#7A6A5C"); o.text(T("page", { a: n, b: total }), W - M, H - 60, 26, 500, "#7A6A5C", "right"); }
    // page 1: overview
    var p1 = ctx(), g = p1.g;
    g.fillStyle = C.bg; g.fillRect(0, 0, W, 330); g.fillStyle = C.accent; g.fillRect(0, 330, W, 10);
    if (logo) { var lh = 110, lw = logo.width * lh / logo.height; g.drawImage(logo, W - M - lw, 40, lw, lh); }
    p1.text(p1.fit(S.appName, W - 2 * M - 220, 32, 700), M, 90, 32, 700, C.muted);
    p1.text(title, M, 170, 64, 800, C.accent);
    p1.text(p1.fit([d.name, d.org, d.country].filter(Boolean).join("   |   "), W - 2 * M, 32, 700), M, 244, 32, 700, C.ink);
    p1.text(T("anPdfGen", { date: fmtDate(todayISO()) }), M, 292, 28, 500, C.muted);
    p1.text(T("anPdfOverview"), M, 412, 36, 800, "#1B1410");
    var tw = (W - 2 * M - 48) / 3, th = 150;
    d.tiles.forEach(function (t, i) {
      var x = M + (i % 3) * (tw + 24), y = 440 + Math.floor(i / 3) * (th + 24);
      g.fillStyle = "#FFF5EA"; g.fillRect(x, y, tw, th); g.strokeStyle = "#F0D9BF"; g.lineWidth = 2; g.strokeRect(x, y, tw, th);
      var date = t[2] === "date", vs = date ? 40 : 54; while (date && vs > 26 && p1.width(String(t[1]), vs, 800) > tw - 40) vs -= 2;
      p1.text(p1.fit(String(t[1]), tw - 40, vs, 800), x + 20, y + 66, vs, 800, "#1B1410");
      p1.wrap(T(t[0]), tw - 40, 24, 500, 2).forEach(function (ln, li) { p1.text(ln, x + 20, y + 108 + li * 28, 24, 500, "#7A6A5C"); });
    });
    var ly = 440 + Math.ceil(d.tiles.length / 3) * (th + 24) + 46;
    p1.text(T("anPdfLangs"), M, ly, 32, 800, "#1B1410");
    p1.wrap(d.langs.length ? d.langs.join(", ") : "-", W - 2 * M, 28, 500, 3).forEach(function (ln, li) { p1.text(ln, M, ly + 46 + li * 38, 28, 500, "#1B1410"); });
    p1.text(p1.fit(T("anPdfPriv"), W - 2 * M, 24, 500), M, H - 120, 24, 500, "#7A6A5C");
    footer(p1, 1); pages.push(p1.c);
    // page 2: the recent quizzes
    if (d.recent.length) {
      var p2 = ctx(), g2 = p2.g; g2.fillStyle = C.bg; g2.fillRect(0, 0, W, 150);
      p2.text(p2.fit(title + " - " + T("anPdfRecent"), W - 2 * M, 38, 700), M, 80, 38, 700, C.accent); p2.text(fmtDate(todayISO()), M, 126, 30, 500, C.muted);
      var top = 250; g2.fillStyle = "#FDE8D0"; g2.fillRect(M, top - ROW, W - 2 * M, ROW);
      var cx = [M + 14, M + 238, M + 520, M + 712, M + 862];
      [[T("colDate"), 0], [T("colQuiz"), 1], [T("colPlayers"), 2], [T("colQs"), 3], [T("colWinner"), 4]].forEach(function (h) { p2.text(h[0], cx[h[1]], top - 24, 24, 700, "#1B1410"); });
      d.recent.slice(0, 20).forEach(function (r, k) {
        var y = top + k * ROW; if (k % 2 === 0) { g2.fillStyle = "#FFF5EA"; g2.fillRect(M, y, W - 2 * M, ROW); } var base = y + 48;
        p2.text(p2.fit(r.date ? fmtDate(r.date) : "", 214, 24, 500), cx[0], base, 24, 500, "#1B1410"); p2.text(p2.fit(r.event || "", 262, 28, 600), cx[1], base, 28, 600, "#1B1410");
        p2.text(String(r.participants || 0), cx[2], base, 28, 500, "#1B1410"); p2.text(String(r.numQuestions || 0), cx[3], base, 28, 500, "#1B1410");
        p2.text(p2.fit((r.winners || []).join(", "), W - M - cx[4] - 20, 26, 500), cx[4], base, 26, 500, "#1B1410");
      });
      g2.fillStyle = C.bg; g2.fillRect(M, top + Math.min(20, d.recent.length) * ROW, W - 2 * M, 3); footer(p2, 2); pages.push(p2.c);
    }
    return pages;
  }
  function exportAnalytics() {
    var msg = $("anPdfMsg"); msg.textContent = T("pdfMaking"); var f = langInfo(ui).font;
    var fonts = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load("700 30px " + f), document.fonts.load("400 30px " + f)]).catch(function () {}) : Promise.resolve();
    Promise.all([fonts, loadLogo()]).then(function (res) {
      var pages = drawAnalyticsPages({ name: (user && user.name) || "", org: (user && user.org) || "", country: (user && user.country) || "", tiles: analyticsTiles(), langs: stats().langs || [], recent: history() }, res[1]);
      return saveFile("obq-analytics-" + todayISO() + ".pdf", makePdf(pages.map(canvasJpeg), 1240, 1754), "application/pdf");
    }).then(function (saved) { msg.textContent = saved ? T("pdfSaved") : ""; if (saved) track("analytics_pdf", {}); }).catch(function () { msg.textContent = T("pdfFail"); });
  }
  function pdfName() {
    var slug = String(cfg.event || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
    return S.pdfFilePrefix + (slug ? "-" + slug : "") + "-" + (cfg.date || todayISO()) + ".pdf";
  }
  function exportResults() {
    var msg = $("exportMsg"); msg.textContent = T("pdfMaking");
    var list = totals(), f = langInfo(ui).font;
    var fonts = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load("700 30px " + f), document.fonts.load("400 30px " + f)]).catch(function () {}) : Promise.resolve();
    Promise.all([fonts, loadLogo(), loadPhotoImage()]).then(function (res) {
      var pages = drawResultPages(list, res[1], res[2]);
      return saveFile(pdfName(), makePdf(pages.map(canvasJpeg), 1240, 1754), "application/pdf");
    }).then(function (saved) {
      msg.textContent = saved ? T("pdfSaved") : "";
      if (saved) { bump("pdfs"); track("pdf_export", { rows: list.length, questions: ROUNDS.length }); }
    }).catch(function () { msg.textContent = T("pdfFail"); });
  }

  /* =====================================================================
     START UP
     ===================================================================== */
  function repaintStatic() {
    paintSelects(); paintBankInfo(); paintSoundLabel(); paintTimer(); paintFs();
    if ($("dashboard").classList.contains("active") || $("resultsPage").classList.contains("active") || $("analytics").classList.contains("active")) paintDashboard();
    if ($("game").classList.contains("active")) paintRound();
    if (!$("setup").classList.contains("active") && !$("auth").classList.contains("active")) return;
    refreshAvail();
  }
  function restoreSession() {
    var key = sessGet();
    if (key === "skip") { if (S.skipLoginButton) onLogin(skipProfile(), false); return; }
    var u = key ? localUsers()[key] : null;
    if (u) onLogin(u.profile, false);
  }
  /* The built-in bank may be shipped encrypted (BANK_ENC): AES-GCM, key = SHA-256 of BANK_PASS, deflate-compressed JSON. Decrypted once at start-up. */
  function ensureBank() {
    if (typeof BANK_ENC === "undefined" || STARTER_BANK.length) return Promise.resolve();
    function bytes(b64) { var s = atob(b64), u = new Uint8Array(s.length), i; for (i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
    return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(BANK_PASS))
      .then(function (k) { return window.crypto.subtle.importKey("raw", k, "AES-GCM", false, ["decrypt"]); })
      .then(function (key) { return window.crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(BANK_ENC.iv) }, key, bytes(BANK_ENC.ct)); })
      .then(function (buf) { return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text(); })
      .then(function (txt) { JSON.parse(txt).forEach(function (r) { STARTER_BANK.push(r); }); STARTER = null; });
  }
  function wireOffline() {
    $("authRetry").addEventListener("click", function () { $("authRetry").disabled = true; hideVerify(); start(); setTimeout(function () { $("authRetry").disabled = false; }, 1500); });
    $("authOfflineGo").addEventListener("click", function () { fbOfflineChosen = true; start(); });
    window.addEventListener("online", function () { if (!$("authOffline").hidden) { hideVerify(); start(); } });       // network is back: try again by itself
  }
  function boot() {
    initDialogs(); wireConsent(); wireMyData();                                       // keyboard focus stays inside pop-ups (src/modules/a11y.js); the analytics choice (src/modules/consent.js)
    paintBrand(); applySettings();
    var saved = lsGet("qms.ui", S.defaultUiLang);
    quizLangPick = S.defaultQuizLang; quizLang = quizLangPick; sel.numQ = S.questionCounts[0];
    wireAuth(); wireSetup(); wireGame(); wireSettings(); wireOffline();
    window.addEventListener("resize", function () { var a = document.activeElement; if (a && a.tagName === "INPUT") return; fitSoon(); });
    window.addEventListener("orientationchange", function () { setTimeout(fitSoon, 250); });
    document.addEventListener("fullscreenchange", function () { paintFs(); setTimeout(fitSoon, 150); });
    document.addEventListener("webkitfullscreenchange", paintFs);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && $("game").classList.contains("active")) keepAwake(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSoon);
    try { var full = window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches; if (!fsSupported() || full) $("fs").style.display = "none"; } catch (x) {}
    $("fs").addEventListener("click", toggleFs); $("exitFs").addEventListener("click", exitFs); $("exitFs2").addEventListener("click", exitFs);
    setUi(saved);
    show("auth");
    ensureBank().catch(function () {}).then(function () { start(); });
  }
  var fbOfflineChosen = false, offlineMode = false;
  function start() {
    if (routingOK && !pendingRoute) pendingRoute = currentRoute();                                 // remember the page address that was opened
    if (!S.requireLogin) {
      user = { email: "", name: "", org: "", country: "", usage: "", consent: false }; loadBank();
      if (S.edition === "basic") { showWelcome(); return; }                 // the very basic version: just ask for the name
      if (pendingRoute && ROUTE_TABLE[pendingRoute]) { var r1 = pendingRoute; pendingRoute = ""; applyRoute(r1); } else goHomePage(); return;
    }
    if (fbOfflineChosen) { fb.on = false; offlineMode = true; hideVerify(); setAuthTab("in"); paintSelects(); restoreSession(); show("auth"); return; }     // the Quiz Master chose to work offline with a local account
    initFirebase().then(function (on) {
      paintSelects();
      /* Online accounts are configured but the service could not be reached (no network yet, a blocker, a firewall): do NOT silently
         switch to local accounts, because the online account would then look like a wrong password. Explain, and let the user retry. */
      if (!on && fbConfigured()) {
        var saved = sessGet();                                                                      // a remembered device can start without internet
        if (saved && saved !== "skip" && localUsers()[saved]) { fb.on = false; fbOfflineChosen = true; offlineMode = true; hideVerify(); setAuthTab("in"); paintSelects(); restoreSession(); return; }
        showAuthBox("authOffline"); return;
      }
      hideVerify(); setAuthTab("in");                                       // show the normal sign-in form again (after "Try again")
      if (on && fb.auth.isSignInWithEmailLink(window.location.href)) { finishLink(); return; }          // the page was opened from a sign-in link in an email
      if (on) {
        var first = true;
        fb.auth.onAuthStateChanged(function (u) {
          if (!first) return; first = false;
          if (u) { if (needsVerify(u)) showVerify(u.email); else fbProfile(u).then(function (p) { onLogin(p, false); }); }
        });
      } else restoreSession();
    });
  }
  boot();
})();
