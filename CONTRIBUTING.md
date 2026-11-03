# Working on OBQ: the rules that keep every release safe

Every release must pass the checks. They run on every push (GitHub Action "Build and deploy": the site is only published when all of them pass) and on your computer with
`pip install playwright openpyxl pillow cryptography && playwright install chromium && npm install` and then `npm run check`
(= `node tools/check_modules.js` and `python tests/run_all.py`; the server functions have their own: `cd functions && npm test`).

| Gate | What it protects | Where |
|---|---|---|
| Build | valid JavaScript, one version number (`src/cfg1.js` = newest `CHANGELOG.md` entry), nothing private in the build, small page, **the offline cache saves the Excel reader** | `tests/cases/test_build.py` |
| Names | no two functions with the same name; the build stops | `tools/assemble.py` |
| Modules | a module takes from the shared scope only what its header lists; the number of names in the shared scope may only go down | `tools/check_modules.js`, `tests/cases/test_modules.py` |
| Translations | placeholders unchanged, no unknown keys, **every text translated in all 10 languages**, the screens really show them | `tests/cases/test_i18n.py` |
| Accessibility | **focus stays inside pop-ups**, every control has a name, colour contrast | `tests/cases/test_a11y.py` |
| Offline | the installed app opens and Excel upload works without internet | `tests/cases/test_offline.py` |
| Features | navigation, quiz and PDF, question banks, translation, sharing, contact, privacy | `tests/cases/test_*.py` |
| Notices | the AI-content and theology notices, and the EU/UK sections of the Terms, stay in place | `tests/cases/test_legal.py` |
| Server | contact code, limits | `functions/test/lib.test.js` |
| Rules | the database rules keep their limits (when `private/firestore.rules` is present) | `tests/cases/test_rules.py` |

## New code goes into a module
Put new code in `src/modules/<name>.js`. The first line is a header: `/* @module {"name":"x","exports":["openX"],"uses":[]} */`. Write the code, then run
`node tools/check_modules.js --fix` (it writes the list of shared names the module uses: read it, that is its dependency list) and add a call in `boot()` in `src/app4.js` if it needs wiring.
Inside a module every name is private; only `exports` are visible to other files. Older files are moved with `node tools/modularize.js src/app_x.js --write`
(it refuses when an exported variable changes after it is set: export a function instead). Still to move: `app1.js`, `app2.js`, `app3.js`, `app4.js`, `app_own.js`, `app_router.js`. (Before moving a file, replace every use of a variable that changes by a small function, as was done for `libList()` and `libSay()` in the banks module.)

## Translations
`node tools/i18n_report.js` shows the coverage. **Every interface text must be translated in all 10 languages: a new English text fails the check until it is.** New English texts go in `src/cfg2_extra.js` (`Object.assign(QUIZ_I18N.en, {...})`); the ten translations go in `src/cfg2_tr_<code>.js` (`python tools/i18n_export.py` lists what is missing). `OBQ_ALLOW_MISSING_I18N=1` lets a draft build pass for a short time.
Machine translations need a native reader: mark them as reviewed only when someone has done it. After translating run `OBQ_UPDATE_BASELINE=1 python tests/run_all.py i18n`.

## Before a release
1. Version: `src/cfg1.js` `appVersion` and a new entry on top of `CHANGELOG.md`.
2. `npm run check` is green; `cd functions && npm test` is green.
3. If `private/firestore.rules` changed, publish it in the Firebase console and try: sign up, share a bank, send a contact message.
4. Legal text changed? Bump `termsVersion` in `src/cfg1.js`; decide on `reacceptTerms`.
5. Have the Terms (EU/UK section) read by a lawyer, and have generated and translated content read by native speakers and a Bible scholar before public use.
