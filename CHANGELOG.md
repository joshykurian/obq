# Changelog

## v1.10.0 - accuracy notices, privacy for the EU and UK, a safer contact form, checks in the repository

### Added
- **Notices about AI-generated content and accuracy:** in the Terms (new section 5), the About page, a new FAQ in the Quiz Master instructions, on Home, on the set-up page when AI-made or shared questions are chosen, in the Generate window, on the Question Bank panel and in the library rows. They say that content in languages other than English, the interface translations and generated banks were made with AI tools, must be checked and corrected before use with a public audience, and that the **theological accuracy of each question has not been checked: a Bible scholar should review a bank before wide release**.
- **Terms for the EU, UK and Switzerland** (sections 7 and 8, Terms version 2026-12): controller, purposes and legal bases, recipients, transfers, retention, rights, complaints, children, cookies and storage.
- **Usage analytics are opt-in:** a separate unticked box at sign-up, a one-time question for existing accounts (an older bundled agreement is switched off), and the switch in Settings.
- **Settings, Your data:** download everything the app holds for the account (device and cloud) and delete the account with its cloud data.
- **Contact form with email confirmation, on the free Spark plan (no server):** `contactProvider: "firebase"`. The person presses **Email me a confirmation link**; Firebase emails a one-time sign-in link to the address of the account (never to an address typed in the form); opening it signs them in again and brings them back to the form, which restores the message. The database rules then accept the message only if the sign-in is less than 10 minutes old, the email is the account's, and fewer than 3 messages were sent that day (the document id is user + day + 1..3). The messages are read in **Admin** (no email goes to the team on this plan). **Optional, Blaze plan only:** `contactProvider: "functions"` uses the Firebase Functions in `functions/` for a typed six-digit code and an email to the team.
- **Limits against abuse in the database rules:** at most 10 shared banks per Quiz Master (4 chunks each), 400 usage records per Quiz Master, and the contact message rule above. Optional **App Check** (`appCheckSiteKey` in the Firebase settings).
- **Translations:** 582 more interface texts in all 10 languages: every text of 12 words or fewer and all texts of the core screens (quiz set-up, running a quiz, final page, Home, Settings, sign-in, Quiz Builder, question banks, Bible Knowledge Base, Bible Brain, sharing, Admin, About, offline notes). **80% of the 917 interface texts are translated (738); the 179 longer help paragraphs are still English.** They were written with AI tools and need a native reader. `tools/i18n_report.js`, `tools/i18n_export.py --tier all` lists what is left.
- **Checks in the repository** (`tests/`, `functions/test/`, GitHub Action): build, version, translations (the number of translated texts cannot fall), accessibility, offline, banks, translation, sharing, contact, privacy, notices, server functions, rules. The site is published only when they pass. See `CONTRIBUTING.md`.
- **Modules** (`src/modules/`, `tools/check_modules.js`, `tools/modularize.js`): new code and the files for art, photo, sharing, translation and **question banks** are modules with declared dependencies; the number of names in the shared scope can only go down (525 names, 3,476 lines are left in 10 older files).

### Fixed
- **Keyboard focus stays inside pop-ups**, and returns to what opened them.
- **Offline:** the Excel reader, the sign-in libraries and the fonts are saved when the app is installed; Settings shows the state; a clear message when the Excel reader cannot load.
- The Firebase config text box had no label for screen readers.

### Changed
- Sharing: the id of a shared bank is the user id plus a place (`_s1` to `_s10`) and a `rev` code; the database rules in `private/firestore.rules` must be published again.
- Usage records are written into a ring of 400 per user.
- The contact form no longer uses Web3Forms or Formspree (removed); messages are stored in your Firebase project and shown in Admin.
- The version number is now 1.10.0.

## v1.9.0 - share question banks, free translation options

### Added
- **Share question banks** with other Quiz Masters (online accounts): **Share** on each bank (ISO code, note, confirmation; Bible verse text and unchecked questions are left out unless ticked), **Update shared copy**, **Stop sharing**. In the Bible Knowledge Base, **Import Additional Question Bank** lists the shared banks with language and ISO code, filter and search, and downloads one into the person's own offline banks. A bank taken from the server is not shared again. Admin: **Shared question banks** (hide, show, delete). New Firestore rules for `sharedBanks` (publish the updated `firestore.rules`); the Terms describe it.
- **Free translation options:** **Chrome or Edge on this computer** (no key, nothing leaves the computer) and **Google Gemini** (free AI Studio key); wrong item counts from an AI model are retried.
- The Generate window shows the **Old Testament and New Testament** counts. A Bible Brain download shows **Generate questions in <language> now** right under the list.
- The build now stops if two functions have the same name.

### Changed
- **Make questions** is now **Generate questions**. The Google note says the first 500,000 characters a month are free.
- The built-in bank is now built from **v6** (the same 1,390 questions as v5, plus a Statistics sheet).
- The version number is now 1.9.0.

### Fixed
- A name clash that stopped the analytics-sharing button working was found and removed before release.

## v1.8.0 - JSON question banks, questions in the language of a Bible text

### Added
- **Question bank library:** every bank is a JSON file kept in the app (IndexedDB, copied to the account when signed in). An Excel upload becomes a new JSON bank; JSON banks can be uploaded, downloaded (JSON or Excel), previewed, renamed, deleted and chosen in the quiz set-up (My question banks, then the bank). The built-in OBQ questions and the Starter set are JSON banks (read only). Saved set-ups remember the bank.
- **Make questions** (Bible Knowledge Base): the OBQ questions become a question bank in the language of an uploaded Bible text: references are looked up in that Bible, text is translated (Google Cloud Translation, Microsoft Translator, LibreTranslate with the Quiz Master's own key, or a person through Excel), the reference gets the Bible's book name, More to know is the actual verse text, and answers use the Bible's own wording where they can be matched. Test run, cost estimate, a translation cache that lets a stopped run continue, and a Review window (tap the words of the verse to use them as the answer).
- `tools/import_bank.py --json-out` writes a plain JSON bank file.

- **Offer after adding a Bible text:** right after a Bible text is uploaded or downloaded from Bible Brain, a button offers **Make questions in <language> now**. The full verse is kept in a translated bank only for the questions that need a check (smaller banks).
- The version number is now 1.8.0.

### Changed
- The Question Bank panel no longer has "Add to my existing bank" or "Delete my bank": each upload is its own bank (an earlier single bank stays as "My question bank (earlier upload)").
- The Terms mention the translation feature.

## v1.7.0 - About and Contact, winners' photo, Analytics report

### Added
- **About and Contact** page (`/about`, `/about/contact`) with a contact form that sends an email through a message service (Web3Forms, Formspree) or keeps the message in your Firebase project (listed in Admin, with a CSV download). The receiving address is never in the app. Spam checks inside the app: a question the person must answer, a hidden field, a minimum time, a limit of 3 messages an hour and 1 a minute, and length and link limits. Terms updated.
- **Winners' photo (optional)** on the final page: take a screenshot (online meetings), open the camera (front or back, with permission) or upload a photo from the gallery or computer; preview, then it is shown on the final page and added to the PDF report. Never saved or sent; forgotten when the next quiz ends.
- **Analytics Dashboard:** **Using OBQ since** and **Days using OBQ**, **Saved quiz set-ups**, and **Export to PDF** (an Analytics Report with the totals, languages and recent quizzes).

### Changed
- "Quizzes run" is now **Quizzes set up** (it counts every quiz that was set up and started).
- New Firestore rule for `contactMessages` (republish `firestore.rules`).

## v1.6.0 - verse pictures, share analytics, tidier Home

### Added
- **Verse of the Day pictures:** each verse is shown with an original vector illustration chosen for its theme (14 scenes, offline, no licences). Optional own images through `verseImages`.
- **Share my analytics with the developers (optional):** on the Analytics Dashboard, with a preview of exactly what is sent, **Send to the developers**, and **Withdraw**. Stored as one snapshot per Quiz Master in `analyticsShares/{user id}`; admins see them in **Admin, Shared analytics** with a CSV download. New Firestore rule (publish the updated `firestore.rules`). The Terms (version 2026-11) describe it.

### Changed
- **Home:** the items of the Quiz Builder and Quiz Results boxes are cards in two columns, like Run a quiz; **Account and help** has three columns (two or one on narrower screens).

## v1.5.0 - left sidebar, Quiz Results group

### Added
- **Left sidebar** of icon boxes on every inner page (not Home, not a running quiz): Home; Run a quiz (OBQ Lite, Demo Contest, Set up a quiz, My Quizzes); Quiz Builder (Quiz Builder, Question Bank, Bible Knowledge Base); Quiz Results (My Quiz Results, My Firebase Backup); Analytics Dashboard, Settings, Instructions (and Admin). Highlights the current page, opens on hover or keyboard focus to show the names, **Keep menu open** pins it (remembered), hidden below 900 px.

### Changed
- **Home:** Quiz Results is its own group (a box like Quiz Builder) with **My Quiz Results** and **My Firebase Backup**; **Account and help** keeps Analytics Dashboard, Settings and the instructions.

## v1.4.0 - Results and Analytics pages, tidier Home and Builder

### Changed
- **Home, Run a quiz:** OBQ Lite - Quick Quiz and Demo Contest on the first row; Set up a quiz and My saved quizzes on the second row.
- **Home, Quiz Builder box:** only Question Bank and Bible Knowledge Base. **Account and help** now holds Quiz Results, Analytics Dashboard, My Firebase Backup, Settings and the instructions.
- **Quiz Results** is its own page (`/results`): my quiz results (kept on this device) and My Firebase. The page "Set up your own Firebase" now goes **Back to Quiz Results** (or **Back to Instructions** when it was opened from there).
- **Analytics Dashboard** is its own page (`/analytics`), showing "Your activity on this device".
- **Test your presentation remote** moved from the Quiz Builder to **Settings** (`/settings/remote`).
- The **OBQ Quiz Builder** jump bar now has only Set up a quiz, Question bank and Bible Knowledge Base.
- Addresses: new `/results/firebase`, `/analytics`, `/settings/remote` and `/firebase-help`; the older `/builder/results`, `/builder/firebase`, `/builder/activity` and `/builder/remote` redirect to them.
- The instructions page no longer has a "Back to Quiz Builder" button (it has Home) and links to the Firebase set-up instructions.

### Added
- The **logo and name** in the top bar lead back to Home.
- **Quiz Results keeps its name** in the top bar on most desktop widths; items that show only an icon now show their name as a tip (hover, keyboard focus, or press and hold on a touch screen).

## v1.3.1 - Bible Brain instructions

### Added
- The Bible Brain section of the Bible Knowledge Base now has written instructions with links: more information at https://biblebrain.com/ and the free API key request at https://4.dbt.io/api_key/request, plus four short steps (request the key, paste it and load, choose a country and language, download a fileset). The Quiz Master instructions and the README link to them too.

## v1.3.0 - top navigation, page addresses, install

### Added
- **Top bar with icons** in the order Home, Instructions, My Quizzes, Quiz Results, Quiz Builder, language chooser, Settings, user name, My Profile, Sign out. It adapts to its width (full labels, compact, icons only).
- **Page addresses:** `/instructions`, `/settings`, `/profile`, `/my-quizzes`, `/results`, `/setup`, `/quick-quiz`, `/builder`, `/builder/questionbank`, `/builder/knowledge-base`, `/builder/results`, `/builder/firebase`, `/builder/activity`, `/builder/remote`. Direct links, bookmarks, reloads and the Back button work; an address opened before sign-in opens after it; Back never leaves a running quiz.
- **Install the app (PWA):** an Install button on the Home page and in Settings (Chrome, Edge, Android), instructions for iPhone and other browsers, and a status line that says whether the app is ready for offline use. Manifest shortcuts for My Quizzes, Quiz Builder and Settings.
- **Settings, Install and offline use:** what works without internet (quizzing, PDF and CSV, the timer, read aloud with an installed voice) and what needs internet (sending results to Firebase, cloud sync, Bible Brain downloads, usage counting).
- **OBQ Quiz Builder** (renamed) starts with a **Set up a quiz** box. **Activity** now totals the participants from the quiz set-ups, counts the languages used, and shows the questions in the question bank (yours and the built-in bank) and the Bible texts and books in the knowledge base. The Home page shows the participants total too.

### Changed
- "Bible text knowledge base" is now **Bible Knowledge Base**.
- The Bible Brain browser lists only **USX and USFM** filesets (it still says how many other text filesets, such as plain text, were found).

## v1.2.0 - very basic version

### Added
- **Basic version** (`python tools/assemble.py --basic` makes `dist/obq-basic.html`): a separate single file with no login, no Home page, no Terms, no Settings and no Firebase. Type your name, set up an OBQ Lite quick quiz, run the event, download a PDF. Works offline from a saved file. The GitHub Action publishes it at `/basic/`.
- The basic version's start page is translated into the 10 other interface languages (machine-prepared; please have them checked).

### Fixed
- The offline cache of the full app now ignores other pages on the same site (such as `/basic/`), so they can never replace the cached start page.

## v1.1.0 - stay signed in, offline sign-in, new Home page

### Added
- **Remember me on this device** at sign-in and sign-up: stay signed in until you sign out. For online accounts a salted password hash and a profile copy are kept on that device so the same email and password work **without internet** (the first sign-in still needs internet). **Forget this device** in Settings removes it.
- A remembered device starts without internet straight into the app, with a note that online features are paused.
- **Home page:** the menu is grouped into Run a quiz, one **Quiz Builder** box (Question Bank, Bible Text Knowledge Base, Quiz Results, Activity Dashboard, My Firebase Backup) and Account and help; a **Your events** panel (upcoming scheduled events with Start now, recent quizzes, numbers, a Getting started checklist and a daily tip); an optional **announcement** banner for an event or campaign.
- **Quiz Builder** has a jump bar to its sections.

### Changed
- If the profile cannot be loaded online, the copy saved on the device is used.
- Instructions for Quiz Masters and the README explain offline use.

## v1.0.1 - sign-in and Terms fixes

### Fixed
- **Sign-in after restarting the browser or computer:** if the page is set up for online accounts but the online sign-in service could not be reached in time (for example no network yet, or a blocker), the app used to switch silently to local accounts, where the online account does not exist, and showed "Email or password is incorrect". It now shows a clear box ("Cannot reach the online sign-in service") with **Try again** and **Continue offline**, retries by itself when the connection returns, waits longer and retries each library file once. The Firebase library is also cached for offline use.
- **Clearer messages:** local mode now says when no account with that email exists in this browser (and why), online mode explains accounts made in local mode or on another address, and the login page always shows which mode is active.
- The browser is asked to keep the site's data (so local accounts are less likely to be cleared).

### Changed
- **Terms and Conditions are accepted once, at sign-up.** Existing accounts are no longer asked to accept again at sign-in. (Optional: set `reacceptTerms: true` in `src/cfg1.js` to ask again whenever `termsVersion` changes.) Section 9 of the Terms was reworded accordingly.

## v1.0.0 - Oral Bible Quiz (OBQ), first public release

A web app for leading live Bible quizzes for groups who learn by listening. It is one installable page that also works offline, with 11 interface languages.

### Highlights
- **Home page** with an introduction, a Verse of the Day, a button for every feature and built-in instructions for Quiz Masters.
- **OBQ Lite** (a quick quiz with almost no setup) and a **Simple** quiz style for new Quiz Masters and children's groups; a **Demo Contest** to try every kind of question.
- **Read aloud** with the device's own voices, a voice picker and a fallback for Marathi and Nepali.
- **Settings** with an editable profile, theme (dark, light or device), font, text size, sound, read-aloud speed, keep-awake and an analytics on/off switch.
- **Terms and Conditions** accepted at sign-up in a read-first pop-up, including the analytics notice.

### Running a quiz
- A fixed question mix for 10, 20 or 30 questions: regular, multiple choice, trivia, 50:50, short answer with hints, Who am I?, multi-part and difficult (changeable in settings). Simple style uses only regular and multiple-choice questions at 1 point each.
- Step guide and tooltips explain what is missing at each step; points instructions for clue-based and multi-part questions.
- Timer with sound, full screen from the first question with an exit button, landscape layout that fits one screen.
- Keyboard and presentation-remote control, including `R` for read aloud.
- Individuals or Groups, names typed once and ticked later, live points table, undo of a point, "nobody answered".
- Results as **PDF** and **CSV**, kept on the Quiz Master's device, with an optional send to the Quiz Master's own Firebase project (step-by-step instructions inside the app).
- **Saved quizzes:** templates, scheduled events, frozen questions, **Start now**, **Open in setup**, and **Save this quiz to redo later**. The setup form clears after saving or finishing.

### Questions
- Built-in English bank of 1,390 questions covering all 66 books, shipped **encrypted** (`src/cfg3_bank.enc.json`), plus a plain-text sample of 198 questions.
- **Excel template** with the categories One answer, Multiple choice, Short answer with hints, Clue based and Multi-part, and the levels Regular, Trivia and Difficult; upload with row-by-row error reports.
- **Bible text knowledge base:** upload USFM, USFX, USX or plain text (or a zip), import a bundle, or use the **Bible Brain browser** (country, then language, then the USX and plain-text filesets, with a count of the others). Questions are generated as "complete the verse" and "which book".

### Accounts and privacy (optional Firebase)
- Local mode (no cloud) or Firebase: sign-up, sign-in, **forgot password**, **email-link (passwordless) sign-in**, email confirmation.
- Sign-in records, a count of quiz set-ups (no points, no names), saved quizzes and question-bank sync.
- Participant names and points stay on the device unless the Quiz Master sends them to their own Firebase project.
- **Admin screen** with usage counts and CSV downloads (admins only).

### Build and publishing
- Python build scripts in `tools/`; the app is built into one HTML file and an installable web app (`dist/`).
- GitHub Action that publishes with GitHub Pages.
- Secrets and private files stay out of the repository: Firebase config (`FIREBASE_CONFIG_JSON`), the key for the encrypted bank (`OBQ_BANK_KEY`) and the operator details for the Terms (`SITE_CONFIG_JSON`), or the local `private/` folder.
- Database security rules are not included in this repository: write rules for your own Firebase project (see "Firebase setup" in the README).

### Interface languages
English, Hindi, Malayalam, Odia, Tamil, Telugu, Punjabi, Bengali, Nepali, Urdu and Marathi. Labels that have no translation yet fall back to English.

### Known limits
- Read aloud depends on the voices installed on the device; some languages (for example Odia and Punjabi) have few voices.
- The Terms and Conditions are English only and are a draft: have them reviewed before launch.
- Some recently added labels are English only in the other interface languages.
- The Bible Brain browser was written from the public documentation and tested against a simulated service.
