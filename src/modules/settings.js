/* @module {"name":"settings","exports":["saveSettings","fontStack","speechRateValue","applySettings","setAnalytics","acceptTermsFor","openTerms","resetTermsBox","openSettings","paintInstall","wireSettings"],"uses":["$","S","T","XLSX_URL","analyticsAnswered","applyColors","clear","el","fb","fitSoon","forgetDevice","goHomePage","langCodeOf","langInfo","localUsers","lsGet","lsSet","normName","paintMyData","paintSoundLabel","rememberPref","sessGet","setUrl","show","signOut","soundOn","speakIn","trIn","track","ui","user"]} */

  /* =====================================================================
     SETTINGS (theme, font, text size, sound, read-aloud speed, analytics) and TERMS AND CONDITIONS
     ===================================================================== */
  var SETTINGS_DEFAULT = { theme: S.defaultTheme || "dark", font: "default", size: "m", sound: true, speed: "normal", wake: true, sidebar: "rail" };
  var settings = (function () { var s = lsGet("qms.settings", {}), o = {}, k; for (k in SETTINGS_DEFAULT) o[k] = SETTINGS_DEFAULT[k]; for (k in s) if (k in SETTINGS_DEFAULT) o[k] = s[k]; return o; })();
  var FONT_STACKS = { system: 'system-ui, -apple-system, "Segoe UI", Roboto', serif: 'Georgia, "Times New Roman"' };
  var SIZE_SCALE = { s: 0.9, m: 1, l: 1.15, xl: 1.3 };
  var SPEEDS = { slow: 0.75, normal: 0.9, fast: 1.05 };
  function saveSettings() { lsSet("qms.settings", settings); }
  function fontStack(li) { var u = FONT_STACKS[settings.font]; return u ? u + ", " + li.font : li.font; }
  function speechRateValue() { return SPEEDS[settings.speed] || S.speechRate || 0.9; }
  function applyTheme() {
    var t = settings.theme, dark = t === "dark";
    if (t === "system") { try { dark = !(window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches); } catch (e) { dark = true; } }
    var root = document.documentElement;
    applyColors(dark ? S.colors : (S.colorsLight || S.colors));
    root.style.colorScheme = dark ? "dark" : "light"; root.setAttribute("data-theme", dark ? "dark" : "light");
  }
  function applySettings() {
    applyTheme();
    document.documentElement.style.setProperty("--fs", String(SIZE_SCALE[settings.size] || 1));
    document.documentElement.style.setProperty("--font", fontStack(langInfo(ui)));
    soundOn = settings.sound !== false; paintSoundLabel();
    if (typeof fitSoon === "function") fitSoon();
  }

  /* ---------- analytics on / off (also what the Terms say: it can be turned off at any time) ---------- */
  function setAnalytics(on) {
    if (user) user.consent = on;
    if (S.firebase.measurementId) window["ga-disable-" + S.firebase.measurementId] = !on;
    if (fb.analytics) { try { fb.analytics.setAnalyticsCollectionEnabled(on); } catch (e) {} }
    if (fb.on && user && user.uid) { fb.db.collection("quizMasters").doc(user.uid).update({ consent: on }).catch(function () {}); }
    else if (user && user.email) { var us = localUsers(), k = user.email.toLowerCase(); if (us[k]) { us[k].profile.consent = on; lsSet("qms.users", us); } }
  }
  function acceptTermsFor(p) {                                    // stores the accepted version with the account
    if (fb.on && p.uid) return fb.db.collection("quizMasters").doc(p.uid).update({ terms: S.termsVersion, termsAt: window.firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {});
    var us = localUsers(), k = String(p.email || "").toLowerCase();
    if (us[k]) { us[k].profile.terms = S.termsVersion; lsSet("qms.users", us); }
    return Promise.resolve();
  }

  /* ---------- the Terms and Conditions pop-up ---------- */
  var termsOpts = null;
  function fillTerms() {
    Array.prototype.forEach.call(document.querySelectorAll(".t-operator"), function (n) { n.textContent = S.operatorName || T("termsOperatorDefault"); });
    Array.prototype.forEach.call(document.querySelectorAll(".t-contact"), function (n) { n.textContent = S.contactEmail || T("termsContactDefault"); });
    $("termsVer").textContent = T("termsVer", { v: S.termsVersion });
  }
  function checkTermsScroll() {
    var b = $("termsBody"), mode = termsOpts ? termsOpts.mode : "view", done = mode === "view" || (b.scrollHeight - b.scrollTop - b.clientHeight < 14);
    $("termsAccept").disabled = !done; $("termsHint").hidden = done;
  }
  function openTerms(opts) {
    termsOpts = opts || { mode: "view" }; var m = termsOpts.mode; fillTerms();
    $("termsAccept").hidden = m === "view"; $("termsDecline").hidden = m !== "required"; $("termsClose").hidden = m === "required";
    $("termsIntro").textContent = m === "required" ? T("termsReqIntro") : "";
    $("termsModal").hidden = false; $("termsBody").scrollTop = 0;
    setTimeout(function () { checkTermsScroll(); $("termsBody").focus(); }, 40);
  }
  function closeTerms() { $("termsModal").hidden = true; }
  function wireTermsBox(cb, link) {                               // a tick box that can only be ticked after the Terms were opened and read to the end
    var accept = function () { $(cb).setAttribute("data-read", "1"); $(cb).checked = true; };
    $(cb).addEventListener("click", function (e) {
      if (!$(cb).checked || $(cb).getAttribute("data-read")) return;
      e.preventDefault(); $(cb).checked = false; openTerms({ mode: "accept", onAccept: accept });
    });
    $(link).addEventListener("click", function () { openTerms({ mode: "accept", onAccept: accept }); });
  }
  function resetTermsBox(cb) { $(cb).checked = false; $(cb).removeAttribute("data-read"); }

  /* ---------- the Settings screen ---------- */
  function openSettings(focusId) {
    paintSettings(); show("settings"); var id = typeof focusId === "string" ? focusId : ""; setUrl(id === "setProfile" ? "profile" : (id === "panelRemote" ? "settings/remote" : "settings"));
    if (id) setTimeout(function () { var p = $(id); if (p) p.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  }
  /* ---------- install the app (PWA) and offline use ---------- */
  var installEvt = null;
  try {
    window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installEvt = e; paintInstall(); });
    window.addEventListener("appinstalled", function () { installEvt = null; lsSet("qms.installed", true); paintInstall(); });
  } catch (e) {}
  function isStandalone() { try { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; } catch (e) { return false; } }
  function isIOS() { var ua = navigator.userAgent || ""; return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function canBePwa() { return !!(document.querySelector('link[rel="manifest"]') && "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")); }
  function doInstall() {
    if (!installEvt) return;
    installEvt.prompt(); installEvt.userChoice.then(function (c) { if (c && c.outcome === "accepted") track("pwa_install", {}); installEvt = null; paintInstall(); }, function () {});
  }
  function paintInstall() {
    var standalone = isStandalone(), can = canBePwa();
    var state = $("setInstallState"), btn = $("setInstallBtn"), help = $("setInstallHelp"), off = $("setOfflineState");
    state.textContent = standalone ? T("installedYes") : (can ? T("installedNo") : T("installNoPwa"));
    btn.hidden = !installEvt || standalone; help.textContent = (standalone || installEvt || !can) ? "" : (isIOS() ? T("installIOS") : T("installOther"));
    $("homeInstall").hidden = standalone || !can;                                              // the Home page invites to install (not when already installed)
    $("homeInstallText").textContent = T("homeInstallText") + (!installEvt && isIOS() ? " " + T("installIOS") : "");
    $("homeInstallBtn").hidden = !installEvt;
    if (can && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(function (r) { off.textContent = (r && r.active) ? T("offReady") : T("offNotReady"); }, function () { off.textContent = T("offNotReady"); });
    } else off.textContent = T("offSingle");
    var ex = $("setOfflineExcel"); ex.textContent = "";
    if (can && window.caches && caches.match) caches.match(XLSX_URL).then(function (h) { ex.textContent = T(h ? "offExcelReady" : "offExcelNot"); }, function () {});
  }
  function paintSettings() {
    var u = user || {};                                           // profile block: the current details
    $("setName").value = u.name || ""; $("setEmail").value = u.email || ""; $("setOrg").value = u.org || ""; $("setCountry").value = u.country || "";
    var su = $("setUsage"); clear(su); var o0 = el("option", null, T("usage")); o0.value = ""; su.appendChild(o0);
    [["church", "use1"], ["school", "use2"], ["community", "use3"], ["work", "use4"]].forEach(function (x) { var o = el("option", null, T(x[1])); o.value = x[0]; su.appendChild(o); });
    su.value = u.usage || ""; $("setProfileMsg").textContent = ""; $("setProfileMsg").className = "okmsg"; $("setProfileSave").disabled = false;
    Array.prototype.forEach.call(document.querySelectorAll("#settings [data-theme-set]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-theme-set") === settings.theme ? "true" : "false"); });
    var sf = $("setFont"); clear(sf);
    [["default", "fontDefault"], ["system", "fontSystem"], ["serif", "fontSerif"]].forEach(function (f) { var o = el("option", null, T(f[1])); o.value = f[0]; sf.appendChild(o); }); sf.value = settings.font;
    var sz = $("setSize"); clear(sz);
    [["s", "sizeS"], ["m", "sizeM"], ["l", "sizeL"], ["xl", "sizeXL"]].forEach(function (z) {
      var b = el("button", null, T(z[1])); b.type = "button"; b.setAttribute("aria-pressed", settings.size === z[0] ? "true" : "false");
      b.addEventListener("click", function () { settings.size = z[0]; saveSettings(); applySettings(); paintSettings(); }); sz.appendChild(b);
    });
    $("setSound").checked = settings.sound !== false; $("setWake").checked = settings.wake !== false;
    var sp = $("setSpeed"); clear(sp);
    [["slow", "speedSlow"], ["normal", "speedNormal"], ["fast", "speedFast"]].forEach(function (f) { var o = el("option", null, T(f[1])); o.value = f[0]; sp.appendChild(o); }); sp.value = settings.speed;
    $("setAnalytics").checked = !!(user && user.consent === true);
    $("setAnalyticsNote").textContent = fb.on ? T("setAnalyticsNote") : T("setAnalyticsLocal");
    $("setDeviceInfo").textContent = (rememberPref() && sessGet()) ? T("setRememberedOn") : T("setRememberedOff");
    $("setTermsInfo").textContent = user && user.terms ? T("setTermsInfo", { v: user.terms }) : "";
    $("setMsg").textContent = ""; $("remoteOut").textContent = "-"; paintInstall(); paintMyData();
  }
  /* saves the profile: Firestore (and the sign-in display name) when online, the local account otherwise */
  function saveProfile() {
    var msg = $("setProfileMsg"), btn = $("setProfileSave");
    var p = { name: normName($("setName").value), org: normName($("setOrg").value), country: normName($("setCountry").value), usage: $("setUsage").value };
    if (!user) return;
    if (!p.name || !p.org || !p.country || !p.usage) { msg.className = "err"; msg.textContent = T("errFill"); return; }
    var done = function () {
      user.name = p.name; user.org = p.org; user.country = p.country; user.usage = p.usage;
      $("uname").textContent = user.name; $("uchip").title = user.org || ""; btn.disabled = false; msg.className = "okmsg"; msg.textContent = T("setProfileOk");
      $("homeWelcome").textContent = T("homeWelcome", { name: user.name }); track("profile_update", {});
    };
    var fail = function () { btn.disabled = false; msg.className = "err"; msg.textContent = T("setProfileErr"); };
    btn.disabled = true; msg.className = "note"; msg.textContent = "...";
    if (fb.on && user.uid) {
      var F = window.firebase.firestore.FieldValue, ref = fb.db.collection("quizMasters").doc(user.uid);
      ref.update({ name: p.name, org: p.org, country: p.country, usage: p.usage }).then(function () {
        try { fb.auth.currentUser.updateProfile({ displayName: p.name }); } catch (e) {}
        done();
      }, function (e) {
        if (e && e.code === "not-found") {                          // no profile record yet: create it
          ref.set({ name: p.name, email: user.email, org: p.org, country: p.country, usage: p.usage, consent: user.consent === true, terms: user.terms || S.termsVersion, termsAt: F.serverTimestamp(), createdAt: F.serverTimestamp(), loginCount: 0 }).then(done, fail);
        } else fail();
      });
    } else {
      var us = localUsers(), k = String(user.email || "").toLowerCase();
      if (us[k]) { us[k].profile.name = p.name; us[k].profile.org = p.org; us[k].profile.country = p.country; us[k].profile.usage = p.usage; lsSet("qms.users", us); }
      done();
    }
  }
  function wireSettings() {
    $("setProfileSave").addEventListener("click", saveProfile);
    ["setName", "setOrg", "setCountry"].forEach(function (id) { $(id).addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); saveProfile(); } }); });
    $("goSettings").addEventListener("click", function () { openSettings(); }); $("setHome").addEventListener("click", goHomePage);
    $("setInstallBtn").addEventListener("click", doInstall); $("homeInstallBtn").addEventListener("click", doInstall);
    Array.prototype.forEach.call(document.querySelectorAll("#settings [data-theme-set]"), function (b) {
      b.addEventListener("click", function () { settings.theme = b.getAttribute("data-theme-set"); saveSettings(); applyTheme(); paintSettings(); });
    });
    $("setFont").addEventListener("change", function () { settings.font = $("setFont").value; saveSettings(); applySettings(); });
    $("setSound").addEventListener("change", function () { settings.sound = $("setSound").checked; saveSettings(); applySettings(); });
    $("setWake").addEventListener("change", function () { settings.wake = $("setWake").checked; saveSettings(); });
    $("setSpeed").addEventListener("change", function () { settings.speed = $("setSpeed").value; saveSettings(); speakIn(trIn(langCodeOf(ui) || "en", "begin"), ui, true); });
    $("setAnalytics").addEventListener("change", function () { setAnalytics($("setAnalytics").checked); analyticsAnswered(); track("analytics_toggle", { on: $("setAnalytics").checked }); $("setMsg").textContent = $("setAnalytics").checked ? T("setAnalyticsOn") : T("setAnalyticsOff"); });
    $("setForget").addEventListener("click", function () { forgetDevice(); signOut(); });
    $("setTermsBtn").addEventListener("click", function () { openTerms({ mode: "view" }); });
    $("setReset").addEventListener("click", function () { var k; for (k in SETTINGS_DEFAULT) settings[k] = SETTINGS_DEFAULT[k]; saveSettings(); applySettings(); paintSettings(); $("setMsg").textContent = T("setResetDone"); });
    $("termsBody").addEventListener("scroll", checkTermsScroll); window.addEventListener("resize", function () { if (!$("termsModal").hidden) checkTermsScroll(); });
    $("termsAccept").addEventListener("click", function () { var o = termsOpts; closeTerms(); if (o && o.onAccept) o.onAccept(); });
    $("termsDecline").addEventListener("click", function () { var o = termsOpts; closeTerms(); if (o && o.onDecline) o.onDecline(); });
    $("termsClose").addEventListener("click", function () { var o = termsOpts; closeTerms(); if (o && o.onClose) o.onClose(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("termsModal").hidden && termsOpts && termsOpts.mode !== "required") closeTerms(); });
    wireTermsBox("upTerms", "upTermsLink"); wireTermsBox("pfTerms", "pfTermsLink");
    try { var mq = window.matchMedia("(prefers-color-scheme: dark)"); var chg = function () { if (settings.theme === "system") applyTheme(); }; if (mq.addEventListener) mq.addEventListener("change", chg); } catch (e) {}
  }
