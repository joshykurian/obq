/* @module {"name":"lang","exports":["repaintScreen"],"uses":["paintAbout","paintAnalytics","paintBuilder","paintHome","paintLite","paintResults","paintSettings","renderSaved"]} */
  /* LANGUAGE CHANGE. After applyI18n() has done the fixed texts, the page that is showing paints again the texts that the code writes (its painter function). A new page needs an entry here. */
  function repaintScreen() {                                          // the page that is showing gets its texts in the new language at once (its fixed texts were done by applyI18n)
    var a = document.querySelector(".screen.active"); if (!a) return;
    var f = { home: paintHome, settings: paintSettings, about: paintAbout, lite: paintLite, dashboard: paintBuilder, resultsPage: paintResults, analytics: paintAnalytics, setup: renderSaved }[a.id];
    if (f) { try { f(); } catch (e) {} }
  }
