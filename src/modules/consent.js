/* @module {"name":"consent","exports":["askAnalyticsChoice","analyticsAnswered","wireConsent"],"uses":["$","S","lsGet","lsSet","setAnalytics","user"]} */
  /* ANALYTICS CHOICE. Usage analytics are OFF until the person says yes (sign-up box, this pop-up, or Settings): the agreement is not part of the Terms.
     An account that agreed under the older Terms is switched off and asked once, so only a fresh yes counts. */
  function key() { return "qms.analyticsAsked." + String((user && user.email) || "").toLowerCase(); }
  function analyticsAnswered() { if (user && user.email) lsSet(key(), true); }
  function askAnalyticsChoice() {
    if (!user || user.skipped || !user.email || !S.firebase.measurementId) return;          // nothing to ask when analytics is not connected
    if (lsGet(key(), false)) return;
    if (user.consent === true) setAnalytics(false);                                        // an old, bundled agreement does not count
    $("anModal").hidden = false;
  }
  function choose(on) { setAnalytics(on); analyticsAnswered(); $("anModal").hidden = true; }
  function wireConsent() { $("anAllow").addEventListener("click", function () { choose(true); }); $("anDeny").addEventListener("click", function () { choose(false); }); }
