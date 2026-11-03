// Prints (or, with --json, outputs) how many interface strings each language has, by loading the real translation files.
const fs = require("fs"), path = require("path"), vm = require("vm");
const dir = path.join(__dirname, "..", "src");
const files = fs.readdirSync(dir).filter(f => /^cfg2_.*\.js$/.test(f)).sort((a, b) => (a === "cfg2_en.js" ? -1 : b === "cfg2_en.js" ? 1 : a === "cfg2_extra.js" ? 1 : b === "cfg2_extra.js" ? -1 : a.localeCompare(b)));
const sandbox = { QUIZ_I18N: {} }; vm.createContext(sandbox);
// the objects must exist before the files add to them: cfg2_en.js creates QUIZ_I18N.en, the others create their own, the extras file adds to all
let src = "var QUIZ_I18N = {};\n"; for (const f of files) src += fs.readFileSync(path.join(dir, f), "utf8") + "\n";
vm.runInContext(src, sandbox);
const I = sandbox.QUIZ_I18N, en = Object.keys(I.en), langs = Object.keys(I).filter(l => l !== "en");
const out = { total: en.length, langs: {} };
for (const l of langs) { const have = new Set(Object.keys(I[l] || {})); out.langs[l] = { have: en.filter(k => have.has(k)).length, missing: en.filter(k => !have.has(k)) }; }
out.en = I.en; out.tr = I;
if (process.argv.includes("--json")) { process.stdout.write(JSON.stringify(out)); }
else { console.log("English strings:", en.length); for (const l of langs) console.log("  " + l + ": " + out.langs[l].have + " (" + Math.round(100 * out.langs[l].have / en.length) + "%)  missing " + out.langs[l].missing.length); }
