
  /* =====================================================================
     TOP NAVIGATION (icons) and PAGE ADDRESSES (deep links)
     /instructions  /settings  /profile  /my-quizzes  /results  /setup  /quick-quiz  /admin
     /builder  /builder/questionbank  /builder/knowledge-base  /builder/results  /builder/firebase  /builder/activity  /builder/remote
     ===================================================================== */
  var BASE_PATH = window.__OBQ_BASE || (location.pathname.replace(/[^\/]*$/, "") || "/");
  var routingOK = S.edition !== "basic" && !!window.__OBQ_BASE && /^https?:$/.test(location.protocol) && !!(window.history && window.history.pushState);
  var routing = false, pendingRoute = "";
  var PANEL_ROUTE = { panelSetup: "builder", panelBank: "builder/questionbank", panelKb: "builder/knowledge-base", panelHist: "results", panelOwn: "results/firebase", panelActivity: "analytics", panelRemote: "settings/remote" };
  var ROUTE_ALIAS = { "builder/results": "results", "builder/firebase": "results/firebase", "builder/activity": "analytics", "builder/remote": "settings/remote" };   // older addresses
  var ROUTE_TABLE = {
    "": function () { goHomePage(); },
    "instructions": function () { openQmGuide(); },
    "settings": function () { openSettings(); },
    "settings/remote": function () { openSettings("panelRemote"); },
    "profile": function () { openSettings("setProfile"); },
    "my-quizzes": function () { openMyQuizzes(); },
    "results": function () { openResults(); },
    "results/firebase": function () { openResults("panelOwn"); },
    "analytics": function () { openAnalytics(); },
    "setup": function () { goSetup(); },
    "quick-quiz": function () { openLite(); },
    "admin": function () { if (isAdmin) openAdmin(); else goHomePage(); },
    "builder": function () { openBuilder(""); },
    "builder/questionbank": function () { openBuilder("panelBank"); },
    "builder/knowledge-base": function () { openBuilder("panelKb"); },
    "about": function () { openAbout(); },
    "about/contact": function () { openAbout("panelContact"); },
    "firebase-help": function () { openOwnGuide("results"); }
  };
  Object.keys(ROUTE_ALIAS).forEach(function (old) { ROUTE_TABLE[old] = ROUTE_TABLE[ROUTE_ALIAS[old]]; });
  var NAV_OF_ROUTE = { "": "goHome", "instructions": "goHelp", "my-quizzes": "goQuizzes", "results": "goResults", "results/firebase": "goResults", "firebase-help": "goResults", "settings": "goSettings", "settings/remote": "goSettings", "profile": "goProfile", "admin": "goAdmin", "setup": "goQuizzes" };
  function currentRoute() {
    var p = location.pathname; if (p.indexOf(BASE_PATH) === 0) p = p.slice(BASE_PATH.length);
    return p.replace(/index\.html$/, "").replace(/^\/+|\/+$/g, "");
  }
  function routeUrl(route) { return BASE_PATH + route; }
  function markNav(route) {
    var id = NAV_OF_ROUTE[route] || (route.indexOf("builder") === 0 ? "goDash" : "");
    Array.prototype.forEach.call(document.querySelectorAll("#tbRight .navlink"), function (a) { if (a.id === id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    markSidebar(route);
  }
  function setUrl(route) {                                        // called by the page-opening functions; adds the page's address to the browser history
    if (routing) { markNav(route); return; }
    if (routingOK) { try { if (currentRoute() !== route) window.history.pushState({ obq: 1 }, "", routeUrl(route) || BASE_PATH); } catch (e) { routingOK = false; } }
    markNav(route);
  }
  function applyRoute(route) {
    if (ROUTE_ALIAS[route]) { route = ROUTE_ALIAS[route]; if (routingOK) { try { window.history.replaceState({ obq: 1 }, "", routeUrl(route)); } catch (e) {} } }      // an older address becomes its new address
    var f = ROUTE_TABLE[route], known = !!f; routing = true;
    try { (f || ROUTE_TABLE[""])(); } finally { routing = false; }
    markNav(known ? route : "");
  }
  function resetUrl() { if (routingOK) { try { window.history.replaceState(null, "", BASE_PATH); } catch (e) {} } }

  /* the top bar: an icon in front of every item, real links (so "open in a new tab" works), a user name and My Profile */
  var NAV_ROUTE_OF_ID = { goHome: "", goHelp: "instructions", goQuizzes: "my-quizzes", goResults: "results", goDash: "builder", goAdmin: "admin", goSettings: "settings", goProfile: "profile" };
  function wireNav() {
    Array.prototype.forEach.call(document.querySelectorAll("#tbRight [data-icon]"), function (n) { n.insertAdjacentHTML("afterbegin", icon(n.getAttribute("data-icon"), 16)); });
    Object.keys(NAV_ROUTE_OF_ID).forEach(function (id) { var a = $(id); a.setAttribute("href", routeUrl(NAV_ROUTE_OF_ID[id]) || BASE_PATH); });
    $("tbRight").addEventListener("click", function (e) {         // a plain click is handled by the app; ctrl/cmd/shift/middle click opens the page's address in a new tab
      var a = e.target.closest && e.target.closest("a.navlink");
      if (a && !(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button === 1)) e.preventDefault();
    });
    $("goQuizzes").addEventListener("click", function () { openMyQuizzes(); });
    $("goResults").addEventListener("click", function () { openResults(); });
    $("brandLink").setAttribute("href", BASE_PATH);                          // the logo and name lead back to Home
    $("brandLink").addEventListener("click", function (e) { if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return; e.preventDefault(); if (user) goHomePage(); });
    wireNavTips(); wireSidebar();
    $("goProfile").addEventListener("click", function () { openSettings("setProfile"); });
    window.addEventListener("popstate", function () {
      if (!routingOK) return;
      var sc = document.body.getAttribute("data-screen");
      if (sc === "game" || sc === "end") { try { window.history.pushState({ obq: 1 }, "", location.href); } catch (e) {} return; }          // the Back button must not leave a quiz
      if (!user) { pendingRoute = currentRoute(); return; }
      applyRoute(currentRoute());
    });
  }
  /* ---------- left sidebar: boxes with icons for quick navigation on the inner pages (not on Home, not in a quiz) ---------- */
  var SB_SCREENS = { lite: 1, setup: 1, dashboard: 1, resultsPage: 1, analytics: 1, settings: 1, qmguide: 1, ownguide: 1, about: 1, admin: 1 };
  var SB_GROUPS = [
    { title: "", items: [{ id: "home", icon: "house", t: "home", route: "", lite: true, go: function () { goHomePage(); } }] },
    { title: "hGroupRun", items: [
      { id: "lite", icon: "bolt", t: "hLite", route: "quick-quiz", lite: true, go: function () { openLite(); } },
      { id: "demo", icon: "trophy", t: "hDemo", route: "", lite: true, go: function () { runDemo(); } },
      { id: "setup", icon: "sliders", t: "hSetup", route: "setup", go: function () { goSetup(); } },
      { id: "saved", icon: "star", t: "navQuizzes", route: "my-quizzes", go: function () { openMyQuizzes(); } }] },
    { title: "hBuilder", items: [
      { id: "builder", icon: "tools", t: "hBuilder", route: "builder", go: function () { openBuilder(""); } },
      { id: "bank", icon: "book", t: "hBank", route: "builder/questionbank", go: function () { openBuilder("panelBank"); } },
      { id: "kb", icon: "text", t: "hKb", route: "builder/knowledge-base", go: function () { openBuilder("panelKb"); } }] },
    { title: "hGroupResults", items: [
      { id: "results", icon: "chart", t: "hResults", route: "results", go: function () { openResults(); } },
      { id: "firebase", icon: "cloud", t: "hOwn", route: "results/firebase", go: function () { openResults("panelOwn"); } }] },
    { title: "hGroupMore", items: [
      { id: "analytics", icon: "pulse", t: "hAnalytics", route: "analytics", go: function () { openAnalytics(); } },
      { id: "settings", icon: "gear", t: "hSettings", route: "settings", lite: true, go: function () { openSettings(); } },
      { id: "help", icon: "help", t: "hHelp", route: "instructions", lite: true, go: function () { openQmGuide(); } },
      { id: "about", icon: "info", t: "hAbout", route: "about", lite: true, go: function () { openAbout(); } },
      { id: "admin", icon: "shield", t: "hAdmin", route: "admin", adminOnly: true, go: function () { openAdmin(); } }] }
  ];
  var SB_OF_ROUTE = { "": "home", "quick-quiz": "lite", "setup": "setup", "my-quizzes": "saved", "builder": "builder", "builder/questionbank": "bank", "builder/knowledge-base": "kb",
                      "results": "results", "results/firebase": "firebase", "firebase-help": "firebase", "analytics": "analytics", "settings": "settings", "settings/remote": "settings", "profile": "settings", "instructions": "help", "admin": "admin", "about": "about", "about/contact": "about" };
  var sbSig = "", sbRoute = "";
  function buildSidebar() {
    var li = S.edition === "lite", sig = [ui, isAdmin, li].join("|"); if (sig === sbSig) return; sbSig = sig;
    var nav = $("sbNav"); clear(nav);
    SB_GROUPS.forEach(function (g) {
      var items = g.items.filter(function (it) { return !((li && !it.lite) || (it.adminOnly && !isAdmin)); }); if (!items.length) return;
      var box = el("div", "sbgroup"); if (g.title) box.appendChild(el("div", "gt", T(g.title)));
      items.forEach(function (it) {
        var a = el("a", "sbitem"); a.setAttribute("href", routeUrl(it.route) || BASE_PATH); a.setAttribute("data-sb", it.id);
        var ic = el("span", "sbicon"); ic.insertAdjacentHTML("beforeend", icon(it.icon, 18)); a.appendChild(ic); a.appendChild(el("span", "sblabel", T(it.t)));
        a.setAttribute("aria-label", T(it.t));
        a.addEventListener("click", function (e) { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button === 1) return; e.preventDefault(); it.go(); });
        box.appendChild(a);
      });
      nav.appendChild(box);
    });
    markSidebar(sbRoute);
  }
  function markSidebar(route) {
    sbRoute = route; var id = SB_OF_ROUTE[route] || "";
    Array.prototype.forEach.call(document.querySelectorAll("#sbNav .sbitem"), function (a) { if (a.getAttribute("data-sb") === id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  }
  function paintSidebar(screenId) {
    var on = !!(user && S.edition !== "basic" && SB_SCREENS[screenId]); $("sidebar").hidden = !on; document.body.classList.toggle("has-sb", on);
    if (on) { buildSidebar(); placeSidebar(); }
  }
  function placeSidebar() { var t = $("topbar"); if (t) document.documentElement.style.setProperty("--sbtop", Math.round(t.getBoundingClientRect().bottom + window.scrollY + 14) + "px"); }
  function paintSbToggle() {
    var wide = settings.sidebar === "wide"; document.body.classList.toggle("sb-wide", wide);
    var b = $("sbToggle"); b.setAttribute("aria-pressed", wide ? "true" : "false"); $("sbToggleLabel").textContent = T(wide ? "sbUnpin" : "sbPin");
    b.querySelector(".sbicon").innerHTML = icon(wide ? "left" : "menu", 18);
  }
  function wireSidebar() {
    $("sbToggle").addEventListener("click", function () { settings.sidebar = settings.sidebar === "wide" ? "rail" : "wide"; saveSettings(); paintSbToggle(); });
    var sbEl = $("sidebar");                                         // the rail opens on hover and on keyboard focus (not after a mouse click, which also leaves focus on the item)
    sbEl.addEventListener("focusin", function (e) { var kb = true; try { kb = e.target.matches(":focus-visible"); } catch (x) {} if (kb) sbEl.classList.add("open"); });
    sbEl.addEventListener("focusout", function () { sbEl.classList.remove("open"); });
    paintSbToggle(); window.addEventListener("resize", placeSidebar);
  }
  function paintNavTitles() {                                     // names for icon-only (narrow) screens
    if ($("sidebar") && !$("sidebar").hidden) { sbSig = ""; buildSidebar(); }                       // the sidebar follows the interface language
    if ($("sbToggle")) paintSbToggle();
    Array.prototype.forEach.call(document.querySelectorAll("#tbRight .navlink"), function (a) { var t = a.textContent.trim(); a.setAttribute("data-tip", t); a.setAttribute("aria-label", t); });
    markIconOnly();
  }
  /* when an item shows only its icon, its name appears as a tip: on hover or keyboard focus, and on a touch screen by pressing and holding */
  function markIconOnly() {
    Array.prototype.forEach.call(document.querySelectorAll("#tbRight .navlink"), function (a) {
      var nl = a.querySelector(".nl"), hidden = !!nl && getComputedStyle(nl).position === "absolute";
      a.classList.toggle("tip", hidden); if (hidden) a.title = a.getAttribute("data-tip") || ""; else a.removeAttribute("title");
    });
  }
  function wireNavTips() {
    var tb = $("topbar"), timer = null, held = false;
    try { new ResizeObserver(function () { markIconOnly(); }).observe(tb); } catch (e) { window.addEventListener("resize", markIconOnly); }
    tb.addEventListener("touchstart", function (e) {
      var a = e.target.closest && e.target.closest(".navlink.tip"); if (!a) return; held = false;
      timer = setTimeout(function () { held = true; a.classList.add("tipshow"); setTimeout(function () { a.classList.remove("tipshow"); }, 2200); }, 420);
    }, { passive: true });
    ["touchend", "touchmove", "touchcancel"].forEach(function (ev) { tb.addEventListener(ev, function () { clearTimeout(timer); }, { passive: true }); });
    tb.addEventListener("click", function (e) { if (held) { held = false; e.preventDefault(); e.stopPropagation(); } }, true);    // a long press shows the name instead of opening the page
  }
