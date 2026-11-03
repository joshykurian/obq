"""Builds the installable-app package from dist/index.html.  Run: python3 tools/build_pwa.py
App name and colours are read from the SETTINGS block of dist/index.html, so there is nothing else to edit."""
import hashlib, json, os, re, shutil, zipfile
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, "..")
SRC = open(os.path.join(ROOT, "dist", "index.html"), encoding="utf-8").read()
name = re.search(r'appName:\s*"(.*?)"', SRC).group(1)
short = (re.search(r'shortName:\s*"(.*?)"', SRC) or re.search(r'appName:\s*"(.*?)"', SRC)).group(1)
bg = re.search(r'colors:\s*\{[^}]*?bg:\s*"(#[0-9A-Fa-f]{6})"', SRC, re.S).group(1)
accent = re.search(r'accent:\s*"(#[0-9A-Fa-f]{6})"', SRC).group(1)
ver = hashlib.sha1(SRC.encode("utf-8")).hexdigest()[:8]
OUT = os.path.join(ROOT, "dist", "obq-app")
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(os.path.join(OUT, "icons"))

# index.html + install tags + service-worker registration
head = f'''<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="{short}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
</head>'''
reg = '''<script>
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
}
</script>
</body>'''
assert SRC.count("</head>") == 1 and SRC.count("</body>") == 1 and SRC.count("<head>") == 1
# page addresses: every page has an address such as /instructions or /builder/questionbank. This tiny script (first in the head) works out the
# folder the app lives in, so that the page and its files load from any of those addresses.
ROUTES = ["builder/questionbank", "builder/knowledge-base", "builder/results", "builder/firebase", "builder/activity", "builder/remote",
          "results/firebase", "settings/remote", "builder", "results", "analytics", "instructions", "settings", "profile", "my-quizzes",
          "setup", "quick-quiz", "admin", "firebase-help", "about/contact", "about"]
base_js = ("<script>(function(){var p=location.pathname;if(!/^https?:$/.test(location.protocol)||p.charAt(0)!==\"/\")return;var R=" + json.dumps(ROUTES) +
           ";var q=p.replace(/index\\.html$/,\"\").replace(/\\/+$/,\"\"),b=null,i,s;for(i=0;i<R.length;i++){s=\"/\"+R[i];if(q.length>=s.length&&q.slice(-s.length)===s){b=q.slice(0,q.length-s.length)+\"/\";break;}}"
           "if(b===null)b=p.replace(/[^\\/]*$/,\"\");window.__OBQ_BASE=b;document.write('<base href=\"'+b+'\">');})();</script>")
page = SRC.replace("<head>", "<head>\n" + base_js, 1).replace("</head>", head).replace("</body>", reg)
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(page)
for r in ROUTES:                                   # a real page for every address, so a direct link or a reload works on any static host
    os.makedirs(os.path.join(OUT, r), exist_ok=True); open(os.path.join(OUT, r, "index.html"), "w", encoding="utf-8").write(page)
open(os.path.join(OUT, "404.html"), "w", encoding="utf-8").write(page)          # any other address opens the app too

# manifest
json.dump({"id": "./index.html", "name": name, "short_name": short, "description": "Lead live Bible quizzes for groups who learn by listening. Installs on your phone or computer and runs offline.", "categories": ["education", "productivity"],
           "shortcuts": [{"name": "My Quizzes", "url": "./my-quizzes", "icons": [{"src": "icons/icon-192.png", "sizes": "192x192"}]}, {"name": "Quiz Builder", "url": "./builder", "icons": [{"src": "icons/icon-192.png", "sizes": "192x192"}]}, {"name": "Settings", "url": "./settings", "icons": [{"src": "icons/icon-192.png", "sizes": "192x192"}]}],
           "lang": "en", "dir": "auto", "start_url": "./index.html", "scope": "./", "display": "standalone",
           "display_override": ["standalone", "minimal-ui"], "orientation": "any", "background_color": bg, "theme_color": bg,
           "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
                     {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
                     {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]},
          open(os.path.join(OUT, "manifest.webmanifest"), "w", encoding="utf-8"), indent=2)

# icons: the OBQ logo (assets/) centred on the app's dark background; a plain bubble icon if the logo file is missing
LOGO = os.path.join(ROOT, "assets", "OBQ_Oral_Bible_Quiz_Logo.png")
def icon(size, maskable=False):
    im = Image.new("RGB", (size, size), bg)
    if os.path.exists(LOGO):
        lg = Image.open(LOGO).convert("RGBA"); width = int(size * (0.66 if maskable else 0.90))
        lg = lg.resize((width, round(lg.height * width / lg.width)), Image.LANCZOS)
        layer = Image.new("RGBA", (size, size), (0, 0, 0, 0)); layer.alpha_composite(lg, ((size - lg.width) // 2, (size - lg.height) // 2))
        return Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")
    d = ImageDraw.Draw(im); pad = int(size * (0.22 if maskable else 0.12)); r = size - 2 * pad
    d.rounded_rectangle([pad, pad, pad + r, pad + int(r * 0.80)], radius=int(r * 0.2), fill=accent)
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(r * 0.56))
    d.text((pad + r / 2, pad + r * 0.40), "?", font=f, fill=bg, anchor="mm")
    return im
for fn, sz, m in [("icon-180.png", 180, False), ("icon-192.png", 192, False), ("icon-512.png", 512, False), ("icon-maskable-512.png", 512, True)]:
    icon(sz, m).save(os.path.join(OUT, "icons", fn))

# addresses that are saved at install: the Excel reader, the sign-in libraries (only when Firebase is configured) and the fonts
_app1 = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "app1.js"), encoding="utf-8").read(); _cfg1 = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "cfg1.js"), encoding="utf-8").read()
pre_ext = [re.search(r'XLSX_URL = "([^"]+)"', _app1).group(1)]
if re.search(r'firebase:\s*\{\s*apiKey:\s*"[^"]+"[^}]*projectId:\s*"[^"]+"', SRC):
    _ver = re.search(r'firebaseSdkVersion:\s*"([^"]+)"', SRC).group(1)
    pre_ext += ["https://www.gstatic.com/firebasejs/%s/firebase-%s-compat.js" % (_ver, n) for n in ("app", "auth", "firestore")]
font_css = sorted(set(re.findall(r'https://fonts\.googleapis\.com/css2?[^"\'<> )]+', SRC)))
# service worker (the version changes by itself whenever index.html changes)
open(os.path.join(OUT, "sw.js"), "w", encoding="utf-8").write(f'''// {name} - service worker (version {ver} is derived from index.html automatically)
const CACHE = "qms-{ver}";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/icon-180.png"];
const PRECACHE_EXTERNAL = {json.dumps(pre_ext)};   // saved at install, so Excel upload and the sign-in library work offline from the first time
const FONT_CSS = {json.dumps(font_css)};
async function precacheExternal(cache) {{
  await Promise.all(PRECACHE_EXTERNAL.map(async (u) => {{ try {{ const r = await fetch(u, {{ mode: "cors" }}); if (r.ok) await cache.put(u, r); }} catch (e) {{}} }}));
  for (const css of FONT_CSS) {{
    try {{
      const r = await fetch(css, {{ mode: "cors" }}); if (!r.ok) continue; const text = await r.clone().text(); await cache.put(css, r);
      const urls = [...text.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]).slice(0, 24);
      await Promise.all(urls.map(async (u) => {{ try {{ const f = await fetch(u, {{ mode: "cors" }}); if (f.ok) await cache.put(u, f); }} catch (e) {{}} }}));
    }} catch (e) {{}}
  }}
}}
const RUNTIME_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com", "www.gstatic.com"];   // fonts, the Excel reader and the Firebase library (www.gstatic.com), kept for offline use
self.addEventListener("install", (e) => {{ e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).then(() => Promise.race([precacheExternal(c), new Promise((r) => setTimeout(r, 20000))]))).then(() => self.skipWaiting())); }});
self.addEventListener("activate", (e) => {{
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener("fetch", (event) => {{
  const req = event.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (RUNTIME_HOSTS.includes(url.hostname)) {{
    event.respondWith(caches.open(CACHE).then(async (cache) => {{
      const cached = await cache.match(req);
      const fresh = fetch(req).then((res) => {{ if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone()); return res; }}).catch(() => cached);
      return cached || fresh;
    }}));
    return;
  }}
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {{
    const root = new URL("./", self.location).pathname;
    if (!url.pathname.startsWith(root) || url.pathname.startsWith(root + "basic/")) return;       // other pages on this site (for example /basic/) are not part of this app
    const isStart = url.pathname === root || url.pathname === root + "index.html";
    event.respondWith(fetch(req).then((res) => {{ if (isStart) {{ const copy = res.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); }} return res; }}).catch(() => caches.match("./index.html")));   // every page address opens the app, also offline
    return;
  }}
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
}});
''')

open(os.path.join(OUT, "firebase.json"), "w").write(json.dumps({"hosting": {"public": ".", "ignore": ["firebase.json", "**/.*", "README-hosting.txt"], "rewrites": [{"source": "**", "destination": "/index.html"}]}}, indent=2))
open(os.path.join(OUT, "README-hosting.txt"), "w", encoding="utf-8").write(f"""{name} - installable app
==========================================

FILES
  index.html, manifest.webmanifest, sw.js, icons/   the app (upload all of them, keep the icons folder)
  firebase.json                                       only needed if you host on Firebase Hosting

1. HOST IT (https is required for installing and for Firebase login)
   Any static host works: Firebase Hosting, GitHub Pages, Netlify, Cloudflare Pages, or a folder on your website.
   Opening index.html straight from the computer (file://) runs the quiz but cannot install it or use Firebase.
   Quick local test:  python3 -m http.server 8000   then open http://localhost:8000

2. INSTALL
   Android (Chrome): menu > Install app.   iPhone (Safari): Share > Add to Home Screen.   Laptop (Chrome/Edge): install icon in the address bar.

3. TURN ON LOGIN, PROFILES, QUESTION-BANK SYNC AND ANALYTICS (Firebase) - optional
   a. console.firebase.google.com > Add project (turn on Google Analytics when asked).
   b. Project settings > Your apps > Web app (</>) > copy the firebaseConfig values.
   c. Open index.html in a text editor, find  firebase: {{ apiKey: ""  in the SETTINGS block at the top, paste the values
      (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId). Save.
   d. Build > Authentication > Get started > Sign-in method > turn on Email/Password.
      Settings > Authorized domains > add the domain where the app is hosted.
   e. Build > Firestore Database > Create database (choose a region close to your users), then open Rules and paste the file
      firestore.rules from the project, then Publish. It saves each Quiz Master's profile, login count, last login and a login history
      (quizMasters/{{uid}} and quizMasters/{{uid}}/logins) and lets every user see only their own data. Passwords are never stored there:
      Firebase Authentication keeps them, hashed.
   f. Analytics > Events (and DebugView) show: login, sign_up, setup_complete, quiz_start, quiz_complete, pdf_export,
      bank_upload, template_download. Only counts and settings are sent, never participant names.
   Without these keys the app runs in LOCAL MODE: accounts and statistics stay on that device.

4. UPDATING
   Replace index.html and upload again. The app version number inside sw.js must change when index.html changes:
   re-run tools/build_pwa.py, or edit the version in sw.js by hand. Devices update the next time they open with internet.

5. PRESENTATION REMOTE
   Next = PageDown / right arrow.  Back = PageUp / left arrow.  "." or B = timer.  F5 or F = full screen.
   The Quiz Builder has a "Test your presentation remote" box that shows what each button sends.
""")
z = os.path.join(ROOT, "dist", "obq-app.zip")
if os.path.exists(z): os.remove(z)
with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
    for base, _, files in os.walk(OUT):
        for f in sorted(files):
            full = os.path.join(base, f); zf.write(full, os.path.join("obq-app", os.path.relpath(full, OUT)))
# a copy in docs/ so GitHub Pages can publish it straight from the branch (Settings > Pages > main /docs)
DOCS = os.path.join(ROOT, "docs"); shutil.rmtree(DOCS, ignore_errors=True); shutil.copytree(OUT, DOCS, ignore=shutil.ignore_patterns("firebase.json", "README-hosting.txt"))
print("built", z, os.path.getsize(z), "bytes; cache", ver)
