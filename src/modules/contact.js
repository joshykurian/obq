/* @module {"name":"contact","exports":["openAbout","wireAbout","paintAbout"],"uses":["$","QUIZ_I18N","S","T","clear","el","fb","goHomePage","loadScript","lsDel","lsGet","lsSet","openQmGuide","openTerms","routeUrl","setUrl","show","track","ui","user"]} */
  /* ABOUT and CONTACT. A code or a limit checked only inside the page can be bypassed, so the checks are made by a server or by the database rules.
     provider "firebase" (works on the free Spark plan, no server): 1. "Email me a confirmation link": Firebase emails a one-time sign-in link to the address of the signed-in
     ACCOUNT (never to an address typed here); opening it signs the person in again and brings them back here. 2. "Send message": the database rules accept the message only
     if the sign-in is less than 10 minutes old, the email is the account's, and fewer than 3 messages were sent today (the document id is user + day + 1..3).
     The messages are read in Admin. provider "functions" (optional, needs the Blaze plan): a six-digit code and the same limits, checked by functions/, and the team is emailed. */
  var CT_TOPICS = ["info", "support", "problem", "idea", "feature", "other"], ctOpenedAt = 0, ctFnsLoad = null;
  function ctMode() { var c = S.contact || {}; return c.provider === "functions" || c.provider === "firebase" ? c.provider : ""; }
  function ctConfigured() { return !!ctMode() && fb.on && !!(user && user.uid); }
  function ctMask(e) { var p = String(e || "").split("@"); return p[0].slice(0, 1) + "***@" + (p[1] || ""); }
  function ctDraftKey() { return "qms.contactDraft." + (user && user.uid); }
  function ctLinkKey() { return "qms.contactLink." + (user && user.uid); }
  function ctDay() { return new Date().toISOString().slice(0, 10).replace(/-/g, ""); }
  function ctFns() {                                                 // the Functions library is loaded when the form is first used
    if (!ctFnsLoad) ctFnsLoad = loadScript("https://www.gstatic.com/firebasejs/" + S.firebaseSdkVersion + "/firebase-functions-compat.js").then(function () { return window.firebase.app().functions((S.contact && S.contact.region) || "us-central1"); }).catch(function (e) { ctFnsLoad = null; throw e; });
    return ctFnsLoad;
  }
  function ctCall(name, data) { return ctFns().then(function (f) { return f.httpsCallable(name)(data); }).then(function (r) { return r.data; }); }
  function openAbout(focusId) {
    paintAbout(); show("about"); var id = typeof focusId === "string" ? focusId : ""; setUrl(id === "panelContact" ? "about/contact" : "about");
    if (id) setTimeout(function () { var p = $(id); if (p) p.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  }
  function paintAbout() {
    $("abVersion").textContent = T("abVersion", { v: S.appVersion || "" }); $("abOperator").hidden = !S.operatorName; $("abOperator").textContent = S.operatorName ? T("abOperator", { name: S.operatorName }) : "";
    var sel = $("ctTopic"), keep = sel.value; clear(sel); CT_TOPICS.forEach(function (k) { var o = el("option", null, T("ctT_" + k)); o.value = k; sel.appendChild(o); }); if (keep) sel.value = keep;
    if (!$("ctName").value) $("ctName").value = (user && user.name) || ""; $("ctEmail").value = (user && user.email) || "";
    var ok = ctConfigured(), cfgd = !!ctMode(), link = ctMode() === "firebase"; $("ctOff").hidden = ok; $("ctOff").textContent = T(cfgd ? "ctNeedOnline" : "ctNotReady");
    $("ctCodeBtn").setAttribute("data-i18n", link ? "ctLinkBtn" : "ctCodeBtn"); $("ctCodeBtn").textContent = T(link ? "ctLinkBtn" : "ctCodeBtn"); $("ctSendNoteP").setAttribute("data-i18n", link ? "ctSendNote2" : "ctSendNote"); $("ctSendNoteP").textContent = T(link ? "ctSendNote2" : "ctSendNote");
    $("ctCode").parentNode.hidden = link; $("ctResend").hidden = link;
    $("ctCodeBtn").disabled = !ok; $("ctCodeBtn").hidden = false; $("ctCodeBox").hidden = true; $("ctCode").value = ""; $("ctMsg").textContent = ""; $("ctMsg").className = "note"; ctOpenedAt = Date.now(); ctCount();
    if (ok && link) ctRestore();
  }
  function ctRestore() {                                             // back from the confirmation link? (the sign-in is newer than the link we sent and less than 9 minutes old)
    var d = lsGet(ctDraftKey(), null), sent = lsGet(ctLinkKey(), 0), u = fb.auth.currentUser; if (!d || !u || !u.getIdTokenResult) return;
    if (!$("ctText").value) { $("ctName").value = d.name || $("ctName").value; $("ctText").value = d.text || ""; if (d.topic) $("ctTopic").value = d.topic; ctCount(); }
    u.getIdTokenResult().then(function (r) {
      var at = Number((r.claims || {}).auth_time || 0) * 1000, fresh = at > sent && Date.now() - at < 9 * 60000;
      if (!fresh) return; $("ctCodeBox").hidden = false; $("ctCodeBtn").hidden = true; $("ctCodeNote").textContent = T("ctConfirmed");
    }).catch(function () {});
  }
  function ctCount() { $("ctCount").textContent = T("ctCount", { n: $("ctText").value.length }); }
  function ctShow(key, cls) { var m = $("ctMsg"); m.className = cls || "err"; m.textContent = T(key); }
  function ctReason(e) {                                             // the short word the server sends -> a sentence
    var r = String((e && e.message) || "").toLowerCase().replace(/^.*?:\s*/, "").replace(/[^a-z]+/g, "_"), key = "ctR_" + r;
    return QUIZ_I18N.en[key] ? key : "ctR_fail";
  }
  function ctInput() {                                               // checks before anything is sent; returns what the server needs, or null
    var name = $("ctName").value.trim(), text = $("ctText").value.trim();
    if (name.length < 2) { ctShow("ctErrName"); return null; }
    if (text.length < 10 || text.length > 2000) { ctShow("ctErrText"); return null; }
    if ((text.match(/https?:\/\/|www\./gi) || []).length > 2) { ctShow("ctR_too_many_links"); return null; }
    if ($("ctWebsite").value) { ctShow("ctR_fail"); return null; }                                       // the hidden field was filled: a robot
    if (navigator.onLine === false) { ctShow("ctOffline"); return null; }
    return { name: name, topic: $("ctTopic").value || "info", message: text, meta: { org: (user && user.org) || "", country: (user && user.country) || "", appVersion: S.appVersion || "", uiLang: ui, browser: String(navigator.userAgent || "").slice(0, 160) } };
  }
  function ctGetLink() {
    var data = ctInput(); if (!ctConfigured() || !data) return; $("ctCodeBtn").disabled = true; $("ctMsg").textContent = "";
    lsSet(ctDraftKey(), { name: data.name, topic: data.topic, text: data.message }); lsSet(ctLinkKey(), Date.now()); lsSet("qms.emailForSignIn", user.email);
    fb.auth.sendSignInLinkToEmail(user.email, { url: window.location.origin + routeUrl("about/contact"), handleCodeInApp: true }).then(function () {
      ctShow("ctLinkSent", "okmsg"); $("ctMsg").textContent = T("ctLinkSent", { to: ctMask(user.email) });
    }).catch(function (e) { ctShow(e && e.code === "auth/unauthorized-continue-uri" ? "errLinkDomain" : (e && e.code === "auth/operation-not-allowed" ? "errLinkOff" : "ctR_fail")); }).then(function () { $("ctCodeBtn").disabled = !ctConfigured(); });
  }
  function ctPost(data) {                                            // the message goes into the database; the rules check the 10 minutes, the email and the 3 a day
    var base = { uid: user.uid, name: data.name, email: user.email, org: data.meta.org, country: data.meta.country, topic: data.topic, message: data.message, uiLang: data.meta.uiLang, appVersion: data.meta.appVersion, browser: data.meta.browser, createdAt: window.firebase.firestore.FieldValue.serverTimestamp() };
    function attempt(n) { if (n > 3) return Promise.reject(new Error("limit")); return fb.db.collection("contactMessages").doc(user.uid + "_" + ctDay() + "_" + n).set(base).catch(function (e) { if (e && e.code === "permission-denied") return attempt(n + 1); throw e; }); }
    return attempt(1);
  }
  function ctGetCode() {
    if (!ctConfigured() || !ctInput()) return; $("ctCodeBtn").disabled = true; $("ctResend").disabled = true; $("ctMsg").textContent = "";
    ctCall("requestContactCode", {}).then(function (r) {
      $("ctCodeBox").hidden = false; $("ctCode").value = ""; $("ctCodeNote").textContent = T("ctCodeSent", { to: r.to || "" }); $("ctCode").focus(); $("ctCodeBtn").hidden = true;
    }).catch(function (e) { ctShow(ctReason(e)); }).then(function () { $("ctCodeBtn").disabled = !ctConfigured(); $("ctResend").disabled = false; });
  }
  function ctSend() {
    var data = ctInput(), code = $("ctCode").value.trim(); if (!data) return;
    if (ctMode() === "firebase") {
      $("ctSend").disabled = true; ctShow("ctSending", "note");
      ctPost(data).then(function () { lsDel(ctDraftKey()); lsDel(ctLinkKey()); $("ctText").value = ""; $("ctCodeBox").hidden = true; $("ctCodeBtn").hidden = false; ctCount(); ctShow("ctDone", "okmsg"); track("contact_sent", { topic: data.topic }); })
        .catch(function (e) { ctShow(e && e.message === "limit" ? "ctR_not_sent" : "ctR_fail"); }).then(function () { $("ctSend").disabled = false; });
      return;
    }
    if (!/^[0-9]{6}$/.test(code)) { ctShow("ctR_wrong_code"); return; }
    data.code = code; $("ctSend").disabled = true; ctShow("ctSending", "note");
    ctCall("sendContactMessage", data).then(function () {
      $("ctText").value = ""; $("ctCode").value = ""; $("ctCodeBox").hidden = true; $("ctCodeBtn").hidden = false; ctCount(); ctShow("ctDone", "okmsg"); track("contact_sent", { topic: data.topic });
    }).catch(function (e) { var k = ctReason(e); ctShow(k); if (k === "ctR_code_expired" || k === "ctR_too_many_attempts") { $("ctCodeBox").hidden = true; $("ctCodeBtn").hidden = false; } }).then(function () { $("ctSend").disabled = false; });
  }
  function wireAbout() {
    $("abHome").addEventListener("click", goHomePage); $("abTerms").addEventListener("click", function () { openTerms({ mode: "view" }); }); $("abHelp").addEventListener("click", openQmGuide);
    $("ctCodeBtn").addEventListener("click", function () { if (ctMode() === "firebase") ctGetLink(); else ctGetCode(); }); $("ctResend").addEventListener("click", function () { $("ctCodeBtn").hidden = false; ctGetCode(); }); $("ctSend").addEventListener("click", ctSend); $("ctText").addEventListener("input", ctCount);
  }
