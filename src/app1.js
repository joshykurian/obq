(function () {
  "use strict";
  /* =====================================================================
     4. ENGINE  -  you normally never edit below this line.
     ===================================================================== */
  var S = QUIZ_SETTINGS, LANGS = QUIZ_LANGUAGES, I18N = QUIZ_I18N;
  var BOOKS_OT = QUIZ_BOOKS_OT, BOOKS_NT = QUIZ_BOOKS_NT, ALL_BOOKS = BOOKS_OT.concat(BOOKS_NT);
  var TEMPLATE_B64 = "/*TEMPLATE_B64*/";     // filled in by the build step: the Excel question-bank template
  var XLSX_URL = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

  /* ---------- small helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function z2(n) { return (n < 10 ? "0" : "") + n; }
  function shuffle(a) { var b = a.slice(), i, j, t; for (i = b.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  function normName(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function keyOf(n) { return n.toLowerCase(); }
  function langInfo(code) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i]; return LANGS[0]; }
  function langByName(v) {
    v = normName(v).toLowerCase(); if (!v) return "";
    for (var i = 0; i < LANGS.length; i++) { var L = LANGS[i]; if (v === L.code || v === L.english.toLowerCase() || v === L.native.toLowerCase() || (v === "oriya" && L.code === "or") || (v === "odiya" && L.code === "or")) return L.code; }
    return null;
  }
  function todayISO() { var d = new Date(); return d.getFullYear() + "-" + z2(d.getMonth() + 1) + "-" + z2(d.getDate()); }
  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }

  /* ---------- storage (falls back to memory when the browser blocks it) ---------- */
  var mem = {};
  function lsGet(k, d) { try { var v = window.localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return (k in mem) ? mem[k] : d; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { mem[k] = v; } }
  function lsDel(k) { try { window.localStorage.removeItem(k); } catch (e) {} delete mem[k]; }

  /* ---------- state ---------- */
  var ui = "en", quizLang = "en";
  var user = null;                 // { email, name, org, country, usage, consent, uid }
  var bank = [];                   // the Quiz Master's uploaded questions
  var cfg = null;                  // details of the quiz being run (from the setup page)
  var ROUNDS = [];                 // the questions of the quiz being run
  var fb = { on: false, auth: null, db: null, analytics: null };

  /* ---------- interface text ---------- */
  function T(key, vars, lang) {
    var d = I18N[lang || ui], s = (d && d[key] != null) ? d[key] : (I18N.en[key] != null ? I18N.en[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }
  function TQ(key, vars) { return T(key, vars, quizLang); }
  function applyI18n() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (n) { n.textContent = T(n.getAttribute("data-i18n")); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-ph]"), function (n) { n.placeholder = T(n.getAttribute("data-i18n-ph")); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-aria]"), function (n) { var t = T(n.getAttribute("data-i18n-aria")); n.setAttribute("aria-label", t); n.title = t; });
    document.title = (cfg && cfg.event ? cfg.event + " - " : "") + S.appName;
  }
  function setUi(code, skipPaint) {
    if (!I18N[code]) code = "en";
    ui = code; lsSet("qms.ui", code);
    var li = langInfo(code), root = document.documentElement;
    root.lang = code; root.dir = li.dir; root.style.setProperty("--font", fontStack(li));
    applyI18n();
    if (!skipPaint) repaintStatic();
  }
  function fmtDate(iso) {
    try {
      var p = String(iso || todayISO()).split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
      return new Intl.DateTimeFormat(langInfo(ui).locale, S.dateOptions).format(d);
    } catch (e) { return iso; }
  }

  /* ---------- colours and brand ---------- */
  function applyColors(pal) {
    var c = pal || S.colors, st = document.documentElement.style;
    var map = { bg: "--bg", panel: "--panel", panelHi: "--panel-hi", ink: "--ink", muted: "--muted", accent: "--sun", accentInk: "--sun-ink", chip: "--pink", good: "--good", goodInk: "--good-ink", bad: "--bad" };
    Object.keys(map).forEach(function (k) { if (c[k]) st.setProperty(map[k], c[k]); });
    var m = /^#?([0-9a-f]{6})$/i.exec(c.ink || ""); if (m) { var n = parseInt(m[1], 16); st.setProperty("--line", "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + ",.16)"); }
    var tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute("content", c.bg);
  }
  function paintBrand() {
    $("bname").textContent = S.appName; $("btag").textContent = S.tagline || ""; $("btag").style.display = S.tagline ? "" : "none";
    var lg = $("logo"), al = $("authLogo"), has = !!(S.logo && S.logo !== "@logo");
    lg.hidden = !has; al.hidden = !has; var wl = $("welcomeLogo"); wl.hidden = !has; if (has) { wl.src = S.logo; wl.alt = S.appName; }
    if (has) { lg.src = S.logo; lg.alt = S.appName; al.src = S.logo; al.alt = S.appName; }
    $("bname").classList.toggle("sr", has);                                   // the logo already shows the name: keep the text for screen readers only
    $("btag").style.display = (S.tagline && !has) ? "" : "none";
  }

  /* ---------- screens ---------- */
  var SCREENS = ["auth", "welcome", "home", "lite", "setup", "dashboard", "resultsPage", "analytics", "about", "admin", "ownguide", "qmguide", "settings", "game", "end"];
  function show(id) {
    SCREENS.forEach(function (s) { $(s).classList.toggle("active", s === id); });
    document.body.setAttribute("data-screen", id);
    $("tbRight").hidden = !(user && (S.edition !== "basic") && (id === "home" || id === "lite" || id === "settings" || id === "setup" || id === "dashboard" || id === "resultsPage" || id === "analytics" || id === "about" || id === "admin" || id === "ownguide" || id === "qmguide"));
    paintSidebar(id); window.scrollTo(0, 0);
  }

  /* ---------- usage statistics kept on this device ---------- */
  function stats() {
    var s = lsGet("qms.stats", { quizzes: 0, questions: 0, pdfs: 0 });
    if (s.participants === undefined) {                                     // quizzes run before these totals existed: count them from the saved results
      var h = typeof history === "function" ? history() : [];
      s.participants = h.reduce(function (n, r) { return n + (parseInt(r.participants, 10) || 0); }, 0);
      s.langs = []; h.forEach(function (r) { if (r.quizLang && s.langs.indexOf(r.quizLang) < 0) s.langs.push(r.quizLang); });
      lsSet("qms.stats", s);
    }
    return s;
  }
  /* the day this Quiz Master started using OBQ: the earliest of the recorded first sign-in, the oldest finished quiz and the account creation date */
  function sinceKey() { return "qms.since." + ((user && (user.uid || user.email)) || ""); }
  function noteStartDate(p) {
    var k = sinceKey(), cand = [lsGet(k, "")], h = [];
    try { h = history(); } catch (e) {}
    if (h.length && h[h.length - 1].completedAt) cand.push(h[h.length - 1].completedAt);
    try { var ca = p && p.createdAt && (p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt)); if (ca && !isNaN(ca)) cand.push(ca.toISOString()); } catch (e) {}
    cand = cand.filter(Boolean).sort(); var v = cand.length ? cand[0] : new Date().toISOString(); if (v !== lsGet(k, "")) lsSet(k, v); return v;
  }
  function startDateISO() { return noteStartDate(user); }
  function addLang(l) { var s = stats(); s.langs = s.langs || []; if (l && s.langs.indexOf(l) < 0) { s.langs.push(l); lsSet("qms.stats", s); } }
  function bump(k, n) { var s = stats(); s[k] = (s[k] || 0) + (n || 1); lsSet("qms.stats", s); }
  function track(name, params) {
    if (fb.analytics && user && user.consent === true) { try { fb.analytics.logEvent(name, params || {}); } catch (e) {} }
  }

  /* ---------- Firebase (only when settings.firebase.apiKey is filled in) ---------- */
  function fbConfigured() { return !!(S.firebase && S.firebase.apiKey && S.firebase.projectId); }
  function loadScript(src, tries) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = res; s.onerror = function () { s.remove(); if ((tries || 0) < 1) loadScript(src, (tries || 0) + 1).then(res, rej); else rej(new Error("Could not load " + src)); };   // one automatic retry
      document.head.appendChild(s);
    });
  }
  function initFirebase() {
    if (!fbConfigured()) return Promise.resolve(false);
    var base = "https://www.gstatic.com/firebasejs/" + S.firebaseSdkVersion + "/";
    var timeout = new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, 25000); });
    var load = loadScript(base + "firebase-app-compat.js").then(function () {
      return Promise.all([loadScript(base + "firebase-auth-compat.js"), loadScript(base + "firebase-firestore-compat.js")]);
    }).then(function () {
      if (!window.firebase.apps || !window.firebase.apps.length) window.firebase.initializeApp(S.firebase);
      if (S.firebase.appCheckSiteKey) {                              // App Check (optional): the database only answers the real app
        return loadScript(base + "firebase-app-check-compat.js").then(function () { try { window.firebase.appCheck().activate(S.firebase.appCheckSiteKey, true); } catch (e) {} }, function () {});
      }
    }).then(function () {
      fb.auth = window.firebase.auth(); fb.db = window.firebase.firestore(); fb.on = true;
      if (S.firebase.measurementId) {
        window["ga-disable-" + S.firebase.measurementId] = true;     // nothing is collected until a signed-in user has agreed (see onLogin)
        return loadScript(base + "firebase-analytics-compat.js").then(function () {
          fb.analytics = window.firebase.analytics();
          try { fb.analytics.setAnalyticsCollectionEnabled(false); } catch (e) {}
        }).catch(function () {});
      }
    }).then(function () { return true; });
    return Promise.race([load, timeout]).catch(function () { fb.on = false; return false; });
  }
  function fbErr(e) {
    var c = (e && e.code) || "";
    if (c === "auth/email-already-in-use") return "errExists";
    if (c === "auth/weak-password") return "errPass";
    if (c === "auth/invalid-email") return "errEmail";
    if (c === "auth/network-request-failed") return "errNet";
    if (c === "auth/wrong-password") return "errCreds";
    if (c === "auth/user-not-found") return "errNoOnline";
    if (/auth\/(invalid-credential|invalid-login-credentials)/.test(c)) return "errCredsOnline";
    return "errNet";
  }

  /* ---------- local accounts (used when Firebase is not configured) ---------- */
  function b64(buf) { var s = "", u = new Uint8Array(buf); for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function randSalt() { var a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a); return b64(a); }
  function hashPw(pw, salt) {
    try {
      if (window.crypto && crypto.subtle) {
        var saltBytes = Uint8Array.from(atob(salt), function (c) { return c.charCodeAt(0); });
        return crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"])
          .then(function (k) { return crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" }, k, 256); })
          .then(b64);
      }
    } catch (e) {}
    var h = 5381, s = salt + pw; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return Promise.resolve("x" + h);
  }
  function localUsers() { return lsGet("qms.users", {}); }
  /* ---------- "Remember me on this device": stay signed in until sign-out, and sign in again without internet ---------- */
  function rememberPref() { return lsGet("qms.remember", true) !== false; }
  function setRememberPref(v) { lsSet("qms.remember", !!v); }
  function sessGet() {                                            // the saved sign-in of this device (long-lived), or of this tab only
    var k = ""; try { k = window.sessionStorage.getItem("qms.session") || ""; } catch (e) {}
    if (!k) { var v = lsGet("qms.session", ""); k = typeof v === "string" ? v : ""; }
    return k;
  }
  function sessSet(key, remember) {
    if (remember) { lsSet("qms.session", key); try { window.sessionStorage.removeItem("qms.session"); } catch (e) {} }
    else { try { window.sessionStorage.setItem("qms.session", key); } catch (e) { mem["qms.session"] = key; } lsDel("qms.session"); }
  }
  function sessDel() { lsDel("qms.session"); try { window.sessionStorage.removeItem("qms.session"); } catch (e) {} }
  function pickProfile(p) { return { name: p.name || "", email: p.email || "", org: p.org || "", country: p.country || "", usage: p.usage || "", consent: p.consent === true, terms: p.terms || "", uid: p.uid || "" }; }
  /* Online accounts: keep a salted hash of the password and the profile on THIS device (only when "Remember me" is ticked), so the same email and
     password also work without internet. Firebase keeps the real account; this is only an offline key for this device. */
  function rememberDevice(p, pw, remember) {
    setRememberPref(remember);
    if (!p || !p.email) return Promise.resolve();
    var key = p.email.toLowerCase(), users = localUsers();
    if (!remember || !pw) { if (users[key] && users[key].online) { delete users[key]; lsSet("qms.users", users); } if (!remember) sessDel(); return Promise.resolve(); }
    var salt = randSalt();
    return hashPw(pw, salt).then(function (h) { var us = localUsers(); us[key] = { profile: pickProfile(p), salt: salt, hash: h, online: true }; lsSet("qms.users", us); sessSet(key, true); });
  }
  function cacheProfile(p) {                                      // keep the offline copy of the profile current
    if (!p || !p.email) return;
    var us = localUsers(), k = p.email.toLowerCase();
    if (us[k] && us[k].online) { us[k].profile = pickProfile(p); lsSet("qms.users", us); }
  }
  function forgetDevice() {                                       // remove the offline sign-in and the saved session of this device
    var email = user && user.email ? user.email.toLowerCase() : "", us = localUsers();
    if (email && us[email] && us[email].online) { delete us[email]; lsSet("qms.users", us); }
    setRememberPref(false); sessDel();
  }
  function setPersist(remember) {                                 // Firebase: LOCAL = stays signed in after the browser is closed, SESSION = until the tab is closed
    try { var P = window.firebase.auth.Auth.Persistence; return fb.auth.setPersistence(remember ? P.LOCAL : P.SESSION).catch(function () {}); } catch (e) { return Promise.resolve(); }
  }
  function keepStorage() { try { if (navigator.storage && navigator.storage.persist) { var r = navigator.storage.persist(); if (r && r.catch) r.catch(function () {}); } } catch (e) {} }     // ask the browser not to clear this site's data on its own
  function localSignUp(p, pw, remember) {
    var users = localUsers(), key = p.email.toLowerCase();
    if (users[key]) return Promise.reject({ key: "errExists" });
    var salt = randSalt();
    return hashPw(pw, salt).then(function (h) {
      users[key] = { profile: p, salt: salt, hash: h }; lsSet("qms.users", users); sessSet(key, remember !== false); setRememberPref(remember !== false); keepStorage(); return p;
    });
  }
  function localSignIn(email, pw, remember) {
    var u = localUsers()[email.toLowerCase()];
    if (!u) return Promise.reject({ key: "errNoLocal" });          // no such account in THIS browser and website address
    return hashPw(pw, u.salt).then(function (h) {
      if (h !== u.hash) return Promise.reject({ key: "errCreds" });
      sessSet(email.toLowerCase(), remember !== false); setRememberPref(remember !== false); return u.profile;
    });
  }

  /* ---------- sign up / sign in / sign out ---------- */
  /* Email confirmation: Firebase sends the link; the account is used only after the address is confirmed. Needs Firebase (local test mode cannot send email). */
  function needsVerify(u) { return !!(S.requireEmailVerification && fb.on && u && u.emailVerified === false); }
  function doSignUp(p, pw, remember) {
    if (!fb.on) return localSignUp(p, pw, remember);
    return setPersist(remember).then(function () { return fb.auth.createUserWithEmailAndPassword(p.email, pw); }).then(function (cred) {
      p.uid = cred.user.uid;
      var save = fb.db.collection("quizMasters").doc(p.uid).set({
        name: p.name, email: p.email, org: p.org, country: p.country, usage: p.usage, consent: p.consent, terms: p.terms, termsAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(), loginCount: 0
      }).catch(function () {});
      var mail = needsVerify(cred.user) ? cred.user.sendEmailVerification().catch(function () {}) : Promise.resolve();
      return Promise.all([save, mail, rememberDevice(p, pw, remember)]).then(function () { if (needsVerify(cred.user)) p.pendingVerify = true; return p; });
    }, function (e) { return Promise.reject({ key: fbErr(e) }); });
  }
  function doSignIn(email, pw, remember) {
    if (!fb.on) return localSignIn(email, pw, remember);
    return setPersist(remember).then(function () { return fb.auth.signInWithEmailAndPassword(email, pw); }).then(function (cred) {
      if (needsVerify(cred.user)) return { pendingVerify: true, email: cred.user.email || email };
      return fbProfile(cred.user).then(function (p) { return rememberDevice(p, pw, remember).then(function () { return p; }); });
    }, function (e) { return Promise.reject({ key: fbErr(e) }); });
  }
  function showVerify(email) {
    $("authTabs").hidden = true; $("formIn").hidden = true; $("formUp").hidden = true; $("verifyBox").hidden = false;
    $("verifyMsg").textContent = T("verifyMsg", { email: email || "" }); $("verifyStatus").textContent = ""; $("authErr").textContent = ""; authBusy(false); show("auth");
  }
  function hideVerify() { ["verifyBox", "linkBox", "profileBox", "authOffline"].forEach(function (id) { $(id).hidden = true; }); $("authTabs").hidden = false; }
  function showAuthBox(id) { $("authTabs").hidden = true; $("formIn").hidden = true; $("formUp").hidden = true; ["verifyBox", "linkBox", "profileBox", "authOffline"].forEach(function (x) { $(x).hidden = x !== id; }); $("authErr").textContent = ""; authBusy(false); show("auth"); }

  /* ---------- sign in with an email link (Firebase "Email link" provider): no password ---------- */
  function linkErr(e) {
    var c = (e && e.code) || "";
    if (c === "auth/operation-not-allowed") return "errLinkOff";
    if (c === "auth/unauthorized-continue-uri" || c === "auth/invalid-continue-uri" || c === "auth/missing-continue-uri") return "errLinkDomain";
    if (c === "auth/invalid-action-code" || c === "auth/expired-action-code") return "errLinkBad";
    return fbErr(e);
  }
  function sendLink() {
    var email = normName($("inEmail").value), err = $("authErr"), note = $("authNote");
    if (!fb.on) { err.textContent = T("localNote"); return; }
    if (!email) { err.textContent = T("errFill"); return; }
    if (!validEmail(email)) { err.textContent = T("errEmail"); return; }
    err.textContent = ""; authBusy(true); setRememberPref($("inRemember").checked);
    fb.auth.sendSignInLinkToEmail(email, { url: window.location.origin + window.location.pathname, handleCodeInApp: true }).then(function () {
      lsSet("qms.emailForSignIn", email); authBusy(false); note.className = "okmsg"; note.textContent = T("linkSent", { email: email });
    }, function (e) { authBusy(false); err.textContent = T(linkErr(e)); });
  }
  function finishLink(emailGiven) {
    var email = emailGiven || lsGet("qms.emailForSignIn", "");
    if (!email) { showAuthBox("linkBox"); return; }                         // opened on another device: ask for the address
    setPersist(rememberPref()).then(function () { return fb.auth.signInWithEmailLink(email, window.location.href); }).then(function (cred) {
      lsDel("qms.emailForSignIn");
      try { window.history.replaceState(null, "", window.location.pathname); } catch (x) {}   // remove the one-time code from the address bar
      afterLinkSignIn(cred.user);
    }, function (e) { showAuthBox("linkBox"); $("authErr").textContent = T(linkErr(e)); });
  }
  function afterLinkSignIn(u) {
    var openProfileForm = function () { $("pfName").value = u.displayName || (u.email || "").split("@")[0]; showAuthBox("profileBox"); };
    fb.db.collection("quizMasters").doc(u.uid).get().then(function (d) {
      if (d && d.exists) fbProfile(u).then(function (p) { hideVerify(); onLogin(p, false); }); else openProfileForm();
    }).catch(openProfileForm);
  }
  function saveProfileForm() {
    var u = fb.auth.currentUser, p = { name: normName($("pfName").value), org: normName($("pfOrg").value), country: normName($("pfCountry").value), usage: $("pfUsage").value, consent: $("pfAnalytics").checked, terms: S.termsVersion };
    if (!u) { $("authErr").textContent = T("verifyFail"); return; }
    if (!p.name || !p.org || !p.country || !p.usage) { $("authErr").textContent = T("errFill"); return; }
    if (S.requireTerms && !$("pfTerms").checked) { $("authErr").textContent = T("errTerms"); return; }
    $("authErr").textContent = "";
    var F = window.firebase.firestore.FieldValue;
    fb.db.collection("quizMasters").doc(u.uid).set({ name: p.name, email: u.email, org: p.org, country: p.country, usage: p.usage, consent: p.consent, terms: p.terms, termsAt: F.serverTimestamp(), createdAt: F.serverTimestamp(), loginCount: 0 })
      .then(function () { try { u.updateProfile({ displayName: p.name }); } catch (x) {} return fbProfile(u); })
      .then(function (prof) { hideVerify(); onLogin(prof, true); }, function () { $("authErr").textContent = T("errNet"); });
  }
  function verifyCheck() {
    var u = fb.on && fb.auth && fb.auth.currentUser, st = $("verifyStatus");
    if (!u) { st.className = "err"; st.textContent = T("verifyFail"); return; }
    st.className = "note"; st.textContent = "...";
    u.reload().then(function () { return u.getIdToken(true); }).then(function () {          // refresh the sign-in token so the database rules see the confirmed address
      if (!u.emailVerified) { st.className = "err"; st.textContent = T("verifyNot"); return; }
      return fbProfile(u).then(function (p) { hideVerify(); onLogin(p, false); });
    }).catch(function () { st.className = "err"; st.textContent = T("verifyFail"); });
  }
  function verifyResend() {
    var u = fb.on && fb.auth && fb.auth.currentUser, st = $("verifyStatus");
    if (!u) { st.className = "err"; st.textContent = T("verifyFail"); return; }
    u.sendEmailVerification().then(function () { st.className = "okmsg"; st.textContent = T("verifySent"); },
      function (e) { st.className = "err"; st.textContent = (e && e.code === "auth/too-many-requests") ? T("verifyWait") : T("errNet"); });
  }
  function fbProfile(u) {
    var base = { email: u.email || "", name: u.displayName || (u.email || "").split("@")[0], org: "", country: "", usage: "", consent: false, terms: "", uid: u.uid };
    var cached = (function () { var e = localUsers()[String(u.email || "").toLowerCase()]; return e && e.online ? e.profile : null; })();
    var fallback = function () { if (cached) { var c = pickProfile(cached); c.uid = u.uid; return c; } return base; };           // offline: use the copy saved on this device
    var load = fb.db.collection("quizMasters").doc(u.uid).get().then(function (d) {
      if (d && d.exists) { var x = d.data(); base.name = x.name || base.name; base.org = x.org || ""; base.country = x.country || ""; base.usage = x.usage || ""; base.consent = x.consent === true; base.terms = x.terms || ""; return base; }
      return fallback();
    });
    var wait = new Promise(function (res) { setTimeout(function () { res(null); }, 6000); });
    return Promise.race([load, wait]).then(function (p) { return p || fallback(); }).catch(fallback);
  }
  function skipProfile() { return { email: "test@skip.local", name: "Test user", org: "Test", country: "", usage: "", consent: false, terms: S.termsVersion, skipped: true }; }
  /* Saves the login in Firestore: profile (login count, last login) and one record per login in quizMasters/{uid}/logins.
     Passwords are never stored here: Firebase Authentication keeps them (hashed) on its own. */
  var USER_FIELDS = ["name", "email", "org", "country", "usage", "consent", "terms", "termsAt", "createdAt", "lastLoginAt", "loginCount"];
  function fbRecordLogin(p) {
    if (!(fb.on && p.uid)) return Promise.resolve();
    var F = window.firebase.firestore.FieldValue, ref = fb.db.collection("quizMasters").doc(p.uid);
    return ref.get().then(function (d) {
      if (d.exists) return ref.update({ lastLoginAt: F.serverTimestamp(), loginCount: F.increment(1) });
      return ref.set({ name: p.name || "", email: p.email, org: p.org || "", country: p.country || "", usage: p.usage || "", consent: p.consent === true, terms: p.terms || S.termsVersion, termsAt: F.serverTimestamp(), createdAt: F.serverTimestamp(), lastLoginAt: F.serverTimestamp(), loginCount: 1 });
    }).then(function () {
      return ref.collection("logins").add({ at: F.serverTimestamp(), method: "password", uiLang: ui, agent: String(navigator.userAgent || "").slice(0, 200) });
    }).catch(function () {});
  }
  /* A new or changed version of the Terms must be accepted before the account is used (sign-up already did it) */
  function onLogin(p, isNew) {
    if (S.requireTerms && S.reacceptTerms && S.requireLogin && !p.skipped && p.terms !== S.termsVersion) {
      openTerms({ mode: "required", onAccept: function () { acceptTermsFor(p).then(function () { p.terms = S.termsVersion; finishLogin(p, isNew); }); }, onDecline: function () { signOut(); } });
      return;
    }
    finishLogin(p, isNew);
  }
  function finishLogin(p, isNew) {
    user = p; noteStartDate(p); cacheProfile(p); loadBank(); loadKb(); libLoad(); loadSetups(); fbRecordLogin(p); checkAdmin(); paintOwn();
    if (S.firebase.measurementId) window["ga-disable-" + S.firebase.measurementId] = (p.consent !== true);
    if (fb.analytics) { try { fb.analytics.setAnalyticsCollectionEnabled(p.consent === true); if (p.uid) fb.analytics.setUserId(p.uid); } catch (e) {} }
    track(isNew ? "sign_up" : "login", { method: fb.on ? "firebase" : "local" });
    $("uname").textContent = p.name || p.email; $("uchip").title = (p.org || "");
    $("authErr").textContent = ""; $("inPass").value = ""; $("upPass").value = "";
    if (pendingRoute && ROUTE_TABLE[pendingRoute]) { var r0 = pendingRoute; pendingRoute = ""; applyRoute(r0); } else goHomePage(); askAnalyticsChoice();                   // a page address opened before sign-in is shown after it
    fbLoadBank();
  }
  function signOut() {
    var done = function () {
      if (S.firebase.measurementId) window["ga-disable-" + S.firebase.measurementId] = true;
      if (fb.analytics) { try { fb.analytics.setAnalyticsCollectionEnabled(false); } catch (e) {} }
      user = null; bank = []; kbMeta = []; setups = []; isAdmin = false; $("goAdmin").hidden = true; ownApp = null; if ($("savedList")) renderSaved(); sessDel(); $("uname").textContent = ""; resetUrl(); $("inEmail").value = ""; $("inPass").value = "";
      ["upName", "upEmail", "upOrg", "upCountry", "upPass"].forEach(function (id) { $(id).value = ""; });
      $("upUsage").value = ""; resetTermsBox("upTerms"); resetTermsBox("pfTerms"); $("tbRight").hidden = true; hideVerify(); setAuthTab("in"); authBusy(false); show("auth");
    };
    if (fb.on && fb.auth) fb.auth.signOut().then(done, done); else done();
  }
  function setAuthTab(which) {
    var up = which === "up";
    $("formIn").hidden = up; $("formUp").hidden = !up;
    $("tabIn").setAttribute("aria-selected", up ? "false" : "true"); $("tabUp").setAttribute("aria-selected", up ? "true" : "false");
    $("authErr").textContent = "";
  }
  function authBusy(b) { ["btnIn", "btnUp", "btnLink"].forEach(function (id) { $(id).disabled = b; }); }
  function authFail(e) { authBusy(false); $("authErr").textContent = T((e && e.key) || "errNet"); }
  function wireAuth() {
    $("tabIn").addEventListener("click", function () { setAuthTab("in"); });
    $("tabUp").addEventListener("click", function () { setAuthTab("up"); });
    $("authLang").addEventListener("change", function () { setUi($("authLang").value); });
    $("btnIn").addEventListener("click", function (ev) {
      ev.preventDefault();
      var email = normName($("inEmail").value), pw = $("inPass").value;
      if (!email || !pw) { $("authErr").textContent = T("errFill"); return; }
      if (!validEmail(email)) { $("authErr").textContent = T("errEmail"); return; }
      $("authErr").textContent = ""; authBusy(true);
      doSignIn(email, pw, $("inRemember").checked).then(function (p) { authBusy(false); if (p && p.pendingVerify) showVerify(p.email); else onLogin(p, false); }, authFail);
    });
    $("btnUp").addEventListener("click", function (ev) {
      ev.preventDefault();
      var p = { name: normName($("upName").value), email: normName($("upEmail").value), org: normName($("upOrg").value), country: normName($("upCountry").value), usage: $("upUsage").value, consent: $("upAnalytics").checked, terms: S.termsVersion };
      lsSet("qms.analyticsAsked." + String(p.email).toLowerCase(), true);                // the sign-up box is the answer
      var pw = $("upPass").value;
      if (!p.name || !p.email || !p.org || !p.country || !p.usage || !pw) { $("authErr").textContent = T("errFill"); return; }
      if (!validEmail(p.email)) { $("authErr").textContent = T("errEmail"); return; }
      if (S.requireTerms && !$("upTerms").checked) { $("authErr").textContent = T("errTerms"); return; }
      if (pw.length < 6) { $("authErr").textContent = T("errPass"); return; }
      $("authErr").textContent = ""; authBusy(true);
      doSignUp(p, pw, $("upRemember").checked).then(function (prof) { authBusy(false); if (prof && prof.pendingVerify) showVerify(prof.email); else onLogin(prof, true); }, authFail);
    });
    // no <form> elements: the claude.ai page sandbox blocks form submission, so Enter is handled here
    [["formIn", "btnIn"], ["formUp", "btnUp"]].forEach(function (p) {
      $(p[0]).addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); $(p[1]).click(); } });
    });
    $("skipLogin").hidden = !S.skipLoginButton;
    $("skipLogin").addEventListener("click", function () { lsSet("qms.session", "skip"); onLogin(skipProfile(), false); });
    $("forgotBtn").addEventListener("click", function () {
      var email = normName($("inEmail").value);
      if (!email) { $("authErr").textContent = T("forgotHint"); return; }
      if (!validEmail(email)) { $("authErr").textContent = T("errEmail"); return; }
      if (!fb.on) { $("authErr").textContent = T("localNote"); return; }
      fb.auth.sendPasswordResetEmail(email).then(function () { $("authErr").textContent = ""; $("authNote").className = "okmsg"; $("authNote").textContent = T("resetSent"); }, function (e) { $("authErr").textContent = T(fbErr(e)); });
    });
    $("btnLink").addEventListener("click", sendLink);
    $("linkDone").addEventListener("click", function () { var em = normName($("linkEmail").value); if (!validEmail(em)) { $("authErr").textContent = T("errEmail"); return; } finishLink(em); });
    $("pfSave").addEventListener("click", saveProfileForm);
    $("signOutBtn").addEventListener("click", signOut);
    $("verifyDone").addEventListener("click", verifyCheck); $("verifyResend").addEventListener("click", verifyResend); $("verifyOut").addEventListener("click", signOut);
  }
