// Checks every module in src/modules:  each name a module takes from the shared app scope must be listed in its "uses",  each "uses" entry must really be used,
// and each export must exist.  A module cannot reach into the shared scope by accident, and its inner names can never clash with another file.
//   node tools/check_modules.js            (needs "acorn": npm install, or set ACORN_PATH)
const fs = require("fs"), path = require("path");
function loadAcorn() {
  const tries = [process.env.ACORN_PATH, "acorn", path.join(__dirname, "..", "node_modules", "acorn"), "/home/claude/.npm-global/lib/node_modules/ts-node/node_modules/acorn"].filter(Boolean);
  for (const p of tries) { try { return require(p); } catch (e) {} }
  throw new Error("acorn was not found: run  npm install  in the repository");
}
const acorn = loadAcorn();
const BUILTIN = new Set(("Object Array Promise Math JSON window document navigator location localStorage sessionStorage fetch setTimeout clearTimeout setInterval clearInterval requestAnimationFrame URL Blob Image FileReader Response Request Headers " +
  "TextEncoder TextDecoder CompressionStream DecompressionStream indexedDB console Date RegExp Error TypeError RangeError parseInt parseFloat isNaN isFinite String Number Boolean encodeURIComponent decodeURIComponent atob btoa Uint8Array " +
  "ArrayBuffer Set Map WeakMap Symbol Intl MutationObserver ResizeObserver matchMedia self performance crypto undefined NaN Infinity arguments Translator HTMLElement Event KeyboardEvent MouseEvent File FormData AbortController DOMParser " +
  "XMLHttpRequest screen alert confirm prompt caches").split(" "));
function declNames(p, out) {
  if (!p) return;
  switch (p.type) {
    case "Identifier": out.add(p.name); break;
    case "ObjectPattern": p.properties.forEach(q => declNames(q.value || q.argument, out)); break;
    case "ArrayPattern": p.elements.forEach(e => declNames(e, out)); break;
    case "RestElement": declNames(p.argument, out); break;
    case "AssignmentPattern": declNames(p.left, out); break;
  }
}
function hoist(node, scope) {                                    // names declared in a function body (not inside nested functions)
  (function visit(n) {
    if (!n || typeof n.type !== "string") return;
    switch (n.type) {
      case "VariableDeclaration": n.declarations.forEach(d => declNames(d.id, scope)); break;
      case "FunctionDeclaration": scope.add(n.id.name); return;
      case "ClassDeclaration": scope.add(n.id.name); break;
      case "FunctionExpression": case "ArrowFunctionExpression": return;
      case "CatchClause": declNames(n.param, scope); break;
    }
    for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v.type === "string") visit(v); }
  })(node);
}
function analyze(code) {
  const ast = acorn.parse("(function(){" + code + "\n})", { ecmaVersion: 2022, sourceType: "script" });
  const fn = ast.body[0].expression, top = new Set(), free = new Set(); hoist(fn.body, top);
  function ref(name, scopes) { for (const s of scopes) if (s.has(name)) return; free.add(name); }
  function walk(n, scopes) {
    if (!n || typeof n.type !== "string") return;
    switch (n.type) {
      case "Identifier": ref(n.name, scopes); return;
      case "MemberExpression": walk(n.object, scopes); if (n.computed) walk(n.property, scopes); return;
      case "Property": if (n.computed) walk(n.key, scopes); walk(n.value, scopes); return;
      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": {
        const s = new Set(); n.params.forEach(p => declNames(p, s)); if (n.id && n.type === "FunctionExpression") s.add(n.id.name); if (n.body.type === "BlockStatement") hoist(n.body, s);
        const sc = [s].concat(scopes); n.params.forEach(p => { if (p.type === "AssignmentPattern") walk(p.right, sc); }); walk(n.body, sc); return;
      }
      case "LabeledStatement": walk(n.body, scopes); return;
      case "BreakStatement": case "ContinueStatement": return;
      case "VariableDeclarator": walk(n.init, scopes); return;
      case "CatchClause": walk(n.body, scopes); return;
    }
    for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(c => walk(c, scopes)); else if (v && typeof v.type === "string") walk(v, scopes); }
  }
  walk(fn.body, [top]); return { top, free };
}
function header(src, file) {
  const m = src.match(/^\/\*\s*@module\s+(\{[\s\S]*?\})\s*\*\//); if (!m) throw new Error(file + ": the first line must be  /* @module {\"name\":..., \"exports\":[...], \"uses\":[...]} */");
  return { meta: JSON.parse(m[1]), body: src.slice(m[0].length) };
}
if (require.main === module) {
  const dir = path.join(__dirname, "..", "src", "modules"); let bad = 0;
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith(".js")).sort()) {
    const { meta, body } = header(fs.readFileSync(path.join(dir, f), "utf8"), f); let r;
    try { r = analyze(body); } catch (e) { console.log("FAIL " + f + ": cannot parse: " + e.message); bad++; continue; }
    const need = [...r.free].filter(n => !BUILTIN.has(n)).sort(); 
    if (process.argv.includes("--fix")) {                      // writes the list of shared names into the header (use it when you start a module, then read the list: it is your dependency list)
      const file = path.join(dir, f), txt = fs.readFileSync(file, "utf8"); meta.uses = need;
      fs.writeFileSync(file, txt.replace(/^\/\*\s*@module\s+\{[\s\S]*?\}\s*\*\//, "/* @module " + JSON.stringify(meta) + " */")); console.log("fixed " + f + ": uses " + need.join(", ")); continue;
    }
    const uses = new Set(meta.uses || []), probs = [];
    need.filter(n => !uses.has(n)).forEach(n => probs.push("uses \"" + n + "\" from the shared scope but does not list it in \"uses\""));
    (meta.uses || []).filter(n => !r.free.has(n)).forEach(n => probs.push("lists \"" + n + "\" in \"uses\" but does not use it"));
    (meta.exports || []).filter(n => !r.top.has(n)).forEach(n => probs.push("exports \"" + n + "\", which the module does not define"));
    if (probs.length) { bad++; console.log("FAIL " + f + " (module " + meta.name + ")"); probs.forEach(p => console.log("     " + p)); }
    else console.log("ok   " + f + "  exports " + (meta.exports || []).length + ", takes " + need.length + " names from the shared scope");
  }
  process.exit(bad ? 1 : 0);
}
module.exports = { analyze, header, BUILTIN };
