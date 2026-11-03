/* =====================================================================
   1. SETTINGS  -  the ONLY block you edit for name, look, language,
      date format, Firebase and analytics. (Questions are in block 3.)
   ===================================================================== */
var QUIZ_SETTINGS = {
  appName: "Oral Bible Quiz (OBQ)",   // shown at the top of every screen and in the installed app
  shortName: "OBQ",                    // short name under the installed app icon
  tagline: "",                        // optional small line under the app name
  logo: "@logo",                      // "@logo" = the OBQ logo from assets/ (embedded when you build). Or a data: URI / "logo.png" next to this file, or "" for none. Shown on screens and in the PDF
  edition: "full",                    // "full" = all features on the Home page. "lite" = OBQ Lite edition: only the quick quiz, the demo contest and the instructions
  requireLogin: true,                 // true = Quiz Masters must sign up / sign in first
  requireTerms: true,                 // true = new accounts must accept the Terms and Conditions (which include the analytics notice); existing accounts accept again when termsVersion changes
  bibleBrainKey: "",                  // optional: a Bible Brain API key (set in private/site.config.json or the env OBQ_BIBLE_BRAIN_KEY, never typed here). With it the Verse of the Day is fetched from Bible Brain in the interface language: the ESV in English and the IRV (Creative Commons) in the Indian languages. The key is visible in the page: use a key made for this app.
  votdCredits: {                      // shown under a verse fetched from Bible Brain; check each wording against the licence of the Bible
    esv: "Scripture quotations are from the ESV\u00AE Bible (The Holy Bible, English Standard Version\u00AE), \u00A9 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.",
    irv: "Indian Revised Version (IRV), licensed under Creative Commons CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), through Bible Brain."
  },
  verseImages: {},                    // optional: your own pictures for the Verse of the Day, as theme name -> image address, for example { cross: "pictures/cross.jpg" } (themes: cross, shepherd, book, stars, path, lamp, hills, tower, wings, globe, dove, sunrise, tree, door)
  appVersion: "1.10.0",                // sent with the optional "Share my analytics" snapshot, so the developers know which version it came from
  termsVersion: "2026-12",            // the version of src/terms.html that new accounts accept at sign-up (stored with the account)
  reacceptTerms: false,               // false = the Terms are accepted once, at sign-up. true = existing accounts must accept again when termsVersion changes
  operatorName: "",                   // shown in the Terms ("provided by ...") - fill in before launch, or set it in private/site.config.json
  contactEmail: "",                   // shown in the Terms as the contact for questions and data requests - or set it in private/site.config.json
  allowCoreExport: true,              // true = Quiz Masters can download the built-in OBQ questions as an Excel file (to translate them). false = no download
  contact: { provider: "", region: "us-central1" },   // the contact form needs the Firebase Functions in functions/ : set provider "functions" (and region) in private/site.config.json after you have deployed them
  announcement: { title: "", text: "", date: "", linkText: "", linkUrl: "" },   // optional notice on the Home page (an event, a campaign, news); leave empty for none. Or set it in private/site.config.json
  defaultTheme: "dark",               // "dark", "light" or "system"; each user can change it in Settings
  requireEmailVerification: true,     // true = a new account must confirm its email address (link sent by Firebase) before it can be used. Needs Firebase; local test mode cannot send email
  skipLoginButton: false,             // TESTING ONLY: true shows a "Skip login" button. Keep false for the live version
  defaultUiLang: "en",                // interface language on first open (code from the list below)
  defaultQuizLang: "en",              // quiz language on first open
  questionCounts: [10, 20, 30],       // choices on the setup page
  speechRate: 0.9,                    // speed of "Read aloud" (1 = normal, lower = slower)
  defaultSeconds: 30,                 // timer length when a question does not set its own
  /* Question mix. A quiz is built in this order, and the order repeats for longer quizzes (20 = twice, 30 = three times).
     Slots: regular (one answer) | mc (4 options) | mc50 (4 options, host can remove two wrong ones) | oneword (short answer with hints)
            who (Who am I?, clue by clue) | trivia | difficult | multi (2-3 parts, more points). Set useBlueprint:false for a random mix. */
  useBlueprint: true,
  blueprint: ["regular", "mc", "mc", "trivia", "mc50", "mc50", "oneword", "who", "multi", "difficult"],
  /* Simple quiz style: only regular and multiple-choice questions, 1 point each, no 50:50, no clues, no multi-part. Alternates in this order. */
  simpleBlueprint: ["regular", "mc"],
  defaultPoints: 1,                   // points for a normal question when it does not set its own
  dateOptions: { day: "numeric", month: "long", year: "numeric" },   // date format (month names follow the interface language)
  pdfFilePrefix: "obq-results",       // start of the PDF file name
  builtInBank: true,                  // true = offer the built-in starter questions (English)
  sampleQuizButton: true,             // true = show "Try the 5-question sample quiz" on the setup page
  colorsLight: {                      // the light-mode palette
    bg: "#FFF8F1", panel: "#FFFFFF", panelHi: "#FFEBD6", ink: "#2B1A0E", muted: "#6E5543",
    accent: "#C2410C", accentInk: "#FFFFFF", chip: "#C2410C", good: "#14795A", goodInk: "#FFFFFF", bad: "#C62828"
  },
  colors: {                           // Orange palette. Change any value to re-colour the whole app
    bg: "#1B1410", panel: "#2A1F18", panelHi: "#3A2B20", ink: "#FFF6EC", muted: "#D9C3AE",
    accent: "#F7931E", accentInk: "#2A1500", chip: "#D9480F", good: "#3DDBA4", goodInk: "#05281D", bad: "#FF6B6B"
  },
  /* Firebase (login, profile, question-bank sync and analytics). Leave apiKey empty = "local mode"
     (accounts and statistics stay on the device). Paste your Firebase web-app config to switch it on. */
  firebase: { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "", measurementId: "" },   // keep EMPTY in the public repository; real values go in private/firebase.config.json (see README)
  firebaseSdkVersion: "10.12.2"
};

/* Interface and quiz languages (dropdown order). font = CSS font family used for that script. */
var QUIZ_LANGUAGES = [
  { code: "en", english: "English",   native: "English",   locale: "en-GB", font: '"DM Sans"',              dir: "ltr" },
  { code: "hi", english: "Hindi",     native: "हिन्दी",      locale: "hi-IN", font: '"Noto Sans Devanagari"', dir: "ltr" },
  { code: "ml", english: "Malayalam", native: "മലയാളം",    locale: "ml-IN", font: '"Noto Sans Malayalam"',  dir: "ltr" },
  { code: "or", english: "Odia",      native: "ଓଡ଼ିଆ",       locale: "or-IN", font: '"Noto Sans Oriya"',      dir: "ltr" },
  { code: "ta", english: "Tamil",     native: "தமிழ்",      locale: "ta-IN", font: '"Noto Sans Tamil"',      dir: "ltr" },
  { code: "te", english: "Telugu",    native: "తెలుగు",     locale: "te-IN", font: '"Noto Sans Telugu"',     dir: "ltr" },
  { code: "pa", english: "Punjabi",   native: "ਪੰਜਾਬੀ",      locale: "pa-IN", font: '"Noto Sans Gurmukhi"',   dir: "ltr" },
  { code: "bn", english: "Bengali",   native: "বাংলা",      locale: "bn-IN", font: '"Noto Sans Bengali"',    dir: "ltr" },
  { code: "ne", english: "Nepali",    native: "नेपाली",     locale: "ne-NP", font: '"Noto Sans Devanagari"', dir: "ltr" },
  { code: "ur", english: "Urdu",      native: "اردو",       locale: "ur-PK", font: '"Noto Naskh Arabic"',    dir: "rtl" },
  { code: "mr", english: "Marathi",   native: "मराठी",      locale: "mr-IN", font: '"Noto Sans Devanagari"', dir: "ltr" }
];

/* Bible books (English names; the "Book" column of the Excel template uses exactly these names) */
var QUIZ_BOOKS_OT = "Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi".split("|");
var QUIZ_BOOKS_NT = "Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation".split("|");
