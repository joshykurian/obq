// Helps to turn an older file (src/app_x.js) into a module: lists what it defines, which of those names other files use (= its exports) and whether an export
// is a variable that is reassigned (a copy would go stale: export a function that returns it instead).
//   node tools/modularize.js src/app_art.js [--write]     (--write moves the file to src/modules/ with a header; then run  node tools/check_modules.js --fix)
const fs = require("fs"), path = require("path"), cm = require("./check_modules.js");
const root = path.join(__dirname, ".."), src = path.join(root, "src");
function strip(code) {                                         // names inside comments and quoted text are not uses of a variable
  return code.replace(/^\/\*\s*@module[\s\S]*?\*\//, "").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1 ").replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, '""');
}
function others(except) {
  const out = []; for (const d of [src, path.join(src, "modules")]) for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (!f.endsWith(".js") || f.startsWith("cfg") || p === except || fs.statSync(p).isDirectory()) continue; out.push([p, strip(fs.readFileSync(p, "utf8"))]); }
  return out;
}
function plan(file) {
  const code = fs.readFileSync(file, "utf8"), r = cm.analyze(code), ast = require("./check_modules.js"); const names = [...r.top];
  const others_ = others(path.resolve(file)), used = names.filter(n => others_.some(([p, t]) => new RegExp("(^|[^A-Za-z0-9_$.])" + n.replace(/\$/g, "\\$") + "(?![A-Za-z0-9_$])").test(t)));
  const isFn = {}; names.forEach(n => { isFn[n] = new RegExp("(^|\\n)\\s*function\\s+" + n.replace(/\$/g, "\\$") + "\\s*\\(").test(code); });
  const assigned = {}; names.forEach(n => { const c = (code.match(new RegExp("(^|[^A-Za-z0-9_$.])" + n.replace(/\$/g, "\\$") + "\\s*(=[^=>]|\\+=|-=|\\+\\+|--)", "g")) || []).length; assigned[n] = c; });
  return { names, used, isFn, assigned, need: [...r.free].filter(n => !cm.BUILTIN.has(n)).sort() };
}
if (require.main === module) {
  const file = process.argv[2], p = plan(file);
  console.log(file + ": defines " + p.names.length + " names; others use " + p.used.length + ":");
  p.used.forEach(n => console.log("   " + n + "  " + (p.isFn[n] ? "function" : "VARIABLE" + (p.assigned[n] > 1 ? " (assigned " + p.assigned[n] + " times: a copy would go stale)" : " (set once)"))));
  console.log("takes from the shared scope: " + p.need.length + " names");
  if (process.argv.includes("--write")) {
    const bad = p.used.filter(n => !p.isFn[n] && p.assigned[n] > 1); if (bad.length) { console.log("NOT written: these exported variables change: " + bad.join(", ")); process.exit(1); }
    const name = path.basename(file).replace(/^app_|\.js$/g, ""), out = path.join(src, "modules", name + ".js"), meta = { name, exports: p.used, uses: p.need };
    fs.writeFileSync(out, "/* @module " + JSON.stringify(meta) + " */\n" + fs.readFileSync(file, "utf8")); fs.unlinkSync(file); console.log("written " + out + "; remove " + path.basename(file) + " from ENGINE_FILES in tools/assemble.py");
  }
}
