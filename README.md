# Oral Bible Quiz (OBQ)

**OBQ helps you lead a live Bible quiz for groups who learn by listening.** You say the question, the group answers aloud, and OBQ looks after the questions, the timer, the scores and the results. It is one web page that can be installed on a phone, tablet or computer, works offline once installed, and is made for projectors, presentation remotes and spoken-word settings. Free to run, no server needed (sign-in and cloud features are optional).

Release notes: [CHANGELOG.md](CHANGELOG.md) | Working on the code: [CONTRIBUTING.md](CONTRIBUTING.md) | Details for developers: `OBQ-developer-guide.md` | Optional server part: [functions/README.md](functions/README.md)

## Features

**Running a quiz**
- **OBQ Lite (quick quiz)**, **Set up a quiz** (language, scope, style, number of questions, source), **Demo Contest** (10 questions with every kind; it can also be tried **before signing in**), saved quizzes and scheduled events with **Start now**.
- Individuals or Groups; Normal style (full mix of question kinds) or Simple style (regular and multiple choice, 1 point each).
- Question kinds: regular, multiple choice (with 50:50), short answer with hints, Who am I? (clues, points fall), multi-part, trivia, difficult.
- One rhythm for every question (say it, show the answer, type the names, give points, next). Timer with sound, full screen for a projector, step guide, undo of a point, Home and Back ask first.
- **Read aloud** with the device's voice (a voice picker per language), keyboard keys and **presentation-remote** support (with a tester in Settings).

**Questions and Bible texts**
- Built-in English bank of 1,390 questions across all 66 books (shipped encrypted; a 198-question sample is in the repository).
- Your own questions from an **Excel template**; every bank is a **JSON file** (library with preview, rename, download, delete).
- **Bible Knowledge Base:** add Bible text in any language (USFM, USFX, USX, text, zip) or download it with the **Bible Brain browser**.
- **Generate questions:** puts the OBQ questions into the language of a Bible text, with the Bible's own book names, verse text and answer wording, a Review window for what needs a check, and these translation options, each marked **Free**, **Limited free** or paid, with step-by-step instructions to get a key: Google Cloud Translation, Microsoft Translator (Azure), Google Gemini (AI Studio), Chrome or Edge on the computer (no key), LibreTranslate, or a person with an Excel file.
- **Share question banks** with other Quiz Masters (10 per person) and import theirs by language.

**Results and reports**
- Winners and points table, **PDF** and **CSV**, an optional **winners' photo** (screenshot, camera or upload; kept only in memory), every finished quiz kept on the device, optional backup to **your own Firebase project**.
- **Analytics Dashboard** (activity on this device, PDF report) and an optional **Share my analytics** snapshot.

**Languages and screens**
- Interface in 11 languages (English, Hindi, Malayalam, Odia, Tamil, Telugu, Punjabi, Bengali, Nepali, Urdu with right-to-left, Marathi); every text is translated, and the page changes language at once.
- **Home page:** announcement banner, menu in groups (Run a quiz, Quiz Builder, Quiz Results, Account and help), your events, getting-started checklist, daily tip and a **Verse of the Day** with a picture, from Bible Brain in the interface language (ESV in English, IRV in the Indian languages; see below).
- Real page addresses for every page (Back button, deep links, reloads), a left icon sidebar, a top bar with icons, light, dark or device theme, font and text-size choices.

**Accounts, privacy and safety**
- Local accounts (no Firebase) or online accounts (email and password, forgot password, sign-in by email link, "remember me", offline sign-in on a remembered device).
- Terms and Conditions with notices on AI-generated content, theological accuracy (a Bible scholar should review a bank before wide release) and a privacy notice for the EU, UK and Switzerland. Usage analytics are **opt-in**. **Settings, Your data:** download your data or delete your account.
- **About and Contact:** a contact form that confirms your registered email with a one-time link (works on the free Firebase plan; messages appear in Admin), with limits of 3 messages a day. An **Admin** page for administrators (usage counts, shared analytics, shared banks, contact messages).
- Pop-ups keep keyboard focus inside; colour contrast and control names are checked.

**Install and offline**
- Installable app (PWA); the Excel reader, sign-in libraries and fonts are saved at install, so Excel upload and the whole quiz work offline.
- **Basic edition** (`obq-basic.html`): one simple file with no login, Home page or settings: a name, a quick quiz and a PDF.

**Quality:** automated checks run on every release (see CONTRIBUTING.md); the code is split into modules with declared dependencies.

## Running it yourself

You need Python 3.10 or newer (and Node 20 or newer for the checks).

```
pip install openpyxl pillow cryptography
python tools/make_template.py     # the Excel template
python tools/assemble.py          # dist/index.html: the whole app in one file
python tools/build_pwa.py         # dist/obq-app/ and dist/obq-app.zip: the installable app
python -m http.server 8000 --directory dist/obq-app      # then open http://localhost:8000
```

`python tools/assemble.py --basic` makes the basic edition. Any static host works. The included GitHub Action (`.github/workflows/deploy.yml`) runs the checks and, only when they pass, builds and publishes the site with GitHub Pages (Settings, Pages, Source: GitHub Actions); it also publishes the basic edition at `/basic/`.

### Settings
- **`src/cfg1.js`:** app name and logo, `edition`, `requireLogin`, Terms (`requireTerms`, `termsVersion`, `reacceptTerms`), `defaultTheme` and colours, question counts, `blueprint` (question mix), speech rate, default seconds and points, `announcement`, `verseImages`, and the Firebase and contact settings.
- **`private/` (never committed; each file can instead be a GitHub secret):** `bank.key` (`OBQ_BANK_KEY`), `firebase.config.json` (`FIREBASE_CONFIG_JSON`), `site.config.json` (`SITE_CONFIG_JSON`: `operatorName`, `contactEmail`, `contactProvider`, `bibleBrainKey`), `verses.json` (optional, see below), `firestore.rules`.
- **Question bank:** to encrypt your own: `python tools/import_bank.py YOUR-BANK.xlsx --encrypt --key-file private/bank.key`. Without the key the 198-question sample is used.

### Firebase (optional; the free Spark plan is enough)
1. **Authentication:** turn on Email/Password and **Email link (passwordless sign-in)**; add your site address under **Authorized domains**.
2. **Firestore:** create the database and **publish `private/firestore.rules`** (it limits shared banks, usage records and contact messages and lets people delete their own data).
3. Put the web config in `private/firebase.config.json` or the secret `FIREBASE_CONFIG_JSON`; restrict the API key to your site address; optionally switch on **App Check** (`appCheckSiteKey`).
4. **Contact form:** set `"contactProvider": "firebase"` in the site settings. Messages are stored in your project and read in Admin. (`functions/` holds an optional version with a typed code and an email to your team; it needs the Blaze plan.)

### Verse of the Day from Bible Brain
Set a Bible Brain API key (request one at <https://4.dbt.io/api_key/request>) as the GitHub secret `BIBLE_BRAIN_KEY`, or as `bibleBrainKey` in `private/site.config.json`, and rebuild. The Home page then shows the verse in the **interface language**, fetched when the language changes: the **ESV** in English and the **Indian Revised Version (IRV, Creative Commons CC BY-SA 4.0)** in Hindi, Malayalam, Odia, Tamil, Telugu, Punjabi, Bengali, Nepali, Urdu and Marathi, with the Bible's own book name and a credit line. A verse fetched once is kept on the device (it also shows without internet). Where Bible Brain has no text for a language, the Quiz Master's own Bible text in that language is used, then the built-in English King James text with a note. Things to know: the key is visible in the page, so use a key made for this app; check that your Bible Brain agreement lets you show the ESV (with its notice) and the IRV (with its attribution) in a public app. `tools/fetch_verses.py` can also pre-load verse texts into the build (`private/verses.json`) for offline use.

## Your data
- Participant names and points stay on the Quiz Master's device; they go to Firebase only if the Quiz Master connects their own project.
- With Firebase connected, account details, sign-in records, a count of quiz set-ups (no points, no names), saved items and shared banks are stored in the project; analytics only with consent.
- Bible texts, settings, saved quizzes and results are stored in the browser. Bible texts and question banks are not provided with this repository: you are responsible for their licences.
- Content in languages other than English, interface translations and generated or shared banks were made with AI tools or machine translation: **check and correct them before using them with a public audience**. The theological accuracy of each question has not been checked.

## Folders
`src/` source (settings, texts, modules, Terms, instructions) | `tools/` build and helper scripts | `tests/` automated checks | `functions/` optional server part | `data/` sample bank | `templates/` Excel template | `assets/` logo | `.github/` publishing workflow
