
  /* =====================================================================
     QUIZ SCREEN  (behaviour ported from the original quiz, now generic)
     ===================================================================== */
  var mode = "group";            // "group" or "individual"
  var records = [];              // records[roundIndex] = [{key, name, pts}]
  var done = [];                 // done[roundIndex] = points step completed
  var known = {};                // key -> display name (for suggestions)
  var r = 0, shown = 1, revealed = false, hintStep = 0, selPts = null;
  var soundOn = true, audioCtx = null;
  var tTotal = 30, tLeft = 30, tTimer = null, tEnd = 0, tRunning = false, lastTick = -1;
  var msgTimer = null, timeUp = false, startedAt = 0;

  function isGroup() { return mode === "group"; }

  /* Sound */
  function beep(freq, dur, vol) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "sine"; o.frequency.value = freq; g.gain.value = vol || 0.08;
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }
  function chime() { beep(660, 0.12); setTimeout(function () { beep(880, 0.18); }, 120); }
  function paintSoundLabel() { $("sound").textContent = soundOn ? T("sndOn") : T("sndOff"); $("sound").setAttribute("aria-pressed", soundOn ? "true" : "false"); }

  /* Timer */
  function fmt(s) { var m = Math.floor(s / 60), x = Math.ceil(s % 60); if (x === 60) { m++; x = 0; } return m + ":" + (x < 10 ? "0" : "") + x; }
  function paintTimer() {
    $("time").textContent = fmt(tLeft);
    var low = tLeft <= 5 && tRunning;
    $("time").classList.toggle("low", low);
    var f = $("tfill");
    f.style.transform = "scaleX(" + Math.max(0, tLeft / tTotal) + ")";
    f.classList.toggle("low", low);
    var svg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    var icon, label;
    if (tRunning) { icon = '<path d="M8 5v14M16 5v14"/>'; label = T("tPause"); }
    else if (tLeft < tTotal && tLeft > 0) { icon = '<path d="M7 4l13 8-13 8z"/>'; label = T("tResume"); }
    else { icon = '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'; label = T("tStart"); }
    $("tgo").innerHTML = svg + icon + "</svg><span>" + label + "</span>";
  }
  function stopTimer() { clearInterval(tTimer); tTimer = null; tRunning = false; }
  function resetTimer(secs) {
    stopTimer(); tTotal = secs; tLeft = secs; paintTimer();
    if (timeUp) { timeUp = false; paintQVisibility(); }
  }
  function toggleTimer() {
    if (tRunning) { stopTimer(); paintTimer(); return; }
    if (tLeft <= 0) resetTimer(tTotal);
    tRunning = true; tEnd = Date.now() + tLeft * 1000; lastTick = -1;
    tTimer = setInterval(function () {
      tLeft = Math.max(0, (tEnd - Date.now()) / 1000);
      var c = Math.ceil(tLeft);
      if (tLeft > 0 && c <= 3 && c !== lastTick) { lastTick = c; beep(520, 0.08); }
      if (tLeft <= 0) { stopTimer(); beep(220, 0.6, 0.12); timeUp = true; paintQVisibility(); }
      paintTimer();
    }, 100);
    paintTimer();
  }

  /* Scoring and respondents */
  function worthNow() {
    var rd = ROUNDS[r];
    if (rd.type === "who") return (rd.maxPts || rd.clues.length) - (shown - 1);
    return rd.pts || S.defaultPoints;
  }
  function totals() {
    var map = {}, list = [];
    records.forEach(function (round) {
      (round || []).forEach(function (e) {
        if (!map[e.key]) { map[e.key] = { key: e.key, name: known[e.key] || e.name, total: 0 }; list.push(map[e.key]); }
        map[e.key].total += e.pts;
      });
    });
    list.sort(function (a, b) { return b.total - a.total || a.name.localeCompare(b.name, ui); });
    var rank = 0, prev = null;
    list.forEach(function (x, i) { if (x.total !== prev) { rank = i + 1; prev = x.total; } x.rank = rank; });
    return list;
  }
  function flash(text, ms) {
    var m = $("entryMsg"); m.textContent = text; clearTimeout(msgTimer);
    msgTimer = setTimeout(function () { m.textContent = ""; }, ms || 2800);
  }
  function splitNames(v) { return String(v || "").split(/[,،，;]+/).map(normName).filter(Boolean).map(function (n) { return n.slice(0, 40); }); }
  function award() {
    var input = $("nameIn");
    if (!revealed) { flash(T("fShow")); return; }
    var wasLocked = $("nextBtn").classList.contains("gated");
    var parts = splitNames(input.value);
    var round = records[r] || (records[r] = []);
    if (!parts.length) {
      if (round.length || done[r]) { flash(T("fType")); input.focus(); return; }
      done[r] = true;
      flash(T("fNobody"));
    } else {
      var pts = curPts(), added = 0, skipped = [], seen = {};
      parts.forEach(function (name) {
        var key = keyOf(name);
        if (seen[key]) return;
        seen[key] = true;
        var dup = round.some(function (e) { return e.key === key; });
        if (dup) { skipped.push(known[key] || name); return; }
        if (!known[key]) known[key] = name;
        round.push({ key: key, name: known[key], pts: pts });
        added++;
      });
      if (added || round.length) done[r] = true;
      if (added) { input.value = ""; chime(); } else { input.select(); }
      if (skipped.length) flash(T("fAlready", { names: skipped.join(", ") }));
    }
    paintEntry(); paintGate();
    if (wasLocked && done[r]) pulse($("nextBtn"));
    input.focus();
  }
  function paintQVisibility() {
    var hidden = timeUp && !revealed, g = $("game");
    g.classList.toggle("qhidden", hidden);
    g.classList.toggle("answered", !!revealed);
    fitSoon();
  }
  function paintGate() {
    var add = $("addBtn"), nx = $("nextBtn"), tipG = !revealed ? T("tipGive0") : T("tipGive1");
    add.classList.toggle("gated", !revealed); add.setAttribute("aria-disabled", String(!revealed)); add.title = tipG;
    nx.classList.toggle("gated", !done[r]); nx.setAttribute("aria-disabled", String(!done[r])); nx.title = done[r] ? "" : T("tipNext");
    $("stepHint").textContent = !revealed ? T("step1") : (!done[r] ? T("step2") : T("step3"));
    $("stepHint").className = "stephint s" + (!revealed ? 1 : (!done[r] ? 2 : 3));
  }
  function pulse(btn) {
    btn.classList.remove("wake"); void btn.offsetWidth; btn.classList.add("wake");
    setTimeout(function () { btn.classList.remove("wake"); }, 1000);
  }
  function canGo(i) { for (var j = r; j < i && j < ROUNDS.length; j++) { if (!done[j]) return false; } return true; }
  function removeAward(roundIdx, idx) { records[roundIdx].splice(idx, 1); paintEntry(); }

  /* Everyone who has already earned points, in the order first entered */
  function people() {
    var seen = {}, out = [];
    records.forEach(function (round) {
      (round || []).forEach(function (e) { if (!seen[e.key]) { seen[e.key] = true; out.push({ key: e.key, name: known[e.key] || e.name }); } });
    });
    return out;
  }
  function syncTicks() {
    var keys = {};
    splitNames($("nameIn").value).forEach(function (n) { keys[keyOf(n)] = true; });
    Array.prototype.forEach.call($("picks").querySelectorAll("input"), function (cb) {
      if (!cb.disabled) { cb.checked = !!keys[cb.getAttribute("data-key")]; cb.parentNode.classList.toggle("on", cb.checked); }
    });
  }
  function toggleName(p, on) {
    var input = $("nameIn"), names = splitNames(input.value).filter(function (n) { return keyOf(n) !== p.key; });
    if (on) names.push(p.name);
    input.value = names.length ? names.join(", ") + ", " : "";
    syncTicks();
  }
  function paintPicks() {
    var box = $("picks"); clear(box);
    var list = people();
    $("picksWrap").style.display = list.length ? "" : "none";
    var dn = {};
    (records[r] || []).forEach(function (e) { dn[e.key] = true; });
    list.forEach(function (p) {
      var lab = el("label", "pick"), cb = document.createElement("input");
      cb.type = "checkbox"; cb.setAttribute("data-key", p.key);
      if (dn[p.key]) { cb.checked = true; cb.disabled = true; lab.className += " done"; }
      cb.addEventListener("change", function () { toggleName(p, cb.checked); });
      lab.appendChild(cb); lab.appendChild(document.createTextNode(p.name)); box.appendChild(lab);
    });
    syncTicks();
  }
  function paintEntry() {
    fitSoon(); paintPicks();
    var group = isGroup();
    paintPtsRow();
    var dl = $("names"); clear(dl);
    Object.keys(known).forEach(function (k) { var o = document.createElement("option"); o.value = known[k]; dl.appendChild(o); });
    var got = $("got"); clear(got);
    var round = records[r] || [];
    if (!round.length) got.appendChild(el("span", "empty", T("noneYet")));
    round.forEach(function (e, idx) {
      var pill = el("span", "pill");
      pill.appendChild(document.createTextNode(e.name + " "));
      pill.appendChild(el("b", null, "+" + e.pts));
      var x = el("button", null, "\u00D7");
      x.type = "button"; x.setAttribute("aria-label", T("removeX", { name: e.name }));
      x.addEventListener("click", function () { removeAward(r, idx); });
      pill.appendChild(x); got.appendChild(pill);
    });
    var lb = $("liveLb"); clear(lb);
    var list = totals();
    lb.appendChild(el("h4", null, T("liveTitle", { who: group ? T("grp") : T("ppl") })));
    if (!list.length) lb.appendChild(el("span", "empty", T("noPts")));
    else {
      var ol = el("ol", "lbl");
      list.slice(0, 5).forEach(function (x) {
        var li = el("li");
        li.appendChild(el("span", "rk", String(x.rank))); li.appendChild(el("span", "nm", x.name)); li.appendChild(el("span", "sc", String(x.total)));
        ol.appendChild(li);
      });
      lb.appendChild(ol);
      if (list.length > 5) lb.appendChild(el("span", "empty", T("moreN", { n: list.length - 5 })));
    }
  }

  /* Rendering */
  function paintSegs() {
    var s = $("segs"); clear(s);
    s.style.gridTemplateColumns = "repeat(" + ROUNDS.length + ", 1fr)";
    ROUNDS.forEach(function (_, i) {
      var b = el("button", "seg" + (i < r ? " past" : i === r ? " now" : ""));
      b.type = "button"; b.setAttribute("aria-label", T("qOf", { a: i + 1, b: ROUNDS.length }));
      b.addEventListener("click", function () { go(i); });
      s.appendChild(b);
    });
  }
  function paintClues() {
    var rd = ROUNDS[r], ul = $("clues"); clear(ul);
    if (rd.parts) { rd.parts.forEach(function (p, i) { ul.appendChild(el("li", null, (i + 1) + ". " + p.q)); }); return; }
    if (rd.type !== "who") return;
    rd.clues.forEach(function (c, i) {
      if (i < shown) ul.appendChild(el("li", null, c));
      else if (!revealed) ul.appendChild(el("li", "locked", T("clueHid", { i: i + 1 })));
    });
  }
  function paintAnswer() {
    var rd = ROUNDS[r], a = $("answer"); clear(a);
    a.classList.toggle("show", revealed);
    if (!revealed) return;
    a.appendChild(el("div", "tag", T("correct")));
    if (rd.parts) {
      var ol = el("ol", "plist");
      rd.parts.forEach(function (p) { ol.appendChild(el("li", null, p.a)); });
      a.appendChild(ol);
    } else a.appendChild(el("div", "big", rd.a));
    if (rd.ref || rd.why) {
      var p = el("p");
      if (rd.ref) p.appendChild(el("span", "ref", rd.ref));
      if (rd.ref && rd.why) p.appendChild(document.createTextNode(" - "));
      if (rd.why) p.appendChild(document.createTextNode(rd.why));
      a.appendChild(p);
    }
    if (rd.info && rd.info.length) {
      var box = el("div", "info");
      box.appendChild(el("h4", null, T("more")));
      if (Array.isArray(rd.info)) { var ul2 = el("ul"); rd.info.forEach(function (t) { ul2.appendChild(el("li", null, t)); }); box.appendChild(ul2); }
      else box.appendChild(el("p", null, rd.info));
      a.appendChild(box);
    }
  }
  function paintHint() {
    var rd = ROUNDS[r], st = rd.hintStages || [], h = $("hint"); clear(h);
    if (hintStep > 0 && st.length) {
      h.appendChild(el("span", "hl", T("clueLbl")));
      st[hintStep - 1].forEach(function (t) {
        var out = t.charAt(0) === "~";
        h.appendChild(el("span", "chip2" + (out ? " out" : ""), out ? t.slice(1) : t));
      });
      h.classList.add("show");
    } else h.classList.remove("show");
  }
  function paintOptions() {
    var rd = ROUNDS[r], box = $("opts"); clear(box);
    if (!rd.options) { box.style.display = "none"; return; }
    box.style.display = "";
    rd.options.forEach(function (t, i) {
      if (rd.fifty && hintStep >= 1 && Array.isArray(rd.fifty) && rd.fifty.indexOf(i) > -1) return;      // 50:50: the two wrong options are removed
      var cls = "chip2 opt";
      if (revealed && typeof rd.correct === "number") cls += (i === rd.correct ? " ok" : " dim");
      box.appendChild(el("span", cls, t));
    });
  }
  /* Rounds scored by choice (who-am-I: points by the clue answered; multi-part: points by number of parts correct) */
  function choicesFor(rd) {
    if (rd.pointChoices) return rd.pointChoices;
    if (rd.type === "who") { var out = [], top = rd.maxPts || rd.clues.length; for (var i = 0; i < rd.clues.length; i++) out.push(top - i); return out; }
    return null;
  }
  function curPts() {
    var rd = ROUNDS[r], ch = choicesFor(rd);
    if (!ch) return worthNow();
    if (selPts !== null && ch.indexOf(selPts) > -1) return selPts;
    return rd.type === "who" ? worthNow() : ch[0];
  }
  function paintPtsRow() {
    var rd = ROUNDS[r], row = $("ptsRow"), box = $("ptsChips"); clear(box);
    var ch = choicesFor(rd);
    if (!ch) { row.style.display = "none"; return; }
    row.style.display = "";
    var cur = curPts();
    ch.forEach(function (n) {
      var b = el("button", "pchip" + (n === cur ? " on" : ""), String(n));
      b.type = "button"; b.setAttribute("aria-label", T("ptsN", { n: n })); b.setAttribute("aria-pressed", n === cur ? "true" : "false");
      b.addEventListener("click", function () { selPts = n; paintEntry(); });
      box.appendChild(b);
    });
    $("ptsCap").textContent = "";
    $("ptsHelp").textContent = rd.type === "who"
      ? T("ptsHelpWho", { list: ch.map(function (n, i) { return T("ptsAfter", { n: n, i: i + 1 }); }).join("; ") })
      : (rd.parts ? T("ptsHelpParts", { n: ch[0] }) : (rd.pointsCaption || ""));
  }
  function paintRound() {
    var rd = ROUNDS[r], isWho = rd.type === "who";
    $("type").textContent = T("qOf", { a: r + 1, b: ROUNDS.length });
    var w = worthNow();
    $("worth").textContent = isWho ? T("ptsNow", { n: w }) : (rd.pointChoices ? T("ptsUpTo", { n: Math.max.apply(null, rd.pointChoices) }) : T("ptsN", { n: w }));
    var qtext = isWho ? (rd.q || T("whoAmI")) : (rd.q || "");
    $("prompt").textContent = qtext;
    $("prompt").classList.toggle("wide", !isWho && qtext.length > 90);
    $("prompt").classList.toggle("long", !isWho && qtext.length > 150);
    var introText = rd.intro || "";
    var intro = $("intro"); intro.textContent = introText; intro.style.display = introText ? "" : "none";
    paintHint(); paintOptions();
    $("hintBtn").style.display = (hasHint(rd) && !revealed) ? "" : "none";
    $("hintBtn").textContent = rd.fifty ? T("fifty") : (hintStep === 0 ? T("showClue") : (rd.hintNext || T("nextClue")));
    $("clueBtn").style.display = (isWho && !revealed && shown < rd.clues.length) ? "" : "none";
    $("revealBtn").style.display = revealed ? "none" : "";
    var lv = $("level"); lv.hidden = !rd.level; lv.textContent = rd.level ? T(rd.level === "trivia" ? "lvTrivia" : "lvDifficult") : "";
    $("nextLabel").textContent = r === ROUNDS.length - 1 ? T("finish") : T("nextQ");
    $("prev").style.visibility = r === 0 ? "hidden" : "visible";
    paintClues(); paintAnswer(); paintSegs(); paintEntry(); paintGate(); paintQVisibility(); fitSoon();
  }
  function go(i) {
    if (i < 0) return;
    if (!canGo(i)) { flash(revealed ? T("fGive") : T("fShow")); return; }
    if (i >= ROUNDS.length) { finish(); return; }
    r = i; shown = 1; revealed = false; hintStep = 0; selPts = null;
    nobodyArmed = 0; backArmed = 0;   // a remote "press again to confirm" never carries over to another question
    $("nameIn").value = "";
    if (document.activeElement === $("nameIn")) $("nameIn").blur();   // so keys such as H, T and F work again on the new question
    resetTimer(ROUNDS[r].secs || S.defaultSeconds);
    paintRound(); stopSpeech(); if (cfg && cfg.readAloud) setTimeout(function () { if (!revealed) readQuestion(false); }, 400);
  }
  function clue() { var rd = ROUNDS[r]; if (rd.type !== "who" || revealed || shown >= rd.clues.length) return; shown++; beep(440, 0.1); paintRound(); if (cfg && cfg.readAloud) readQuestion(true); }
  /* a question can have hint stages (short answer with hints) or a 50:50 button (multiple choice) */
  function hasHint(rd) {
    if (rd.fifty && rd.options) return hintStep < 1;
    var st = rd.hintStages || [];
    return st.length > 0 && hintStep < st.length;
  }
  function showHint() { var rd = ROUNDS[r], st = rd.hintStages || []; if (!hasHint(rd) || revealed) return; hintStep++; beep(440, 0.1); paintRound(); if (cfg && cfg.readAloud) readQuestion(true); }

  /* ---------- Read aloud: the browser's own text-to-speech reads the question for the participants ---------- */
  var speechOK = !!(window.speechSynthesis && window.SpeechSynthesisUtterance), voices = [], noVoiceWarned = false, speakToken = 0, speakingNow = false;
  var SPEECH_CUSTOM = { kannada: "kn-IN", gujarati: "gu-IN", sinhala: "si-LK", assamese: "as-IN", spanish: "es-ES", french: "fr-FR", portuguese: "pt-PT", swahili: "sw-KE", indonesian: "id-ID", arabic: "ar-SA", chinese: "zh-CN", russian: "ru-RU", german: "de-DE" };
  /* languages written in Devanagari can be read acceptably by a Hindi voice when no voice of their own is installed */
  var SPEECH_FALLBACK = { mr: ["hi"], ne: ["hi", "mr"] };
  /* how the option letters are spoken, so a Hindi (etc.) voice does not read "A. B. C." in English */
  var SPEECH_LETTERS = { hi: ["ए", "बी", "सी", "डी"], mr: ["ए", "बी", "सी", "डी"], ne: ["ए", "बी", "सी", "डी"], ml: ["എ", "ബി", "സി", "ഡി"], ta: ["ஏ", "பி", "சி", "டி"], te: ["ఎ", "బి", "సి", "డి"],
                         bn: ["এ", "বি", "সি", "ডি"], pa: ["ਏ", "ਬੀ", "ਸੀ", "ਡੀ"], or: ["ଏ", "ବି", "ସି", "ଡି"], ur: ["اے", "بی", "سی", "ڈی"] };
  function loadVoices() { try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
  if (speechOK) { loadVoices(); try { window.speechSynthesis.onvoiceschanged = function () { loadVoices(); refreshVoicePickers(); }; } catch (e) {} }
  function whenVoices(cb) {                                   // Chrome fills the voice list a moment after start-up: wait for it (at most 1.5 s)
    loadVoices(); if (voices.length) { cb(); return; }
    var done = false, fin = function () { if (done) return; done = true; loadVoices(); cb(); };
    try { window.speechSynthesis.addEventListener("voiceschanged", fin); } catch (e) {}
    setTimeout(fin, 1500);
  }
  function trIn(code, key) { return (I18N[code] && I18N[code][key]) || I18N.en[key] || key; }
  function langCodeOf(label) { var L = langInfo(label); return L.code === label ? L.code : ""; }
  function speechLocaleOf(lang) { var L = langInfo(lang); return L.code === lang ? L.locale : (SPEECH_CUSTOM[String(lang).toLowerCase()] || ""); }
  function speechLocale() { return speechLocaleOf(quizLang); }
  function vLang(v) { return String(v.lang || "").toLowerCase().replace("_", "-"); }
  function voiceScore(v, loc) {
    var l = vLang(v), n = String(v.name || "").toLowerCase(), sc = 0;
    if (l === loc.toLowerCase()) sc += 4;
    if (/natural|neural|online/.test(n)) sc += 3; else if (/google/.test(n)) sc += 2;
    if (v.localService) sc += 1;
    return sc;
  }
  function voicesFor(loc) {                                   // voices of this language, best first
    if (!loc) return [];
    var pre = loc.toLowerCase().split("-")[0];
    return voices.filter(function (v) { return vLang(v).split("-")[0] === pre; }).sort(function (a, b) { return voiceScore(b, loc) - voiceScore(a, loc); });
  }
  function voiceKey(v) { return v.voiceURI || v.name; }
  function savedVoice(code) {
    var k = lsGet("qms.voice." + code, ""); if (!k) return null;
    return voices.filter(function (v) { return voiceKey(v) === k || v.name === k; })[0] || null;
  }
  /* the voice to use for a quiz language: the saved choice, else the best voice of that language, else a close language, else none */
  function chooseVoice(lang) {
    var code = String(lang).toLowerCase(), loc = speechLocaleOf(lang), saved = savedVoice(code);
    if (saved) return { voice: saved, lang: saved.lang || loc, note: "" };
    var own = voicesFor(loc); if (own.length) return { voice: own[0], lang: own[0].lang || loc, note: "" };
    var fb = SPEECH_FALLBACK[code] || [];
    for (var i = 0; i < fb.length; i++) { var alt = voicesFor(speechLocaleOf(fb[i])); if (alt.length) return { voice: alt[0], lang: alt[0].lang, note: "voiceFallback", from: langInfo(fb[i]).english }; }
    return { voice: null, lang: loc, note: "" };
  }
  function paintRead() {
    var b = $("readBtn"); if (!b) return;
    b.hidden = !speechOK; b.textContent = speakingNow ? T("stopReading") : T("readAloud");
  }
  function stopSpeech() { speakToken++; speakingNow = false; try { if (speechOK) window.speechSynthesis.cancel(); } catch (e) {} paintRead(); }
  /* short pieces: some engines (Chrome with online voices) stop in the middle of a long text */
  function chunkText(t) {
    var out = [], cur = "", i, ch, stops = ".!?;:\u0964\u0965\u061F\u06D4\n";
    function flush() { if (cur.replace(/\s+/g, "")) out.push(cur.trim()); cur = ""; }
    for (i = 0; i < t.length; i++) {
      ch = t.charAt(i); cur += ch;
      if (stops.indexOf(ch) > -1 && (i + 1 >= t.length || /\s/.test(t.charAt(i + 1)))) flush();
      else if (cur.length >= 170 && /[\s,]/.test(ch)) flush();
    }
    flush(); return out;
  }
  function speakChunks(chunks, voice, lang, token) {
    if (token !== speakToken) return;
    if (!chunks.length) { speakingNow = false; paintRead(); return; }
    var u = new window.SpeechSynthesisUtterance(chunks.shift());
    if (lang) u.lang = lang;
    if (voice) u.voice = voice;
    u.rate = speechRateValue();
    u.onend = function () { speakChunks(chunks, voice, lang, token); };
    u.onerror = function () { if (token === speakToken) { speakingNow = false; paintRead(); } };
    try { window.speechSynthesis.speak(u); } catch (e) { speakingNow = false; paintRead(); }
  }
  function speakIn(text, lang, quiet) {
    if (!speechOK || !text) return;
    stopSpeech();
    var token = speakToken;
    whenVoices(function () {
      if (token !== speakToken) return;
      var pick = chooseVoice(lang);
      if (!pick.voice && voices.length && speechLocaleOf(lang)) {            // a wrong voice would be unintelligible: say so instead of reading it badly
        if (!quiet && !noVoiceWarned) { noVoiceWarned = true; flash(T("noVoice", { lang: (cfg && cfg.quizLangLabel) || lang }), 9000); }
        return;
      }
      if (pick.note && !quiet && !noVoiceWarned) { noVoiceWarned = true; flash(T(pick.note, { from: pick.from }), 6000); }
      speakingNow = true; paintRead();
      setTimeout(function () { speakChunks(chunkText(text), pick.voice, pick.lang, token); }, 70);      // a short pause after cancel(): some phones drop an immediate speak()
    });
  }
  function speak(text) { speakIn(text, quizLang, false); }
  function letter(i) { var L = SPEECH_LETTERS[langCodeOf(quizLang)]; return L ? L[i] : String.fromCharCode(65 + i); }
  function visibleOptions(rd) {
    return rd.options.map(function (t, i) { return { t: t, i: i }; }).filter(function (o) { return !(rd.fifty && hintStep >= 1 && Array.isArray(rd.fifty) && rd.fifty.indexOf(o.i) > -1); });
  }
  function questionText(onlyNew) {
    var rd = ROUNDS[r], out = [], isWho = rd.type === "who", i;
    if (!onlyNew) out.push(isWho ? (rd.q || TQ("whoAmI")) : (rd.q || ""));
    if (rd.parts && !onlyNew) rd.parts.forEach(function (p, n) { out.push((n + 1) + ". " + p.q); });
    if (rd.options && (!onlyNew || (rd.fifty && hintStep >= 1))) out.push(visibleOptions(rd).map(function (o) { return letter(o.i) + ". " + o.t; }).join(". "));
    if (isWho) { if (onlyNew) out.push(TQ("clueW") + " " + shown + ": " + rd.clues[shown - 1]); else for (i = 0; i < shown; i++) out.push(TQ("clueW") + " " + (i + 1) + ": " + rd.clues[i]); }
    if (hintStep > 0 && rd.hintStages && rd.hintStages[hintStep - 1]) out.push(rd.hintStages[hintStep - 1].filter(function (t) { return t.charAt(0) !== "~"; }).join(". "));
    return out.filter(Boolean).join(". ");
  }
  function answerText() { var rd = ROUNDS[r]; return TQ("correct") + ": " + (rd.parts ? rd.parts.map(function (p) { return p.a; }).join(". ") : rd.a); }
  function readQuestion(onlyNew) { speak(revealed ? answerText() : questionText(onlyNew)); }
  function toggleRead() { if (speakingNow) stopSpeech(); else readQuestion(false); }

  /* ---------- voice picker on the setup page and OBQ Lite: choose and test the voice for the quiz language ---------- */
  var voicePickers = [];
  function fillVoicePicker(p) {
    var lang = p.getLang(), sel = $(p.sel), note = $(p.note), wrap = $(p.wrap);
    wrap.hidden = !speechOK || !$(p.tick).checked; if (wrap.hidden) return;
    var code = String(lang || "").toLowerCase(), loc = speechLocaleOf(lang), own = voicesFor(loc), pickKey = lsGet("qms.voice." + code, "");
    clear(sel);
    var o0 = el("option", null, T("voiceAuto")); o0.value = ""; sel.appendChild(o0);
    function add(v, parent) { var o = el("option", null, v.name + " (" + v.lang + (v.localService ? "" : ", online") + ")"); o.value = voiceKey(v); (parent || sel).appendChild(o); }
    own.forEach(function (v) { add(v); });
    var others = voices.filter(function (v) { return own.indexOf(v) < 0; });
    if (others.length) { var g = el("optgroup"); g.label = T("voiceOthers"); others.forEach(function (v) { add(v, g); }); sel.appendChild(g); }
    sel.value = pickKey; if (sel.value !== pickKey) sel.value = "";
    var pick = chooseVoice(lang);
    note.textContent = !lang ? "" : (own.length ? T("voiceFound", { n: own.length, lang: loc }) : (pick.voice ? (pick.from ? T("voiceFallback", { from: pick.from }) : T("voiceChosen")) : T("voiceNone", { lang: loc || lang })));
  }
  function refreshVoicePickers() { voicePickers.forEach(function (p) { try { fillVoicePicker(p); } catch (e) {} }); }
  function wireVoicePicker(p) {
    voicePickers.push(p);
    $(p.sel).addEventListener("change", function () { var lang = p.getLang(); if (lang) lsSet("qms.voice." + String(lang).toLowerCase(), $(p.sel).value); fillVoicePicker(p); });
    $(p.test).addEventListener("click", function () {
      var lang = p.getLang(); if (!lang) return;
      var code = langCodeOf(lang) || "en";
      speakIn(trIn(code, "begin") + ". " + trIn(code, "correct") + ".", lang, false);
    });
    $(p.tick).addEventListener("change", function () { fillVoicePicker(p); });
  }

  function reveal() {
    if (revealed) return;
    revealed = true; stopTimer(); paintTimer(); chime(); timeUp = false; paintRound();
    pulse($("addBtn"));
  }

  /* Final screen */
  function finish() {
    stopTimer(); stopSpeech();
    var group = isGroup(), list = totals(), h = $("winner"); clear(h);
    var ev = cfg ? cfg.event : "", dt = fmtDate(cfg ? cfg.date : todayISO());
    if (!list.length) h.appendChild(el("span", "w-top", T("endDone", { event: ev, date: dt })));
    else {
      var winners = list.filter(function (x) { return x.rank === 1; });
      h.appendChild(el("span", "w-top", T("endWin", { event: ev, date: dt })));
      h.appendChild(el("span", "w-name", winners.map(function (w) { return w.name; }).join(", ") + "!"));
    }
    $("lbTitle").textContent = T("liveTitle", { who: group ? T("grp") : T("ppl") });
    var ol = $("rank"); clear(ol);
    ol.className = "rank" + (list.length > 8 ? " two" : "");
    if (!list.length) ol.appendChild(el("li", null, T("noWin")));
    else list.forEach(function (x) {
      var li = el("li", x.rank <= 3 ? "r" + x.rank : "");
      li.appendChild(el("span", "rk", String(x.rank))); li.appendChild(el("span", "nm", x.name)); li.appendChild(el("b", null, T("ptsW", { n: x.total })));
      ol.appendChild(li);
    });
    $("verseText").textContent = T("closing"); $("verseRef").textContent = ""; $("verseRef").style.display = "none";
    $("exportMsg").textContent = "";
    var mins = Math.round((Date.now() - startedAt) / 60000);
    track("quiz_complete", { questions: ROUNDS.length, requested: cfg ? cfg.numQ : 0, scored: list.length, minutes: mins, mode: cfg ? cfg.mode : "", sample: !!(cfg && cfg.sample),
      quiz_lang: cfg ? cfg.quizLang : "", ui_lang: cfg ? cfg.uiLang : "", scope: cfg ? cfg.scope : "", source: cfg ? cfg.source : "", participants: cfg ? cfg.parts : 0 });
    curRecord = (cfg && !cfg.sample) ? makeRecord(list, mins) : null;                  // results stay on this device
    if (curRecord) addHistory(curRecord);
    photoReset();                                                       // a new final page: the photo box starts empty
    var basic = S.edition === "basic";
    $("csvBtn").hidden = basic || !curRecord; $("saveCloud").hidden = basic || !(curRecord && ownConnected()); $("endHome").hidden = basic;
    $("saveRedo").hidden = basic || !(cfg && !cfg.sample); markClearSetup();
    var guest = !!(user && user.guest); $("guestEnd").hidden = !guest; $("again").hidden = guest;           // the next time the setup page opens it starts empty (name kept)
    show("end"); if (curRecord && cfg.saveResults && ownConnected()) sendRecord(curRecord); if (list.length) { burst(80); chime(); }
  }
  function burst(n) {
    var c = S.colors, colors = [c.accent, c.chip, c.good, "#FFB347", c.ink], box = $("confetti");
    for (var i = 0; i < n; i++) {
      var p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw"; p.style.background = colors[i % colors.length];
      p.style.animationDuration = (1.6 + Math.random() * 1.6) + "s"; p.style.animationDelay = (Math.random() * 0.4) + "s";
      box.appendChild(p);
      (function (e) { setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 4000); })(p);
    }
  }
  function startQuiz(c, rounds) {
    cfg = c; quizLang = c.quizLang || "en"; ROUNDS = rounds; mode = c.mode || "group";
    bump("quizzes"); bump("questions", rounds.length); recordUsage(c, rounds.length);
    if (!c.sample) { bump("participants", c.parts || 0); addLang(c.quizLangLabel || c.quizLang); }              // totals shown in the activity dashboard
    track("quiz_start", { questions: rounds.length, mode: mode, quiz_lang: quizLang });
    keepAwake(); noVoiceWarned = false;
    if (fsSupported() && !isFs()) enterFs();                  // full screen from the first question (the browser allows it right after the Start click)
    records = []; done = []; known = {}; startedAt = Date.now();
    $("nameIn").value = ""; paintSoundLabel(); applyI18n();
    show("game"); paintRead(); go(0);
  }

  /* =====================================================================
     KEYBOARD AND PRESENTATION REMOTE
       Next  = PageDown, right arrow, Space, Enter   (a remote's "next slide" button)
       Back  = PageUp, left arrow                    (a remote's "previous slide" button)
       Timer = T, "." or B                           (a remote's "black screen" button)
       F5 or F = full screen   H = clue   N = names
     ===================================================================== */
  var NEXT_KEYS = { PageDown: 1, ArrowRight: 1, " ": 1, Enter: 1, MediaTrackNext: 1 };
  var PREV_KEYS = { PageUp: 1, ArrowLeft: 1, MediaTrackPrevious: 1 };
  var nobodyArmed = 0, backArmed = 0;
  function advance() {
    var rd = ROUNDS[r];
    if (!revealed) {
      if (rd.type === "who" && shown < rd.clues.length) clue();
      else reveal();
      return;
    }
    if (!done[r]) {
      if (normName($("nameIn").value)) { award(); return; }
      var now = Date.now();
      if (now - nobodyArmed < 3500) { nobodyArmed = 0; award(); }
      else { nobodyArmed = now; flash(T("fConfirm")); }
      return;
    }
    go(r + 1);
  }
  function retreat() {
    if (r === 0) return;
    if (revealed && !done[r]) {
      var now = Date.now();
      if (now - backArmed > 3500) { backArmed = now; flash(T("fBack2")); return; }
      backArmed = 0;
    }
    go(r - 1);
  }
  function remoteTest(e) {
    var k = e.key, f = NEXT_KEYS[k] ? T("rNext") : PREV_KEYS[k] ? T("rBack") : (/^(t|T|\.|b|B|MediaPlayPause)$/.test(k) ? T("rTimer") : (/^(f|F|F5)$/.test(k) ? T("rFs") : T("rNone")));
    $("remoteOut").textContent = T("remoteKey", { k: k === " " ? "Space" : k, f: f });
  }
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, tag = e.target && e.target.tagName, inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    if ($("settings").classList.contains("active")) { if (!inField) remoteTest(e); return; }
    if (!$("game").classList.contains("active")) return;
    if (k === "F5") { e.preventDefault(); toggleFs(); return; }
    if (inField) {
      if (k === "PageDown") { e.preventDefault(); advance(); }
      else if (k === "PageUp") { e.preventDefault(); retreat(); }
      return;
    }
    if (k === "f" || k === "F") { toggleFs(); return; }
    if (tag === "BUTTON" && (k === " " || k === "Enter")) return;
    if (NEXT_KEYS[k]) { e.preventDefault(); advance(); }
    else if (PREV_KEYS[k]) { e.preventDefault(); retreat(); }
    else if (k === "t" || k === "T" || k === "." || k === "b" || k === "B" || k === "MediaPlayPause") { e.preventDefault(); toggleTimer(); }
    else if (k === "h" || k === "H") { showHint(); }
    else if (k === "r" || k === "R") { toggleRead(); }
    else if (k === "n" || k === "N") { e.preventDefault(); $("nameIn").focus(); }
  }
  function wireGame() {
    $("again").addEventListener("click", function () { stopTimer(); if (cfg && cfg.lite) openLite(); else goSetup(); });
    $("endHome").addEventListener("click", function () { stopTimer(); goHomePage(); });
    var homeArmed = 0;
    $("gameHome").addEventListener("click", function () {   // leaving a running quiz needs a second press
      var now = Date.now();
      if (now - homeArmed < 4000) { homeArmed = 0; stopTimer(); goHomePage(); return; }
      homeArmed = now; flash(T("homeConfirm"));
    });
    $("exportBtn").addEventListener("click", exportResults);
    $("clueBtn").addEventListener("click", clue);
    $("hintBtn").addEventListener("click", showHint);
    $("revealBtn").addEventListener("click", reveal);
    $("nextBtn").addEventListener("click", function () { go(r + 1); });
    $("prev").addEventListener("click", function () { go(r - 1); });
    $("tgo").addEventListener("click", toggleTimer);
    $("treset").addEventListener("click", function () { resetTimer(ROUNDS[r].secs || S.defaultSeconds); });
    $("addBtn").addEventListener("click", award);
    $("nameIn").addEventListener("input", syncTicks);
    $("nameIn").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); award(); }
      else if (e.key === "Escape") { $("nameIn").blur(); }
    });
    $("sound").addEventListener("click", function () { soundOn = !soundOn; settings.sound = soundOn; saveSettings(); paintSoundLabel(); });
    $("readBtn").addEventListener("click", toggleRead);
    document.addEventListener("keydown", onKey);
  }

  /* Full screen and keep-awake */
  var FS_EXPAND = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  var FS_COLLAPSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  function fsSupported() { var d = document; return !!(d.fullscreenEnabled || d.webkitFullscreenEnabled); }
  function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function enterFs() { try { var e = document.documentElement, req = e.requestFullscreen || e.webkitRequestFullscreen; if (req && !isFs()) { var p = req.call(e); if (p && p.catch) p.catch(function () {}); } } catch (x) {} }
  function exitFs() { try { var ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex) { var p = ex.call(document); if (p && p.catch) p.catch(function () {}); } } catch (x) {} }
  function toggleFs() { if (isFs()) exitFs(); else enterFs(); }
  function paintFs() {
    var f = $("fs"), on = isFs(); clear(f);
    f.insertAdjacentHTML("beforeend", on ? FS_COLLAPSE : FS_EXPAND); f.appendChild(el("span", null, T(on ? "exitFsHint" : "fs")));
    $("exitFs").hidden = !isFs(); $("exitFs2").hidden = !isFs();          // clear "Exit full screen" buttons on every page
  }
  var wakeLock = null;
  function keepAwake() { if (settings.wake === false) return; try { if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request("screen").then(function (l) { wakeLock = l; }).catch(function () {}); } catch (x) {} }

  /* Landscape: fit each column on one screen by shrinking its content instead of scrolling */
  var MIN_FIT = 0.45, fitQueued = false;
  function fitColumns() {
    var g = $("game"), land = false;
    try { land = !!(window.matchMedia && window.matchMedia("(orientation: landscape) and (min-width: 640px)").matches); } catch (e) {}
    ["fitL", "fitR"].forEach(function (id) {
      var inner = $(id), box = inner && inner.parentNode;
      if (!inner || !box || !inner.getBoundingClientRect) return;
      if (!land || !g.classList.contains("active")) { inner.style.zoom = ""; return; }
      var z = 1, guard = 0;
      inner.style.zoom = "1";
      while (inner.getBoundingClientRect().height > box.clientHeight + 1 && z > MIN_FIT && guard++ < 40) { z = Math.max(MIN_FIT, Math.round((z - 0.025) * 1000) / 1000); inner.style.zoom = String(z); }
    });
  }
  function fitSoon() {
    if (fitQueued) return;
    fitQueued = true;
    var run = function () { fitQueued = false; fitColumns(); };
    if (window.requestAnimationFrame) window.requestAnimationFrame(run); else setTimeout(run, 0);
  }
