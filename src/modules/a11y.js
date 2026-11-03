/* @module {"name":"a11y","exports":["initDialogs"],"uses":[]} */
  /* DIALOGS. Every pop-up (an element with the class "modal") keeps the keyboard focus inside while it is open: Tab and Shift+Tab go round its controls,
     the first control gets the focus when it opens, and the focus goes back to what opened it when it closes. Nothing else has to be done for a new pop-up:
     give it class="modal" and hide it with the "hidden" attribute. */
  var stack = [];                                                    // the open pop-ups, the newest last
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function visible(e) { return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length); }
  function focusables(m) { return Array.prototype.filter.call(m.querySelectorAll(FOCUSABLE), visible); }
  function onKey(e) {
    if (e.key !== "Tab" || !stack.length) return;
    var m = stack[stack.length - 1].el, items = focusables(m), a = document.activeElement;
    if (!items.length) { e.preventDefault(); m.focus(); return; }
    var first = items[0], last = items[items.length - 1];
    if (!m.contains(a)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }
  function opened(m) {
    if (stack.some(function (s) { return s.el === m; })) return;
    stack.push({ el: m, opener: document.activeElement }); if (!m.hasAttribute("tabindex")) m.setAttribute("tabindex", "-1");
    setTimeout(function () { if (!m.contains(document.activeElement)) { var it = focusables(m); (it[0] || m).focus(); } }, 30);
  }
  function closed(m) {
    var i = -1; stack.forEach(function (s, k) { if (s.el === m) i = k; }); if (i < 0) return;
    var op = stack.splice(i, 1)[0].opener; if (op && op.focus && document.contains(op) && visible(op)) { try { op.focus(); } catch (e) {} }
  }
  function watch(m) {
    new MutationObserver(function () { if (m.hidden) closed(m); else opened(m); }).observe(m, { attributes: true, attributeFilter: ["hidden"] });
    if (!m.hidden) opened(m);
  }
  function initDialogs() { document.addEventListener("keydown", onKey, true); Array.prototype.forEach.call(document.querySelectorAll(".modal"), watch); }
