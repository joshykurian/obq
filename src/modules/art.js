/* @module {"name":"art","exports":["VERSE_THEME_NAMES","verseArt"],"uses":[]} */

  /* =====================================================================
     VERSE OF THE DAY PICTURES
     Original vector illustrations (no downloads, no licences, they work offline). Each verse in src/cfg4_verses.js has a picture theme
     as its sixth item; the theme names are the keys of VERSE_SCENES below. To use your own pictures, add images to a folder of your site
     and list them in "verseImages" in the settings (theme name -> image address).
     ===================================================================== */
  var VERSE_THEME_NAMES = {
    cross: "A cross against the sunrise", shepherd: "A shepherd's sheep on green hills", book: "An open Bible with rays of light", stars: "Stars and a moon over the earth",
    path: "A road leading to the sunrise", lamp: "A burning oil lamp in the dark", hills: "Mountains at sunrise", tower: "A strong tower at sunrise",
    wings: "A bird soaring over mountains", globe: "The world with points of light", dove: "A dove carrying an olive branch", sunrise: "The sun rising over the sea",
    tree: "A fruitful tree beside a stream", door: "A door with light shining around it"
  };
  var VA_STARS = [[22,30,1.4],[58,74,1],[96,22,1.6],[138,52,1],[176,18,1.2],[214,60,1.5],[250,28,1],[286,64,1.3],[330,24,1.6],[368,56,1],[40,120,1.1],[110,104,1],[300,110,1.2],[352,100,1.4],[16,86,1],[188,96,1],[268,92,1],[380,20,1.2],[70,40,1.3],[232,16,1]];
  function vaStars(n) { return VA_STARS.slice(0, n || VA_STARS.length).map(function (s) { return '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '" fill="#fff" opacity=".85"/>'; }).join(""); }
  function vaRays(cx, cy, r1, r2, a0, a1, step, col, w, op) {
    var out = "";
    for (var a = a0; a <= a1; a += step) { var t = a * Math.PI / 180; out += '<line x1="' + (cx + Math.cos(t) * r1).toFixed(1) + '" y1="' + (cy + Math.sin(t) * r1).toFixed(1) + '" x2="' + (cx + Math.cos(t) * r2).toFixed(1) + '" y2="' + (cy + Math.sin(t) * r2).toFixed(1) + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" opacity="' + op + '"/>'; }
    return out;
  }
  function vaSheep(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-13" y="8" width="4" height="15" rx="2" fill="#3a2418"/><rect x="8" y="8" width="4" height="15" rx="2" fill="#3a2418"/>' +
      '<ellipse cx="0" cy="0" rx="25" ry="15" fill="#f4ead8"/><circle cx="-14" cy="-9" r="9" fill="#f4ead8"/><circle cx="2" cy="-12" r="9" fill="#f4ead8"/><circle cx="16" cy="-6" r="9" fill="#f4ead8"/>' +
      '<ellipse cx="-27" cy="-3" rx="8" ry="7.5" fill="#3a2418"/><ellipse cx="-32" cy="-9" rx="3.5" ry="2.2" fill="#3a2418" transform="rotate(-30 -32 -9)"/></g>';
  }
  var VERSE_SCENES = {
    hills: function () { return '<rect width="400" height="260" fill="url(#vaDawn)"/><circle cx="290" cy="158" r="100" fill="url(#vaGlow)"/><circle cx="290" cy="164" r="30" fill="#ffe2a0"/>' +
      '<path d="M0 178 L58 128 L104 160 L170 104 L240 172 L300 142 L400 192 V260 H0Z" fill="#7a3b1d"/><path d="M0 208 Q80 162 160 202 T320 196 T400 208 V260 H0Z" fill="#4a2412"/><path d="M0 242 Q110 206 220 236 T400 230 V260 H0Z" fill="#2a140a"/>' +
      '<path d="M70 66 q8 -9 16 0 q8 -9 16 0 M120 92 q6 -7 12 0 q6 -7 12 0" stroke="#ffe2a0" stroke-width="2.4" fill="none" opacity=".8"/>'; },
    lamp: function () { return '<rect width="400" height="260" fill="url(#vaNight)"/>' + vaStars(14) + '<circle cx="300" cy="150" r="120" fill="url(#vaGlow)"/><rect x="0" y="214" width="400" height="46" fill="#1a0f0a"/><ellipse cx="205" cy="216" rx="130" ry="9" fill="#ffb04a" opacity=".2"/>' +
      '<path d="M135 190 Q138 162 195 160 L220 160 Q272 162 276 190 Q256 214 205 214 Q155 214 135 190Z" fill="#d9892b"/><path d="M160 178 Q205 170 252 178" stroke="#f3b45a" stroke-width="4" fill="none" opacity=".7"/>' +
      '<path d="M276 186 Q298 180 306 166 Q302 192 276 200Z" fill="#d9892b"/><path d="M135 184 Q104 176 110 204 Q118 222 146 206" stroke="#d9892b" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<rect x="188" y="151" width="34" height="11" rx="3" fill="#b86f1f"/><path d="M306 166 C294 148 306 136 305 116 C318 134 322 152 306 166Z" fill="#ffc94d"/><path d="M306 164 C300 154 306 148 306 138 C312 148 313 156 306 164Z" fill="#fff3c4"/>'; },
    shepherd: function () { return '<rect width="400" height="260" fill="url(#vaDay)"/><circle cx="320" cy="124" r="74" fill="url(#vaGlow)"/><circle cx="320" cy="132" r="24" fill="#ffe2a0"/>' +
      '<path d="M0 172 Q100 132 200 166 T400 152 V260 H0Z" fill="#6f8f45"/><path d="M0 206 Q120 172 230 202 T400 196 V260 H0Z" fill="#4d7035"/><path d="M0 242 Q130 212 250 236 T400 230 V260 H0Z" fill="#324d24"/>' +
      '<rect x="58" y="136" width="9" height="62" rx="3" fill="#5a3a1e"/><circle cx="62" cy="122" r="26" fill="#35592a"/><circle cx="42" cy="136" r="19" fill="#3f6a30"/><circle cx="84" cy="136" r="19" fill="#3f6a30"/><circle cx="62" cy="108" r="17" fill="#4f7a3a"/>' +
      vaSheep(160, 206, 1) + vaSheep(232, 224, .85) + vaSheep(318, 214, .7) + '<path d="M274 232 V150 Q274 126 294 130 Q308 136 300 150" stroke="#5a3a1e" stroke-width="6" fill="none" stroke-linecap="round"/>'; },
    book: function () { return '<rect width="400" height="260" fill="url(#vaNight)"/>' + vaStars(12) + '<circle cx="200" cy="140" r="130" fill="url(#vaGlow)"/>' + vaRays(200, 150, 70, 215, -165, -15, 15, "#ffd37a", 3, .4) +
      '<path d="M74 192 L200 212 L326 192 L326 204 L200 224 L74 204Z" fill="#8a3a1a"/><path d="M200 208 L84 192 Q80 150 86 112 Q146 108 200 128Z" fill="#f6ead2"/><path d="M200 208 L316 192 Q320 150 314 112 Q254 108 200 128Z" fill="#fbf2de"/>' +
      '<path d="M200 128 V208" stroke="#c9b48a" stroke-width="3"/>' + [140, 153, 166, 179].map(function (y, i) { return '<path d="M100 ' + (y - 4 + i) + ' L186 ' + (y + 4 + i) + '" stroke="#b79d6c" stroke-width="2.6" stroke-linecap="round"/><path d="M214 ' + (y + 4 + i) + ' L300 ' + (y - 4 + i) + '" stroke="#c4aa78" stroke-width="2.6" stroke-linecap="round"/>'; }).join(""); },
    path: function () { return '<rect width="400" height="260" fill="url(#vaDawn)"/><circle cx="205" cy="160" r="110" fill="url(#vaGlow)"/><circle cx="205" cy="166" r="26" fill="#ffe2a0"/>' +
      '<path d="M0 176 Q100 150 205 172 T400 166 V260 H0Z" fill="#5a2c14"/><path d="M0 214 Q90 188 160 210 L140 260 H0Z" fill="#3a1d0e"/><path d="M400 210 Q320 186 250 208 L282 260 H400Z" fill="#3a1d0e"/>' +
      '<path d="M132 260 C165 232 205 224 196 202 C190 188 202 178 205 171 L211 171 C214 180 224 188 234 200 C250 218 270 240 284 260Z" fill="#e0a05a"/><path d="M205 176 C204 190 214 200 224 214" stroke="#fff3c4" stroke-width="2.4" fill="none" stroke-dasharray="6 7" opacity=".7"/>' +
      '<path d="M54 196 l8 -26 l8 26Z M76 202 l9 -30 l9 30Z M330 200 l8 -26 l8 26Z" fill="#241208"/>'; },
    dove: function () { return '<rect width="400" height="260" fill="url(#vaDay)"/><circle cx="90" cy="70" r="64" fill="url(#vaGlow)" opacity=".7"/><ellipse cx="90" cy="206" rx="64" ry="14" fill="#fff" opacity=".28"/><ellipse cx="320" cy="60" rx="52" ry="13" fill="#fff" opacity=".28"/><ellipse cx="270" cy="214" rx="80" ry="15" fill="#fff" opacity=".22"/>' +
      '<path d="M128 150 L82 168 L98 146 L70 138 L124 138Z" fill="#fff8ec"/><path d="M120 150 Q165 118 225 132 Q262 140 286 124 Q284 154 252 170 Q212 188 168 178 Q132 170 120 150Z" fill="#fff8ec"/>' +
      '<path d="M168 140 Q172 96 214 78 Q212 114 204 142Z" fill="#efe2c8"/><path d="M180 142 Q196 78 262 62 Q250 108 236 146Z" fill="#fffdf6" stroke="#e9d9bd" stroke-width="2"/>' +
      '<circle cx="292" cy="122" r="15" fill="#fff8ec"/><circle cx="298" cy="118" r="2.8" fill="#2a1a10"/><path d="M305 121 L326 126 L305 131Z" fill="#e08a2b"/>' +
      '<path d="M324 128 Q338 142 354 148" stroke="#5f7a34" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="336" cy="134" rx="9" ry="4.5" fill="#7a9a3c" transform="rotate(-35 336 134)"/><ellipse cx="346" cy="146" rx="9" ry="4.5" fill="#7a9a3c" transform="rotate(30 346 146)"/><ellipse cx="354" cy="138" rx="8" ry="4" fill="#8fae4a" transform="rotate(-50 354 138)"/>'; },
    cross: function () { return '<rect width="400" height="260" fill="url(#vaDawn)"/><circle cx="200" cy="130" r="140" fill="url(#vaGlow)"/>' + vaRays(200, 138, 60, 230, -170, -10, 12, "#ffe2a0", 3, .35) +
      '<rect x="187" y="64" width="26" height="150" rx="3" fill="#2a140a"/><rect x="146" y="102" width="108" height="26" rx="3" fill="#2a140a"/><path d="M0 218 Q100 196 200 214 T400 206 V260 H0Z" fill="#1d0e07"/><path d="M0 244 Q120 224 240 242 T400 236 V260 H0Z" fill="#120905"/>'; },
    tower: function () { return '<rect width="400" height="260" fill="url(#vaDawn)"/><circle cx="318" cy="146" r="92" fill="url(#vaGlow)"/><circle cx="318" cy="152" r="26" fill="#ffe2a0"/>' +
      '<path d="M40 260 L96 196 L150 176 L250 176 L304 196 L360 260Z" fill="#3a2214"/><path d="M0 250 Q100 226 200 246 T400 240 V260 H0Z" fill="#2a140a"/>' +
      '<rect x="172" y="88" width="56" height="94" fill="#5a3320"/><rect x="172" y="74" width="12" height="16" fill="#5a3320"/><rect x="194" y="74" width="12" height="16" fill="#5a3320"/><rect x="216" y="74" width="12" height="16" fill="#5a3320"/>' +
      '<path d="M192 124 v16 q8 -11 16 0 v-16 q-8 -10 -16 0Z" fill="#ffd37a"/><path d="M190 182 v-22 q10 -15 20 0 v22Z" fill="#1d0e07"/><path d="M200 74 V42" stroke="#5a3320" stroke-width="3"/><path d="M200 42 L228 51 L200 60Z" fill="#e8761f"/>'; },
    wings: function () { return '<rect width="400" height="260" fill="url(#vaDawn)"/><circle cx="200" cy="150" r="120" fill="url(#vaGlow)"/>' +
      '<path d="M0 190 L66 142 L112 172 L176 120 L250 184 L312 150 L400 200 V260 H0Z" fill="#6a2f18"/><path d="M0 226 Q100 188 200 220 T400 214 V260 H0Z" fill="#3a1d0e"/>' +
      '<path d="M200 104 Q160 66 88 80 Q128 90 150 112 Q120 106 96 124 Q150 126 192 130Z" fill="#1d0e07"/><path d="M200 104 Q240 66 312 80 Q272 90 250 112 Q280 106 304 124 Q250 126 208 130Z" fill="#1d0e07"/>' +
      '<path d="M192 104 Q200 90 208 104 L210 138 Q200 150 190 138Z" fill="#1d0e07"/><circle cx="200" cy="96" r="8" fill="#1d0e07"/><path d="M206 98 L216 101 L206 104Z" fill="#e8761f"/><path d="M190 136 L200 170 L210 136Z" fill="#1d0e07"/>' +
      '<path d="M310 56 q6 -7 12 0 q6 -7 12 0 M70 52 q5 -6 10 0 q5 -6 10 0" stroke="#1d0e07" stroke-width="2.4" fill="none" opacity=".8"/>'; },
    door: function () { return '<rect width="400" height="260" fill="#1a1022"/><circle cx="200" cy="130" r="130" fill="url(#vaGlow)" opacity=".55"/><rect x="0" y="214" width="400" height="46" fill="#120a0e"/><path d="M160 214 L240 214 L300 260 L100 260Z" fill="url(#vaGlow)" opacity=".75"/>' +
      '<path d="M140 214 V114 Q140 50 200 50 Q260 50 260 114 V214Z" fill="#5a3a1e"/><path d="M140 214 V114 Q140 50 200 50 Q260 50 260 114 V214" stroke="#ffd37a" stroke-width="3.5" fill="none"/>' +
      '<path d="M164 200 V118 Q164 82 200 82 Q236 82 236 118 V200Z" fill="#6b4524" stroke="#4a2d14" stroke-width="3"/><path d="M200 82 V200 M164 140 H236" stroke="#4a2d14" stroke-width="3"/><circle cx="200" cy="120" r="9" fill="none" stroke="#e0a03a" stroke-width="3.4"/><circle cx="245" cy="156" r="5.5" fill="#e0a03a"/>'; },
    globe: function () { return '<rect width="400" height="260" fill="url(#vaNight)"/>' + vaStars(16) + '<circle cx="200" cy="132" r="112" fill="url(#vaGlow)" opacity=".75"/><clipPath id="vaClip"><circle cx="200" cy="132" r="78"/></clipPath><circle cx="200" cy="132" r="78" fill="#1f5f7a"/>' +
      '<g clip-path="url(#vaClip)"><path d="M146 98 Q168 78 196 90 Q208 110 190 124 Q170 130 160 154 Q140 132 146 98Z" fill="#5f9e5a"/><path d="M220 118 Q250 98 272 124 Q264 152 240 162 Q222 148 220 118Z" fill="#6aa862"/><path d="M184 170 Q200 160 216 172 Q208 192 190 190Z" fill="#5f9e5a"/>' +
      '<ellipse cx="200" cy="132" rx="38" ry="78" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/><ellipse cx="200" cy="132" rx="72" ry="78" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/><path d="M122 132 H278" stroke="#fff" stroke-opacity=".3" stroke-width="2"/><circle cx="170" cy="100" r="64" fill="#fff" opacity=".07"/></g>' +
      [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { var t = a * Math.PI / 180; return '<circle cx="' + (200 + Math.cos(t) * 100).toFixed(1) + '" cy="' + (132 + Math.sin(t) * 100).toFixed(1) + '" r="3.6" fill="#ffd37a"/>'; }).join(""); },
    stars: function () { return '<rect width="400" height="260" fill="url(#vaNight)"/>' + vaStars() + '<path d="M120 62 L124 78 L140 82 L124 86 L120 102 L116 86 L100 82 L116 78Z" fill="#fff3c4"/><path d="M318 38 A32 32 0 1 0 346 86 A25 25 0 1 1 318 38Z" fill="#ffe9b0"/>' +
      '<path d="M0 232 Q200 188 400 232 V260 H0Z" fill="#12102a"/><path d="M0 232 Q200 188 400 232" stroke="#e8761f" stroke-width="2.5" fill="none" opacity=".75"/><path d="M0 232 Q200 188 400 232" stroke="#ffb957" stroke-width="6" fill="none" opacity=".18"/>'; },
    sunrise: function () { return '<rect width="400" height="260" fill="url(#vaDawn)"/><circle cx="200" cy="168" r="130" fill="url(#vaGlow)"/>' + vaRays(200, 168, 62, 118, -172, -8, 13, "#ffe2a0", 4, .55) + '<path d="M148 170 A52 52 0 0 1 252 170Z" fill="#ffe2a0"/>' +
      '<rect y="170" width="400" height="90" fill="#2a140a"/>' + [[176,192,48,.7],[160,204,80,.55],[142,218,116,.4],[126,232,148,.28],[112,246,176,.18]].map(function (r) { return '<path d="M' + r[0] + ' ' + r[1] + ' H' + (r[0] + r[2]) + '" stroke="#ffb957" stroke-width="4" stroke-linecap="round" opacity="' + r[3] + '"/>'; }).join("") +
      '<path d="M64 76 q7 -8 14 0 q7 -8 14 0 M300 62 q6 -7 12 0 q6 -7 12 0" stroke="#ffe2a0" stroke-width="2.4" fill="none" opacity=".8"/>'; },
    tree: function () { return '<rect width="400" height="260" fill="url(#vaDay)"/><circle cx="330" cy="70" r="60" fill="url(#vaGlow)"/><path d="M0 206 Q120 184 240 202 T400 196 V260 H0Z" fill="#4d7035"/><path d="M0 236 Q100 222 200 236 T400 228 V260 H0Z" fill="#3b86a8"/>' +
      '<path d="M30 244 q40 -6 70 0 M200 246 q50 -6 90 0 M300 238 q36 -5 60 0" stroke="#bfe3f2" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/><path d="M188 214 L195 136 L207 136 L214 214Z" fill="#5a3a1e"/><path d="M200 168 L168 144 M200 158 L232 138" stroke="#5a3a1e" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="200" cy="96" r="48" fill="#4f7a3a"/><circle cx="158" cy="124" r="34" fill="#43692f"/><circle cx="242" cy="124" r="34" fill="#43692f"/><circle cx="200" cy="138" r="38" fill="#4f7a3a"/><circle cx="176" cy="84" r="26" fill="#6b9a4a"/><circle cx="228" cy="82" r="24" fill="#6b9a4a"/>' +
      [[172,110],[214,104],[240,128],[160,134],[198,146],[226,92]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6.5" fill="#e8761f"/><circle cx="' + (p[0] - 2) + '" cy="' + (p[1] - 2) + '" r="2" fill="#ffd9a0"/>'; }).join(""); }
  };
  function verseArt(theme) {
    var f = VERSE_SCENES[theme] || VERSE_SCENES.sunrise;
    var defs = '<defs><linearGradient id="vaDawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1230"/><stop offset=".45" stop-color="#6a2c1f"/><stop offset=".8" stop-color="#e8761f"/><stop offset="1" stop-color="#ffb957"/></linearGradient>' +
      '<linearGradient id="vaNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a1d"/><stop offset=".65" stop-color="#1b1840"/><stop offset="1" stop-color="#4a2a4e"/></linearGradient>' +
      '<linearGradient id="vaDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27476e"/><stop offset=".6" stop-color="#f0a35a"/><stop offset="1" stop-color="#ffd9a0"/></linearGradient>' +
      '<radialGradient id="vaGlow"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".95"/><stop offset=".5" stop-color="#ffb04a" stop-opacity=".35"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient></defs>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + defs + f() + '</svg>';
  }
