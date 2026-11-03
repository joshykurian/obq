// Counts the names that still live in the one shared scope (the older files listed in tools/assemble.py).  The number may only go DOWN from release to release:
// new code goes into src/modules/ (see CONTRIBUTING.md), and older files are moved there with  node tools/modularize.js.
const fs = require("fs"), path = require("path"), cm = require("./check_modules.js");
const asm = fs.readFileSync(path.join(__dirname, "assemble.py"), "utf8"), list = asm.match(/ENGINE_FILES\s*=\s*\[([^\]]*)\]/)[1].match(/"[^"]+"/g).map(s => s.slice(1, -1));
let joined = list.map(f => fs.readFileSync(path.join(__dirname, "..", "src", f), "utf8")).join("\n");
joined = joined.replace(/^\s*\(function \(\) \{[^\n]*\n/, "").replace(/\}\)\(\);\s*$/, "");           // the files together are one function: look inside it
const top = cm.analyze(joined).top; console.log(JSON.stringify({ names: top.size, files: list.length, lines: joined.split("\n").length }));
