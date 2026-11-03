/* @module {"name":"mydata","exports":["wireMyData","paintMyData"],"uses":["$","S","T","fb","history","idbDo","libDoc","libId","libList","localUsers","lsDel","lsGet","lsSet","saveFile","setupList","todayISO","track","user"]} */
  /* YOUR DATA (Settings). The rights of access and erasure as buttons: download everything the app holds for this account (on this device and, when signed in online,
     in the cloud), or delete the account together with the data stored for it. The names and points of participants are not stored with the account at all. */
  function paintMyData() { $("mdMsg").textContent = ""; $("mdMsg").className = "note"; $("mdConfirm").value = ""; $("mdDelete").disabled = true; }
  function say(key, cls, vars) { var m = $("mdMsg"); m.className = cls || "note"; m.textContent = T(key, vars); }
  function cloudDocs(col, uid) { return fb.db.collection(col).where("uid", "==", uid).limit(500).get().then(function (s) { return s.docs || []; }); }
  function collect() {
    var out = { exportedAt: new Date().toISOString(), appVersion: S.appVersion, account: { name: user.name, email: user.email, organisation: user.org, country: user.country, use: user.usage, analyticsConsent: user.consent === true, termsAccepted: user.terms || "" },
      onThisDevice: { settings: lsGet("qms.settings", {}), stats: lsGet("qms.stats", {}), finishedQuizzes: history(), savedQuizzes: setupList(), questionBanks: libList().map(function (m) { return libDoc(m.bid); }) }, inTheCloud: null };
    if (!(fb.on && user && user.uid)) return Promise.resolve(out);
    var uid = user.uid, cloud = {}, root = fb.db.collection("quizMasters").doc(uid);
    function plain(d) { var o = d.data(); Object.keys(o).forEach(function (k) { var v = o[k]; if (v && v.toDate) o[k] = v.toDate().toISOString(); }); return o; }
    return Promise.all([root.get(), root.collection("logins").get(), fb.db.collection("analyticsShares").doc(uid).get(), fb.db.collection("sharedBanks").where("owner", "==", uid).get(), cloudDocs("usage", uid)]).then(function (r) {
      cloud.profile = r[0].exists ? plain(r[0]) : null; cloud.signIns = (r[1].docs || []).map(plain); cloud.sharedAnalytics = r[2].exists ? plain(r[2]) : null;
      cloud.sharedQuestionBanks = (r[3].docs || []).map(function (d) { var o = plain(d); return { id: d.id, name: o.name, language: o.langLabel, questions: o.count, shared: o.updatedAt }; }); cloud.quizSetupRecords = r[4].map(plain);
      out.inTheCloud = cloud; return out;
    });
  }
  function download() {
    say("mdPreparing"); collect().then(function (data) { return saveFile("obq-my-data-" + todayISO() + ".json", new TextEncoder().encode(JSON.stringify(data, null, 1)), "application/json"); })
      .then(function (saved) { say(saved ? "mdDownloaded" : "mdPreparing", saved ? "okmsg" : "note"); if (!saved) $("mdMsg").textContent = ""; }).catch(function () { say("mdFail", "err"); });
  }
  function delAll(col) { return col.get().then(function (s) { return Promise.all((s.docs || []).map(function (d) { return d.ref ? d.ref.delete() : col.doc(d.id).delete(); })); }); }
  function wipeLocal() {                                             // everything on this device that belongs to this account
    var e = String(user.email || "").toLowerCase(), uid = user.uid || "", keys = [];
    try { for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i)); } catch (x) {}
    keys.forEach(function (k) { if (k && k.indexOf("qms.") === 0 && ((e && k.toLowerCase().indexOf(e) > -1) || (uid && k.indexOf(uid) > -1))) lsDel(k); });
    var us = localUsers(); if (us[e]) { delete us[e]; lsSet("qms.users", us); }
    return Promise.all(libList().map(function (m) { return idbDo("banks", "readwrite", function (s) { return s.delete(libId(m.bid)); }); })).catch(function () {});
  }
  function deleteAccount() {
    if ($("mdConfirm").value.trim().toUpperCase() !== "DELETE") { say("mdConfirmNeed", "err"); return; }
    say("mdDeleting"); $("mdDelete").disabled = true;
    var step = Promise.resolve();
    if (fb.on && user && user.uid) {
      var uid = user.uid, root = fb.db.collection("quizMasters").doc(uid);
      step = fb.db.collection("sharedBanks").where("owner", "==", uid).get().then(function (s) {
        return Promise.all((s.docs || []).map(function (d) { var n = (d.data().chunks || 0), dels = []; for (var k = 0; k < n; k++) dels.push(d.ref ? d.ref.collection("chunks").doc("c" + k).delete() : fb.db.collection("sharedBanks").doc(d.id).collection("chunks").doc("c" + k).delete()); return Promise.all(dels).then(function () { return fb.db.collection("sharedBanks").doc(d.id).delete(); }); }));
      }).then(function () { return cloudDocs("usage", uid); }).then(function (docs) { return Promise.all(docs.map(function (d) { return fb.db.collection("usage").doc(d.id).delete(); })); })
        .then(function () { return fb.db.collection("analyticsShares").doc(uid).delete().catch(function () {}); })
        .then(function () { return Promise.all([delAll(root.collection("logins")), delAll(root.collection("banks")), delAll(root.collection("setups"))]); })
        .then(function () { return root.delete(); })
        .then(function () { var u = fb.auth.currentUser; return u && u.delete ? u.delete() : null; });
    }
    step.then(function () { return wipeLocal(); }).then(function () { track("account_deleted", {}); $("signOutBtn").click(); })
      .catch(function (e) { $("mdDelete").disabled = false; say(e && e.code === "auth/requires-recent-login" ? "mdRecent" : "mdFail", "err"); });
  }
  function wireMyData() {
    $("mdDownload").addEventListener("click", download); $("mdDelete").addEventListener("click", deleteAccount);
    $("mdConfirm").addEventListener("input", function () { $("mdDelete").disabled = $("mdConfirm").value.trim().toUpperCase() !== "DELETE"; });
  }
