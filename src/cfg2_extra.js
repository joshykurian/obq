/* extra string added to every language: hidden-clue placeholder */
QUIZ_I18N.en.clueHid = "Clue {i} is hidden";
QUIZ_I18N.hi.clueHid = "संकेत {i} छिपा है";
QUIZ_I18N.ml.clueHid = "ക്ലൂ {i} മറച്ചിരിക്കുന്നു";
QUIZ_I18N.or.clueHid = "ସୂଚନା {i} ଲୁଚାଯାଇଛି";
QUIZ_I18N.ta.clueHid = "குறிப்பு {i} மறைக்கப்பட்டுள்ளது";
QUIZ_I18N.te.clueHid = "సూచన {i} దాచబడింది";
QUIZ_I18N.pa.clueHid = "ਸੰਕੇਤ {i} ਲੁਕਿਆ ਹੈ";
QUIZ_I18N.bn.clueHid = "সূত্র {i} লুকানো আছে";
QUIZ_I18N.ne.clueHid = "सङ्केत {i} लुकेको छ";
QUIZ_I18N.ur.clueHid = "اشارہ {i} چھپا ہوا ہے";
QUIZ_I18N.mr.clueHid = "सूचना {i} लपवलेली आहे";

/* Home button label */
QUIZ_I18N.hi.home = "होम";
QUIZ_I18N.ml.home = "ഹോം";
QUIZ_I18N.or.home = "ହୋମ୍";
QUIZ_I18N.ta.home = "முகப்பு";
QUIZ_I18N.te.home = "హోమ్";
QUIZ_I18N.pa.home = "ਹੋਮ";
QUIZ_I18N.bn.home = "হোম";
QUIZ_I18N.ne.home = "गृहपृष्ठ";
QUIZ_I18N.ur.home = "ہوم";
QUIZ_I18N.mr.home = "मुख्यपृष्ठ";

/* Bible text knowledge base, "other language", question prompts made from verses */
Object.assign(QUIZ_I18N.en, {
  langOther: "Other language (type it)", langOtherLbl: "Language name", errOtherLang: "Type the name of the language.",
  srcKB: "Questions generated from my Bible text", kbQ1: "Complete the verse:", kbQ2: "Which book is this verse from?",
  errNoKb: "No Bible text for this language yet. Add it in the Quiz Builder.", kbAvail: "Bible text found for {n} book(s) in this scope.",
  kbNone: "No Bible text found for this scope and language. Add it in the Quiz Builder.", kbInfoN: "{n} Bible text(s) added", kbEmpty: "No Bible text added yet.",
  kbTitle: "Bible Knowledge Base",
  kbIntro: "Add Bible text so the app can make questions from it in any language. Upload USFM, USFX, USX or plain-text files (or a zip of them), or download a fileset from Bible Brain with your API key and fileset ID. The text stays on this device.",
  kbLang: "Language of this Bible text", kbName: "Version name (optional)", kbFiles: "Upload Bible text files", kbFs: "Bible Brain fileset ID", kbKey: "Bible Brain API key",
  kbKeyNote: "The key is only used to fetch the files and is not saved.", kbDl: "Download from Bible Brain", kbBusy: "Reading files...", kbProg: "Downloading {a} of {b}...",
  kbDone: "Added {name}: {b} books, {v} verses.", kbNoBooks: "No Bible books were found in these files.", kbCount: "{b} books, {v} verses",
  kbPreview: "Preview questions", kbDelete: "Delete",
  kbBundle: "Import a Bible text bundle (.zip)", kbBundleDone: "Bundle imported: {n} Bible texts added.", kbBundleErr: "This is not a valid Bible text bundle (it needs a manifest.json).",
  kbErrNet: "The browser could not reach Bible Brain. This happens on the claude.ai link or without internet. Use the app on your own https site, or download the files with the desktop downloader (main.py) and upload them here.",
  kbErrKey: "Bible Brain refused the request (status {s}). Check the API key and the fileset ID.", kbNoIdb: "This browser could not store the Bible text (private browsing?)."
});
var KB_TR = {
  hi: ["मेरे बाइबल पाठ से बनाए गए प्रश्न", "अन्य भाषा (लिखें)", "वचन पूरा करें:", "यह वचन किस पुस्तक से है?"],
  ml: ["എന്റെ ബൈബിൾ പാഠത്തിൽ നിന്ന് തയ്യാറാക്കിയ ചോദ്യങ്ങൾ", "മറ്റൊരു ഭാഷ (ടൈപ്പ് ചെയ്യുക)", "വാക്യം പൂരിപ്പിക്കുക:", "ഈ വാക്യം ഏത് പുസ്തകത്തിലേതാണ്?"],
  or: ["ମୋ ବାଇବଲ ପାଠରୁ ତିଆରି ପ୍ରଶ୍ନ", "ଅନ୍ୟ ଭାଷା (ଲେଖନ୍ତୁ)", "ପଦ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ:", "ଏହି ପଦ କେଉଁ ପୁସ୍ତକରୁ?"],
  ta: ["என் வேதாகம உரையிலிருந்து உருவாக்கிய கேள்விகள்", "பிற மொழி (தட்டச்சு செய்யவும்)", "வசனத்தை நிறைவு செய்யவும்:", "இந்த வசனம் எந்த நூலில் உள்ளது?"],
  te: ["నా బైబిల్ పాఠం నుండి రూపొందించిన ప్రశ్నలు", "ఇతర భాష (టైప్ చేయండి)", "వచనాన్ని పూర్తి చేయండి:", "ఈ వచనం ఏ గ్రంథంలోది?"],
  pa: ["ਮੇਰੇ ਬਾਈਬਲ ਪਾਠ ਤੋਂ ਬਣਾਏ ਸਵਾਲ", "ਹੋਰ ਭਾਸ਼ਾ (ਲਿਖੋ)", "ਆਇਤ ਪੂਰੀ ਕਰੋ:", "ਇਹ ਆਇਤ ਕਿਸ ਪੁਸਤਕ ਦੀ ਹੈ?"],
  bn: ["আমার বাইবেল পাঠ থেকে তৈরি প্রশ্ন", "অন্য ভাষা (লিখুন)", "পদটি সম্পূর্ণ করুন:", "এই পদটি কোন পুস্তকের?"],
  ne: ["मेरो बाइबल पाठबाट बनाइएका प्रश्न", "अन्य भाषा (लेख्नुहोस्)", "पद पूरा गर्नुहोस्:", "यो पद कुन पुस्तकको हो?"],
  ur: ["میرے بائبل متن سے بنائے گئے سوالات", "دوسری زبان (لکھیں)", "آیت مکمل کریں:", "یہ آیت کس کتاب کی ہے؟"],
  mr: ["माझ्या बायबल मजकुरातून तयार केलेले प्रश्न", "इतर भाषा (लिहा)", "वचन पूर्ण करा:", "हे वचन कोणत्या पुस्तकातील आहे?"]
};
Object.keys(KB_TR).forEach(function (k) { var a = KB_TR[k]; QUIZ_I18N[k].srcKB = a[0]; QUIZ_I18N[k].langOther = a[1]; QUIZ_I18N[k].kbQ1 = a[2]; QUIZ_I18N[k].kbQ2 = a[3]; });

/* saving quiz results to the cloud (Firebase) */
Object.assign(QUIZ_I18N.en, {
  fSaveRes: "Send the results to my own Firebase when the quiz ends (includes participant names)",
  saveCloud: "Send results to my Firebase", resSaved: "Results sent to your Firebase.",
  resFail: "Could not send the results to your Firebase. Check the rules and Anonymous sign-in in your project, then tap the send button to try again."
});

/* saved quizzes: templates and scheduled events */
Object.assign(QUIZ_I18N.en, {
  savedTitle: "My saved quizzes", saveSetup: "Save for later", ssName: "Name for this saved quiz",
  ssTemplate: "Template: reuse it for other events (the date is not saved)", ssEvent: "Scheduled event: keep the date chosen above",
  ssFreeze: "Freeze the questions now (the same questions will be used on the day)", ssSave: "Save", ssUse: "Use", ssDelete: "Delete", ssSure: "Press again to delete",
  ssSaved: "Saved: {name}", ssLoaded: "Loaded: {name}.", ssTplBadge: "Template", ssToday: "Today", ssPast: "Past", ssFrozen: "questions frozen",
  ssQs: "{n} questions", ssUpcoming: "Coming up: {name} on {date}", ssTodayIs: "Today: {name}", ssFrozenNote: "Frozen questions will be used: {n}."
});

/* results history, CSV, the Quiz Master's own Firebase, and the admin screen */
Object.assign(QUIZ_I18N.en, {
  csvBtn: "Download results (CSV)", histTitle: "My quiz results (kept on this device)",
  histIntro: "Every finished quiz is kept here with its points list. Download it as CSV, or send it to your own Firebase. OBQ's own cloud never receives points or names.",
  histAll: "Download all results (CSV)", histEmpty: "No finished quizzes yet.", histLine: "{n} on the points list, winner: {w}, {q} questions", histSent: "sent to your Firebase",
  ownTitle: "My Firebase (for my quiz results)",
  ownIntro: "Paste or upload the firebaseConfig of your own Firebase project. Finished quizzes (event details and points list with names) are then sent to your project. OBQ's own cloud only counts that a quiz was set up. The config stays on this device.",
  ownConnect: "Connect", ownFile: "Upload config file", ownDisconnect: "Disconnect", ownNone: "Not connected.", ownOk: "Connected to project {p}.",
  ownNoAnon: "Anonymous sign-in could not be used. Enable it in your project (Authentication > Sign-in method), or change the rules below.",
  ownBad: "Could not find apiKey, projectId and appId in this text. Paste the whole firebaseConfig block.",
  ownSdkErr: "Could not load Firebase (blocked on this link, or no internet). Use the app on your own https site.",
  ownRulesNote: "In your project: create a Firestore database, enable Authentication > Sign-in method > Anonymous, and publish these rules (Firestore > Rules). Results go to the collection obq_results.",
  adminBtn: "Admin", adminTitle: "OBQ usage admin", admRefresh: "Refresh",
  admIntro: "Counts of quiz setups and Quiz Masters across the app. Points lists and participant names are not stored here.",
  admUsageCsv: "Download quiz setups (CSV)", admUsersCsv: "Download Quiz Masters (CSV)", admRecent: "Recent quiz setups (latest 50)", admUsers: "Quiz Masters (first 100)",
  admStatQM: "Quiz Masters", admStatSetups: "Quiz setups (loaded)", admStat30: "Setups in the last 30 days", admStatActive: "Active Quiz Masters (30 days)", admNoAccess: "No admin access, or the data could not be loaded."
});

Object.assign(QUIZ_I18N.en, { guideTitle: "Set up your own Firebase (optional)", ownHelp: "Step-by-step instructions", back2builder: "Back to Quiz Builder", guideCopy: "Copy the rules", guideCopied: "Copied." });

/* question kinds, tips and instructions for the Quiz Master */
Object.assign(QUIZ_I18N.en, {
  fifty: "50:50 - remove two wrong answers", lvTrivia: "Trivia", lvDifficult: "Difficult", exitFs: "Exit full screen", multiIntro: "Answer all the parts", hintLen: "{n} letters",
  tipGive0: "First press 'Show correct answer' (or Next on your remote). Then type the name(s) of who answered correctly and press Give points.",
  tipGive1: "Type the name(s) of who answered correctly (or tick names from earlier questions), then press Give points.",
  tipNext: "Next question unlocks after you show the correct answer and give points. If nobody answered correctly, press Next twice on your remote, or press Give points with no name.",
  step1: "Step 1: say the question, then show the correct answer.", step2: "Step 2: type the name(s) who answered correctly and give points. Nobody? Press Give points with no name.", step3: "Step 3: go to the next question.",
  ptsHelpWho: "Points depend on how early they answered. Tap the points for the clue they answered on: {list}.", ptsAfter: "{n} points = answered after clue {i}",
  ptsHelpParts: "Tap how many parts they answered correctly: {n} = all parts right, 1 = only one part right."
});
Object.assign(QUIZ_I18N.en, { catWord: "Short answer with hints", catMulti: "Multi-part", nextHint: "Next hint" });

/* quiz style, full screen hint, instructions page */
Object.assign(QUIZ_I18N.en, {
  styleTitle: "Quiz style", styleNormal: "Normal", styleSimple: "Simple", dStyle: "Quiz style",
  styleNormalD: "The full mix of 10 kinds of question: regular, multiple choice, 50:50, hints, Who am I, trivia, multi-part and difficult.",
  styleSimpleD: "Only regular and multiple-choice questions, 1 point each. No 50:50, no clues, no multi-part. Best for new Quiz Masters and children's groups.",
  exitFsHint: "Full screen: press Esc or click here to exit", helpBtn: "Instructions", qmGuideBtn: "Instructions for Quiz Masters", qmGuideTitle: "Instructions for Quiz Masters"
});

/* clearing the form, starting and redoing saved quizzes */
Object.assign(QUIZ_I18N.en, {
  ssStart: "Start now", ssOpen: "Open in setup", saveRedo: "Save this quiz to redo later",
  ssCleared: "The setup form was cleared. Your name is kept.", ssRedoSaved: "Saved: {name}. You can redo this quiz from My saved quizzes on the setup page."
});

/* email confirmation after sign-up */
Object.assign(QUIZ_I18N.en, {
  verifyTitle: "Confirm your email",
  verifyMsg: "We sent a confirmation link to {email}. Open that email (look in the spam or junk folder too), click the link, then come back and press the button below.",
  verifyDone: "I have confirmed my email", verifyResend: "Send the email again", verifyOut: "Use a different account",
  verifyNot: "Your email is not confirmed yet. Open the link in the email, then press the button again.",
  verifySent: "The confirmation email was sent again.", verifyWait: "Please wait a few minutes before asking for another email.", verifyFail: "Could not check your account. Please sign in again."
});

/* Bible Brain: country and language lists, text filesets */
Object.assign(QUIZ_I18N.en, {
  bbTitle: "Bible Brain (optional)",
  bbIntro: "Bible Brain is an online library of Bible texts. You can download its USX and USFM texts straight into your Bible Knowledge Base. You need a free API key.",
  bbLoad: "Load countries and languages", bbCountry: "Country", bbLangL: "Language", bbPickCountry: "Choose a country", bbPickLang: "Choose a language",
  bbLoading: "Loading from Bible Brain...", bbCountries: "{n} countries loaded.", bbLangsN: "{n} languages in this country.", bbNoLangs: "Bible Brain lists no languages for this country.",
  bbNone: "No text filesets were found for this language. Try another language, or enter a fileset ID below.", bbFound: "{n} text filesets found for {lang}.",
  bbColBible: "Bible", bbColType: "Type", bbColSize: "Contents", bbColId: "Fileset ID", bbDl: "Download",
  bbSizeC: "Whole Bible", bbSizeNT: "New Testament", bbSizeOT: "Old Testament", bbSizeP: "Partial",
  bbManual: "Or type a fileset ID yourself.", bbKeyNeeded: "Enter your Bible Brain API key first.", bbHttp: "Bible Brain answered with status {s}. Check the API key.",
  bbOther: "Other"
});
Object.assign(QUIZ_I18N.en, { kbNoFiles: "Bible Brain offered no downloadable files for this fileset (some text filesets can only be read online). Try another fileset, for example a USX or USFM one." });

/* Home page, Verse of the Day, OBQ Lite, new scope wording */
Object.assign(QUIZ_I18N.en, {
  homeWelcome: "Welcome, {name}",
  homeAbout: "Oral Bible Quiz (OBQ) helps you lead a live Bible quiz for groups who learn by listening. You say the question, the group answers aloud, and OBQ looks after the questions, the timer, the scores and the results.",
  homeA1: "Questions: the built-in English bank, your own Excel bank, or questions made from Bible text in your language.",
  homeA2: "Easy to run: a step guide on screen, presentation-remote keys and full screen for a projector.",
  homeA3: "Results: PDF and CSV, kept on your device, with an optional backup to your own Firebase.",
  homeNew: "New here? Try the Demo Contest, or start a quick quiz with OBQ Lite.",
  votdTitle: "Verse of the Day", votdNext: "Show another verse",
  hSetup: "Set up a quiz", hSetupD: "Choose the language, books, style and questions for your event.",
  hLite: "OBQ Lite - Quick Quiz", hLiteD: "Almost no setup: pick a language and the part of the Bible, then start in Simple style.",
  hDemo: "Demo Contest", hDemoD: "Try a ready-made 10-question quiz with every kind of question.",
  hSaved: "My saved quizzes", hSavedD: "Redo a saved quiz or start from a template.",
  hBuilder: "Quiz Builder", hBuilderD: "All your tools in one place.",
  hBank: "Question Bank", hBankD: "Download the Excel template and upload your own questions.",
  hKb: "Bible Knowledge Base", hKbD: "Add Bible text (USFM, USX or Bible Brain) and make questions from it.",
  hResults: "Quiz Results", hResultsD: "Download or send the results of finished quizzes.",
  hActivity: "Activity Dashboard", hActivityD: "See how many quizzes and questions you have run.",
  hOwn: "My Firebase Backup", hOwnD: "Optional: send your results to your own Firebase.",
  hHelp: "Quiz Master Instructions", hHelpD: "Step-by-step help for preparing and running a quiz.",
  hAdmin: "Admin: usage", hAdminD: "Quiz setups and Quiz Masters across the app.",
  liteTitle: "OBQ Lite - Quick Quiz", liteIntro: "Simple style: regular and multiple-choice questions, 1 point each. No clues, no 50:50, no multi-part. Choose and start.",
  liteName: "Quiz name (optional)", liteDefaultName: "Quick Quiz", liteScopeL: "Part of the Bible", liteOneBook: "or one book",
  liteNone: "There are no questions in this language yet. Choose English, or add Bible text or a question bank in the Quiz Builder.",
  aFinished: "Finished quizzes", aPeople: "Names on points lists", scMore2: "More than 2 books"
});
var MORE2 = { hi: "2 से अधिक पुस्तकें", ml: "2-ൽ കൂടുതൽ പുസ്തകങ്ങൾ", or: "2ରୁ ଅଧିକ ପୁସ୍ତକ", ta: "2-க்கும் மேற்பட்ட நூல்கள்", te: "2 కంటే ఎక్కువ గ్రంథాలు", pa: "2 ਤੋਂ ਵੱਧ ਪੁਸਤਕਾਂ", bn: "2টির বেশি পুস্তক", ne: "2 भन्दा बढी पुस्तक", ur: "2 سے زیادہ کتابیں", mr: "2 पेक्षा जास्त पुस्तके" };
Object.keys(MORE2).forEach(function (k) { QUIZ_I18N[k].scMore2 = MORE2[k]; });
QUIZ_I18N.en.styleNormalD = "The full mix of various kinds of question: regular, multiple choice, 50:50, hints, Who am I, trivia, multi-part and difficult.";

Object.assign(QUIZ_I18N.en, {
  bbFoundN: "{all} text filesets found for {lang}. {shown} shown (USX or USFM format).", bbOthers: "Not shown: {list}.",
  bbNoneShown: "{all} text filesets were found for {lang}, but none is in USX or USFM format. Types found: {list}."
});

/* read aloud */
Object.assign(QUIZ_I18N.en, {
  fRead: "Read each question aloud automatically (uses a voice for the quiz language on this device)",
  readAloud: "Read aloud", stopReading: "Stop reading",
  noVoice: "No voice for {lang} was found on this device, so the question may not be read correctly. Install a voice in the device's text-to-speech settings, or read the questions yourself."
});

/* sign-in with an email link (no password) and password reset */
Object.assign(QUIZ_I18N.en, {
  linkBtn: "Email me a sign-in link (no password needed)",
  linkSent: "We sent a sign-in link to {email}. Open the email on this device and click the link to sign in. Look in the spam folder too.",
  linkAskTitle: "Finish signing in", linkAsk: "Type the email address the sign-in link was sent to.", linkDone: "Finish signing in",
  errLinkOff: "Sign-in with an email link is not turned on in Firebase (Authentication, Sign-in method, Email/Password, then Email link).",
  errLinkDomain: "This website's address is not in the Authorized domains list of your Firebase project.",
  errLinkBad: "This sign-in link is not valid any more (it can be used once and expires). Please ask for a new link.",
  pfTitle: "Complete your profile", pfIntro: "You are signed in. Tell us a little about you to finish creating your Quiz Master account.", pfSave: "Continue",
  forgotHint: "Type your email address in the box above, then press Forgot password."
});

/* better read aloud for every language */
Object.assign(QUIZ_I18N.en, {
  voiceL: "Read aloud voice", voiceAuto: "Automatic (best voice found)", voiceOthers: "Other voices on this device", voiceTest: "Test voice",
  voiceFound: "{n} voice(s) for {lang} found on this device.",
  voiceNone: "No voice for {lang} is installed on this device. Install one (see Instructions, Read aloud) or choose another voice from the list.",
  voiceFallback: "No voice of its own was found, so a {from} voice is used instead.",
  noVoice: "No voice for {lang} was found on this device, so OBQ will not read this aloud (a wrong voice would be unintelligible). Install a voice for {lang} in the device's text-to-speech settings, or choose another voice on the setup page. See Instructions, Read aloud."
});
Object.assign(QUIZ_I18N.en, { voiceChosen: "Using the voice you chose." });

/* Terms and Conditions, Settings */
Object.assign(QUIZ_I18N.en, {
  termsAgree: "I have read and accept the Terms and Conditions, including the analytics notice.", termsRead: "Read the Terms and Conditions",
  termsTitle: "Terms and Conditions", termsVer: "Version {v}", termsReqIntro: "Please read and accept the Terms and Conditions to continue.",
  termsScroll: "Scroll to the end of the terms to enable the Accept button.", termsAccept: "I accept", termsDecline: "Decline and sign out", termsClose: "Close",
  termsOperatorDefault: "the operator of this app", termsContactDefault: "please use the contact details given on the website where you found this app.",
  errTerms: "Please read and accept the Terms and Conditions to create your account.",
  settingsBtn: "Settings", setTitle: "Settings", hSettings: "Settings", hSettingsD: "Theme, font, text size, sound, read-aloud speed and analytics.",
  setAppearance: "Appearance", setTheme: "Colour theme", themeDark: "Dark", themeLight: "Light", themeSystem: "Match my device",
  setFont: "Font", fontDefault: "Default (best for the language)", fontSystem: "System font", fontSerif: "Serif",
  setSize: "Text size", sizeS: "Small", sizeM: "Medium", sizeL: "Large", sizeXL: "Extra large",
  setQuiz: "Quiz and sound", setSoundL: "Play sounds (timer and answers)", setSpeedL: "Read-aloud speed", speedSlow: "Slow", speedNormal: "Normal", speedFast: "Fast",
  setWakeL: "Keep the screen awake during a quiz",
  setPrivacy: "Privacy", setAnalyticsL: "Share anonymous usage analytics to help improve OBQ",
  setAnalyticsNote: "This is the analytics notice in the Terms and Conditions. Turning it off does not remove your account details or the quiz set-up counts needed to run the service.",
  setAnalyticsLocal: "Analytics only runs when the app is connected to its online project. Your choice is saved with your account.",
  setAnalyticsOn: "Analytics is on.", setAnalyticsOff: "Analytics is off.", setTermsInfo: "You accepted the Terms and Conditions, version {v}.",
  setReset: "Reset settings to defaults", setResetDone: "Settings were reset."
});

Object.assign(QUIZ_I18N.en, {
  setProfile: "Your profile", setProfileSave: "Update profile", setProfileOk: "Your profile was updated.",
  setProfileErr: "Could not update your profile. Check your internet connection and try again.",
  setEmailNote: "Your email address is your sign-in and cannot be changed here. To change it, contact the administrators."
});

/* clearer sign-in messages */
Object.assign(QUIZ_I18N.en, {
  localNote: "Local mode: accounts are kept in this browser only, for this website address. Clearing the browser's data, or using another browser, device or web address, means the account will not be found.",
  onlineNote: "Online accounts: you can sign in from any device with the same email address.",
  errNoLocal: "No account with this email was found in this browser. Local-mode accounts exist only in the browser and website address where they were created. Create a new account here, or use the browser and address you signed up on.",
  errNoOnline: "No online account with this email exists yet. Create an account first.",
  errCredsOnline: "The email or password is not correct. If you created your account in local mode, on another website address, or before this site was connected online, that account does not exist here: create an account, or use \"Forgot password\" or \"Email me a sign-in link\"."
});

/* online sign-in service not reachable */
Object.assign(QUIZ_I18N.en, {
  fbDownTitle: "Cannot reach the online sign-in service",
  fbDown: "This app uses online accounts, but the connection to the sign-in service could not be made. Your account has not been lost.",
  fbDownHelp: "Check that you are connected to the internet (it can take a moment after starting a computer), and that no ad blocker, privacy extension or firewall blocks www.gstatic.com or googleapis.com. This page tries again by itself when the connection returns. \"Continue offline\" uses a separate local account on this device, which is not your online account.",
  fbRetry: "Try again", fbOfflineGo: "Continue offline (local account)"
});

/* Remember me, offline, Home groups and events, Builder navigation */
Object.assign(QUIZ_I18N.en, {
  rememberMe: "Remember me on this device: stay signed in until I sign out, and sign in again without internet. (Do not tick this on a shared computer.)",
  homeOffline: "You are working offline with the sign-in saved on this device. Online features (cloud sync, Bible Brain downloads, usage counting) work again when you open the app with internet.",
  setRememberedOn: "This device is remembered: you stay signed in until you sign out, and your email and password also work without internet.",
  setRememberedOff: "This device is not remembered: you will be asked to sign in again when the browser is closed.",
  setForget: "Forget this device (sign out and remove the saved sign-in)",
  hGroupRun: "Run a quiz", hGroupMore: "Account and help", hBuilderD: "Your question bank and your Bible Knowledge Base in one box.",
  jBank: "Question bank", jKb: "Bible Knowledge Base", jHist: "Results", jOwn: "My Firebase", jAct: "Activity", jRemote: "Remote test",
  evTitle: "Your events", evUpcoming: "Upcoming events", evNoUpcoming: "No event is planned. Set up a quiz and save it as a scheduled event.", evPlan: "Plan an event",
  evRecent: "Recent quizzes", evNoRecent: "No finished quiz yet.", evAll: "All results", evGlance: "At a glance",
  evToday: "today", evTomorrow: "tomorrow", evIn: "in {n} days", evLine: "{p} participants - {lang} - {n} questions", evWinners: "Winner: {w}", evNames: "{n} on the points list",
  ckTitle: "Getting started:", ck1: "Try the Demo Contest", ck2: "Add your own questions or Bible text", ck3: "Run your first quiz", ck4: "Save the results as PDF or CSV",
  tipLabel: "Tip:",
  tip1: "Read each question twice, slowly, and read the options as A, B, C, D.",
  tip2: "With a presentation remote, one button does Show answer, Give points and Next.",
  tip3: "Save an event as a template or scheduled event, then press Start now on the day.",
  tip4: "Use the Simple style the first time you lead a group, or when children take part.",
  tip5: "Press F for full screen and R to read a question aloud.",
  tip6: "Add Bible text in your language to make questions in that language.",
  tip7: "Type each name once; tick it from the list for the next questions.",
  tip8: "After a quiz, press Save this quiz to redo later to run the same questions again.",
  tip9: "Turn on Read aloud and use Test voice to pick a voice in your language.",
  tip10: "Check your sound and projector before the event with the Demo Contest.",
  tip11: "Download the results as CSV to keep a record in a spreadsheet.",
  tip12: "Choose a larger text size in Settings for a big room."
});

/* the very basic version */
Object.assign(QUIZ_I18N.en, {
  welcomeTitle: "Oral Bible Quiz", welcomeText: "A simple way to lead a Bible quiz for a group. Type your name, choose your quiz and start.",
  wName: "Your name", wGo: "Continue", errName: "Please type your name.", basicChange: "Change name"
});
Object.assign(QUIZ_I18N.en, { liteWho: "Quiz Master: {name}" });
/* the basic version's start page in the other interface languages (machine-prepared: please have a native speaker check) */
var BASIC_TXT = {
  hi: { welcomeText: "समूह के लिए बाइबल क्विज़ चलाने का एक सरल तरीका। अपना नाम लिखें, क्विज़ चुनें और शुरू करें।", wName: "आपका नाम", wGo: "आगे बढ़ें", errName: "कृपया अपना नाम लिखें।", basicChange: "नाम बदलें", liteWho: "क्विज़ मास्टर: {name}" },
  ml: { welcomeText: "ഒരു ഗ്രൂപ്പിനായി ബൈബിൾ ക്വിസ് നയിക്കാനുള്ള ലളിതമായ മാർഗം. നിങ്ങളുടെ പേര് ടൈപ്പ് ചെയ്യുക, ക്വിസ് തിരഞ്ഞെടുക്കുക, തുടങ്ങുക.", wName: "നിങ്ങളുടെ പേര്", wGo: "തുടരുക", errName: "ദയവായി നിങ്ങളുടെ പേര് ടൈപ്പ് ചെയ്യുക.", basicChange: "പേര് മാറ്റുക", liteWho: "ക്വിസ് മാസ്റ്റർ: {name}" },
  ta: { welcomeText: "ஒரு குழுவுக்கு பைபிள் வினாடி வினாவை நடத்த எளிய வழி. உங்கள் பெயரை உள்ளிட்டு, வினாடி வினாவைத் தேர்ந்தெடுத்து தொடங்குங்கள்.", wName: "உங்கள் பெயர்", wGo: "தொடரவும்", errName: "உங்கள் பெயரை உள்ளிடவும்.", basicChange: "பெயரை மாற்று", liteWho: "வினாடி வினா நடத்துநர்: {name}" },
  te: { welcomeText: "సమూహం కోసం బైబిల్ క్విజ్ నిర్వహించడానికి సులభమైన మార్గం. మీ పేరు టైప్ చేసి, క్విజ్‌ను ఎంచుకుని ప్రారంభించండి.", wName: "మీ పేరు", wGo: "కొనసాగించండి", errName: "దయచేసి మీ పేరు టైప్ చేయండి.", basicChange: "పేరు మార్చండి", liteWho: "క్విజ్ మాస్టర్: {name}" },
  bn: { welcomeText: "একটি দলের জন্য বাইবেল কুইজ পরিচালনার সহজ উপায়। আপনার নাম লিখুন, কুইজ বেছে নিন এবং শুরু করুন।", wName: "আপনার নাম", wGo: "চালিয়ে যান", errName: "অনুগ্রহ করে আপনার নাম লিখুন।", basicChange: "নাম পরিবর্তন", liteWho: "কুইজ মাস্টার: {name}" },
  mr: { welcomeText: "गटासाठी बायबल प्रश्नमंजुषा चालवण्याचा सोपा मार्ग. तुमचे नाव लिहा, प्रश्नमंजुषा निवडा आणि सुरू करा.", wName: "तुमचे नाव", wGo: "पुढे जा", errName: "कृपया तुमचे नाव लिहा.", basicChange: "नाव बदला", liteWho: "प्रश्नमंजुषा संचालक: {name}" },
  ne: { welcomeText: "समूहका लागि बाइबल क्विज सञ्चालन गर्ने सरल तरिका। आफ्नो नाम लेख्नुहोस्, क्विज छान्नुहोस् र सुरु गर्नुहोस्।", wName: "तपाईंको नाम", wGo: "जारी राख्नुहोस्", errName: "कृपया आफ्नो नाम लेख्नुहोस्।", basicChange: "नाम परिवर्तन", liteWho: "क्विज सञ्चालक: {name}" },
  ur: { welcomeText: "ایک گروپ کے لیے بائبل کوئز چلانے کا آسان طریقہ۔ اپنا نام لکھیں، کوئز منتخب کریں اور شروع کریں۔", wName: "آپ کا نام", wGo: "جاری رکھیں", errName: "براہ کرم اپنا نام لکھیں۔", basicChange: "نام تبدیل کریں", liteWho: "کوئز ماسٹر: {name}" },
  pa: { welcomeText: "ਗਰੁੱਪ ਲਈ ਬਾਈਬਲ ਕੁਇਜ਼ ਚਲਾਉਣ ਦਾ ਸੌਖਾ ਤਰੀਕਾ। ਆਪਣਾ ਨਾਮ ਲਿਖੋ, ਕੁਇਜ਼ ਚੁਣੋ ਅਤੇ ਸ਼ੁਰੂ ਕਰੋ।", wName: "ਤੁਹਾਡਾ ਨਾਮ", wGo: "ਜਾਰੀ ਰੱਖੋ", errName: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਨਾਮ ਲਿਖੋ।", basicChange: "ਨਾਮ ਬਦਲੋ", liteWho: "ਕੁਇਜ਼ ਮਾਸਟਰ: {name}" },
  or: { welcomeText: "ଏକ ଗୋଷ୍ଠୀ ପାଇଁ ବାଇବଲ କୁଇଜ୍ ପରିଚାଳନା କରିବାର ସରଳ ଉପାୟ। ଆପଣଙ୍କ ନାମ ଲେଖନ୍ତୁ, କୁଇଜ୍ ବାଛନ୍ତୁ ଏବଂ ଆରମ୍ଭ କରନ୍ତୁ।", wName: "ଆପଣଙ୍କ ନାମ", wGo: "ଜାରି ରଖନ୍ତୁ", errName: "ଦୟାକରି ଆପଣଙ୍କ ନାମ ଲେଖନ୍ତୁ।", basicChange: "ନାମ ବଦଳାନ୍ତୁ", liteWho: "କୁଇଜ୍ ମାଷ୍ଟର: {name}" }
};
Object.keys(BASIC_TXT).forEach(function (k) { Object.keys(BASIC_TXT[k]).forEach(function (key) { QUIZ_I18N[k][key] = BASIC_TXT[k][key]; }); });

/* navigation, builder, activity totals, install and offline */
Object.assign(QUIZ_I18N.en, {
  navQuizzes: "My Quizzes", navResults: "Quiz Results", navProfile: "My Profile",
  bSetupTitle: "Set up a quiz", bSetupText: "Start here. Choose the language, the books, the quiz style and the questions, then run your quiz. You can save a set-up to use again from My Quizzes.", bSetupBtn: "Set up your quiz", jSetup: "Set up a quiz",
  ssEmpty: "No saved quizzes yet. Set up a quiz and choose Save for later.",
  aParts: "Participants (from the quiz set-ups)", aLangs: "Languages used", aBankMine: "Questions in my question bank", aBankBuilt: "Built-in questions",
  aKbTexts: "Bible texts in my knowledge base", aKbBooks: "Bible books stored in them", aLangList: "Quiz languages used: {list}",
  homeA4: "Install it on your phone or computer and it runs offline.",
  homeInstallText: "Install OBQ on this device: it then opens like an app and runs offline.", installBtn: "Install OBQ on this device",
  setInstallTitle: "Install and offline use",
  installedYes: "OBQ is installed on this device. It opens like an app and runs offline.",
  installedNo: "OBQ can be installed on this device, so that it opens like an app and runs offline.",
  installIOS: "On an iPhone or iPad: tap the Share button in Safari, then Add to Home Screen.",
  installOther: "In Chrome or Edge: use the Install icon in the address bar, or the browser menu, then Install app. On Android: menu, then Install app or Add to Home Screen.",
  installNoPwa: "This copy of the app is a single page and cannot be installed. Open the hosted version of OBQ to install it, or save the page on your device to use it offline.",
  offReady: "Offline: ready. The app is saved on this device and opens without internet.", offNotReady: "Offline: not ready yet. Open the app once with internet and wait a moment.", offSingle: "Offline: a saved copy of this single page works without internet.",
  offWorksTitle: "What works without internet", offWork1: "Quizzing", offWork2: "PDF and CSV", offWork3: "The timer", offWork4: "Read aloud (with an installed voice)",
  offNeedsTitle: "What still needs internet", offNeed1: "Sending results to your Firebase", offNeed2: "Cloud sync", offNeed3: "Bible Brain downloads", offNeed4: "Usage counting",
  offNote: "The app must be installed or opened once online first."
});

/* Bible Brain instructions */
Object.assign(QUIZ_I18N.en, {
  bbMore: "More information:", bbKeyReq: "Request your free API key:",
  bbStep1: "Request your free API key at the address above (it is sent to your email) and copy it.",
  bbStep2: "Paste the key in the box below and press Load countries and languages.",
  bbStep3: "Choose a country, then a language. The USX and USFM filesets for that language are listed.",
  bbStep4: "Press Download next to a fileset to add it to your Bible Knowledge Base. Check the licence of each Bible version before you use it."
});

/* restructured pages: Quiz Results, Analytics Dashboard, remote test in Settings */
Object.assign(QUIZ_I18N.en, {
  resTitle: "Quiz Results", anTitle: "Analytics Dashboard", hAnalytics: "Analytics Dashboard", hAnalyticsD: "Participants, languages, quizzes, questions and your Bible texts at a glance.",
  hResults: "Quiz Results", hResultsD: "My quiz results on this device, downloads, and the backup to my own Firebase.",
  hOwn: "My Firebase Backup", hOwnD: "Optional: connect your own Firebase and send your results there.",
  jHist: "My quiz results", jOwn: "My Firebase", back2results: "Back to Quiz Results", back2guide: "Back to Instructions",
  remoteTitle: "Test your presentation remote"
});

/* Quiz Results group on Home, left sidebar */
Object.assign(QUIZ_I18N.en, {
  hGroupResults: "Quiz Results", hGroupResultsD: "Your finished quizzes and the backup to your own Firebase.",
  hResults: "My Quiz Results", hResultsD: "Your finished quizzes on this device: download them as PDF or CSV.",
  sbPin: "Keep menu open", sbUnpin: "Collapse menu"
});

/* optional: share my analytics with the developers */
Object.assign(QUIZ_I18N.en, {
  shareTitle: "Share my analytics with the developers (optional)",
  shareIntro: "You can send a snapshot of the numbers on this page to the developers of OBQ, to help them see how the app is used and improve it. Nothing is sent unless you press the button. Participant names, points and questions are never included. You can withdraw your shared snapshot at any time.",
  shareBtn: "Share my analytics", shareWithdraw: "Withdraw my shared analytics", sharePreviewTitle: "This is exactly what will be sent:",
  shareNote: "It is sent with your name, organisation and country, and replaces any snapshot you shared before.", shareSend: "Send to the developers", shareCancel: "Cancel",
  shName: "Name", shOrg: "Organisation", shCountry: "Country",
  shareNeedOnline: "Sharing needs an online account (sign in with the online accounts) and an internet connection.",
  shareLast: "You last shared your analytics on {date}.", shareDone: "Thank you. Your analytics were shared with the developers.", shareWithdrawn: "Your shared analytics were withdrawn.",
  shareFail: "Sorry, this could not be sent now. Check your internet connection and try again later.",
  admShares: "Shared analytics (from Quiz Masters)", admSharesNote: "Snapshots that Quiz Masters chose to share. The newest snapshot of each Quiz Master is kept.", admSharesCsv: "Download shared analytics (CSV)", admStatShares: "Quiz Masters who shared analytics"
});

/* winners' photo, analytics report */
Object.assign(QUIZ_I18N.en, {
  aQuizzes: "Quizzes set up", aSince: "Using OBQ since", aDays: "Days using OBQ", aSaved: "Saved quiz set-ups",
  anPdf: "Export to PDF", anPdfTitle: "Analytics Report", anPdfOverview: "Overview", anPdfLangs: "Quiz languages used", anPdfRecent: "Recent quizzes", anPdfGen: "Created on {date}",
  anPdfPriv: "This report contains only totals. Participant names and points are not included.", colDate: "Date", colQuiz: "Quiz", colPlayers: "Participants", colQs: "Questions", colWinner: "Winner",
  photoAsk: "Add a photo of the winners to the report (optional)", photoAdd: "Add photo", photoSkip: "Skip", photoChange: "Change photo", photoRemove: "Remove photo",
  phTitle: "Photo of the winners", phIntro: "Choose how to add a photo. It is shown on this page and added to the PDF report. This step is optional.",
  phShotT: "Take a screenshot", phShotD: "For online meetings: choose the meeting window or the screen that shows the winners.",
  phCamT: "Open the camera", phCamD: "Take a photo with this device's camera. The browser will ask for your permission.",
  phFileT: "Upload a photo", phFileD: "Choose a picture from the gallery of your phone or from your computer.",
  phPrivacy: "The photo stays on this device. It is not sent anywhere and is forgotten when the next quiz ends. Make sure the people in it agree to it being in the report.",
  phCancel: "Cancel", phBack: "Back", phFlip: "Switch camera", phUse: "Use this photo", phAgain: "Try again", phSnapPhoto: "Take photo", phSnapShot: "Take screenshot",
  phCamTitle: "Point the camera at the winners, then press Take photo.", phScreenTitle: "Choose the meeting window or the screen, then press Take screenshot.",
  phCamDenied: "The camera is blocked. Allow the camera for this site in your browser settings, or choose Upload a photo.", phCamFail: "The camera could not be opened on this device. You can choose Upload a photo instead.",
  phScreenFail: "The screen could not be captured. Allow screen sharing, or choose another option.", phFileFail: "That file could not be used. Please choose a picture (JPG or PNG).", phCamApp: "Use the phone's camera app instead"
});

/* About and contact */
Object.assign(QUIZ_I18N.en, {
  hAbout: "About and Contact", hAboutD: "What OBQ is, the version, and a form to ask for information or help.",
  abTitle: "About and Contact", abJump: "About", ctJump: "Contact us", abWhat: "About Oral Bible Quiz",
  abIntro: "Oral Bible Quiz (OBQ) is a free tool that helps you lead live Bible quizzes for groups who learn by listening. The Quiz Master says the question, the group answers aloud, and OBQ looks after the questions, the timer, the scores and the results.",
  abF1: "Quick quizzes (OBQ Lite) and fully set-up quizzes, with 11 interface languages.", abF2: "A built-in English question bank, your own questions from Excel, and questions made from Bible text in your language.",
  abF3: "Presentation-remote keys, full screen for a projector, and read aloud.", abF4: "PDF and CSV results, an optional photo of the winners in the report, and an optional backup to your own Firebase.",
  abF5: "Install it on your phone or computer and it runs offline.",
  abPrivTitle: "Your data in short", abPrivacy: "Your participants' names and points stay on your device. OBQ's own cloud only counts that a quiz was set up. You decide whether to share your analytics or to send results to your own Firebase.",
  abVersion: "Version {v}", abOperator: "Provided by {name}.", abTermsBtn: "Read the Terms and Conditions",
  ctTitle: "Contact us", ctIntro: "Need more information, or help with something? Send us a message and we will reply by email.", ctName: "Your name", ctEmail: "Your email address (for the reply)", ctTopic: "What is your message about?",
  ctT_info: "I need more information", ctT_support: "Support request (something does not work)", ctT_problem: "Report a problem", ctT_idea: "Suggestion or idea", ctT_feature: "Feature request", ctT_other: "Something else",
  ctText: "Your message", ctCount: "{n} / 2000",
  ctSendNote: "We also send the app version, your interface language and your browser type, to help us support you. We use your message and email address only to reply to you.",
  ctSend: "Send message", ctSending: "Sending...", ctDone: "Thank you. Your message was sent. We will reply to your email address.",
  ctNotReady: "The contact form is not set up on this site yet. Please try again later.", ctOffline: "You are offline. Please connect to the internet to send your message.",
  ctFail: "Sorry, your message could not be sent. Please try again later.", ctWait: "Please wait a minute before sending another message.",
  ctErrName: "Please enter your name.", ctErrEmail: "Please enter a valid email address.", ctErrText: "Please write a message of 10 to 2000 characters.",
  admContact: "Contact messages", admContactNote: "Messages sent with the contact form (only when the form keeps them in this Firebase project).", admContactCsv: "Download contact messages (CSV)"
});

/* the question bank library (JSON banks) */
Object.assign(QUIZ_I18N.en, {
  bankJsonNote: "A JSON bank is a plain text file of your questions. You can also upload a JSON bank, and download any bank again as JSON or Excel.",
  libTitle: "Question banks in this app (JSON files)", libName: "Name", libLang: "Language", libCount: "Questions", libSource: "From", libAdded: "Added",
  libCore: "OBQ questions (English)", libStarter: "OBQ Starter set (English)", libMain: "My question bank (earlier upload)", libMixed: "Several",
  libSrcBuilt: "Built in", libSrcExcel: "Excel file {f}", libSrcJson: "JSON file {f}", libSrcTr: "Translated, Bible text {b} ({e})", libSrcEarlier: "Earlier upload",
  libUse: "Use in a quiz", libPreview: "Preview", libRename: "Rename", libDelete: "Delete", libDeleteSure: "Click again to delete", libExcelTr: "Excel for translation", libReview: "Review ({n})",
  libEmpty: "No question banks yet. Upload an Excel or JSON file above.", libSaved: "Saved as the JSON question bank \u201C{name}\u201D with {n} questions.", libTooBig: "The bank \u201C{name}\u201D is too large to be copied to your account; it is kept on this device.",
  upErrJson: "That JSON file could not be read. It should be an OBQ question bank or a list of questions.", bankPickLbl: "Which question bank?"
});

/* questions in the language of a Bible text */
Object.assign(QUIZ_I18N.en, {
  trMake: "Generate questions", trTitle: "Generate a question bank from the OBQ questions", trIntro: "Bible text: {b} ({l}). The OBQ questions are put into this language, and the answers, the reference and the verse text come from this Bible text, so they use its own wording.",
  trBase: "Questions to start from", trCode: "Language code for the translation", trCodeNote: "For example hi, ml, ta, kn.", trEngine: "Translation by", trManual: "A person (Excel file, no service)",
  trKey: "Key of the service", trKeyOpt: "Key (only if your server needs one)", trRegion: "Region (for example centralindia)", trUrl: "Server address",
  trNote_google: "Google Cloud Translation: make an API key in your Google Cloud account (Cloud Translation API; billing must be switched on). The first 500,000 characters each month are free, then it costs about 20 US dollars for a million characters.",
  trNote_microsoft: "Microsoft Translator (Azure AI Translator): the free plan allows 2 million characters a month. Use the key and the region of your Translator resource.",
  trNote_libre: "LibreTranslate: the address of a LibreTranslate server (your own, or one you may use). Not every language is available.",
  trNote_manual: "No service is used. Download the English questions as an Excel file, have them translated by a person (or with any tool you trust), and upload the translated file. The app then adds the verse text and the Bible's own wording.",
  trTest: "Test run: only the first 20 questions (spread over the Bible)", trCover: "{n} of the {m} questions have all their verses in this Bible text. This run uses {k}.",
  trCost: "About {c} characters will be sent to the translation service.", trStart: "Generate the question bank", trManualNote: "Excel route:", trDlXl: "Download the English questions (Excel)", trUpXl: "Upload the translated Excel",
  trDlDone: "The Excel file was downloaded. Translate the Question, Option, Clue, Correct answer and Intro columns and keep the Reference column as it is, then upload it here.",
  trWorking: "Working...", trProgress: "Translated {d} of {t}", trStopping: "Stopping... what is already translated is kept.", trCancelJob: "Stop", trClose: "Close", trCancelled: "Stopped. What was translated is kept, so you can start again and continue.",
  trDone: "Saved the question bank \u201C{name}\u201D: {n} questions. {ok} use the Bible's own wording for the answers. {c} need a check.", trBankName: "OBQ questions in {l} ({b})", trTestTag: "test run",
  trNoItems: "No question has all its verses in this Bible text. Add more books of the Bible text first.", trErrCode: "Please enter the language code for the translation (for example hi).", trErrNoKey: "Please enter the key of the translation service.", trErrUrl: "Please enter the server address (starting with https://).",
  trErrKey2: "The service refused the key. Check the key (and region) and that the translation service is switched on in your account.", trErrBad: "The service did not accept the request. Check the language code.", trErrLimit: "The service says you have reached its limit. Wait a while and start again: what was translated is kept.",
  trErrNet: "The translation service could not be reached. Check your internet connection and try again: what was translated is kept.",
  trPrivacy: "The English question texts are sent to the translation service you choose, with your own key. The key is not saved. Machine translation needs a check by someone who knows the language.",
  rvTitle: "Check the questions: {name}", rvInfo: "{n} question(s) need a check. Compare with the English, correct the wording, and tap words in the verse to use the Bible's own wording as the answer (tap the first and the last word).", rvNone: "Nothing left to check.",
  rvEnglish: "English:", rvQuestion: "Question", rvIntro: "Introduction", rvAnswer: "Answer", rvOption: "Wrong option {n}", rvPartQ: "Part {n} question", rvPartA: "Part {n} answer", rvVerse: "The verse in this Bible:",
  rvOk: "This is fine", rvRemove: "Remove this question", rvSave: "Save changes", rvSaved: "Saved.", rvPrev: "Previous", rvNext: "Next", rvPage: "Page {a} of {b}"
});

/* offer to make questions right after a Bible text is added */
Object.assign(QUIZ_I18N.en, { trOfferText: "Next step: use this Bible text to generate the OBQ questions in {l}.", trOfferBtn: "Generate questions in {l} now" });

/* free translation options, Old / New Testament counts */
Object.assign(QUIZ_I18N.en, {
  trOptGemini: "Google Gemini (free plan, with a key)", trOptChrome: "Chrome or Edge on this computer (free, no key)", trModel: "Model name", trKeyGemini: "API key (from Google AI Studio)",
  trNote_gemini: "Google Gemini: make a free key in Google AI Studio (aistudio.google.com). The free plan has limits, and Google may use content sent on the free plan to improve its products, so a run can be slow and can pause when the limit is reached: what was translated is kept. If the model name stops working, use the name shown in AI Studio.",
  trNote_chrome: "Free, no key, and nothing leaves this computer. It works in Chrome (version 138 or later) or Edge on a computer, not on phones, and only for languages the browser can translate, for example Hindi, Bengali, Kannada, Marathi, Tamil and Telugu. The first time, the browser downloads the language pack.",
  trNote_chrome_no: "This browser cannot translate on the computer. Use Chrome (version 138 or later) or Edge on a computer, or choose another way.",
  trCostChrome: "Nothing is sent anywhere: the translation runs on this computer.", trChromeDl: "Downloading the language pack... {p}%",
  trErrChromeNo: "This browser cannot translate on the computer. Use Chrome (version 138 or later) or Edge on a computer, or choose another way.",
  trErrChromeLang: "This language cannot be translated on this computer. Choose another way.", trErrChromeGesture: "The browser did not allow the language pack download. Press the button again.",
  trErrChrome: "Translating on this computer did not work. Try again, or choose another way.", trErrGemini400: "Gemini did not accept the request. Check the key and the model name.",
  trSplit: "From this Bible text: Old Testament {a} questions, New Testament {b} questions."
});

/* sharing question banks with other Quiz Masters */
Object.assign(QUIZ_I18N.en, {
  shShare: "Share", shUpdate: "Update shared copy", shStop: "Stop sharing", shStopSure: "Click again to stop sharing", shTagShared: "Shared with other Quiz Masters", libSrcShared: "From the server, shared by {by} (language code {iso})",
  shTitle: "Share the question bank \u201c{name}\u201d", shInfo: "{n} questions in {l}. They are stored on the server so that other Quiz Masters can add them to their own question banks.",
  shIso: "Language code (ISO)", shIsoNote: "Two or three letters, for example hi, ml, ta, ne, bn.", shNotes: "A note for other Quiz Masters (optional)",
  shVerse: "Include the Bible verse text that is in the \u201cMore to know\u201d of these questions (only if you may share that Bible text)", shCheck: "Also share the {n} questions that still need a check",
  shWhat: "What is shared: the questions, the name of the bank, its language, your name and your organisation. Not shared: your email address, your results and your Bible text files. You can stop sharing at any time. An administrator may hide a bank that does not follow the Terms.",
  shConsent: "I wrote or translated these questions, or I may share them, and I allow other Quiz Masters to use them for free.", shSend: "Share with other Quiz Masters", shCancel: "Cancel", shSending: "Sharing...",
  shDone: "Shared: {n} questions are now available to other Quiz Masters.", shErrIso: "Please enter the language code (two or three letters, for example hi).", shErrConsent: "Please tick the box to confirm.",
  shErrNone: "There are no questions to share (questions that need a check are left out unless you tick the box).", shTooBig: "This bank is too big to share (up to 3,000 questions).",
  shFail: "Sorry, this could not be done now. Check your internet connection and try again.", shNoRules: "The server is not ready for shared question banks yet. The administrator needs to publish the updated database rules.",
  shStopped: "This bank is no longer shared. Your own copy is kept.", shNeed: "This needs an online account (sign in with the online accounts) and an internet connection.",
  imTitle: "Additional question banks on the server", imIntro: "Question banks that other Quiz Masters shared. Add one to your own offline question banks.", imOpen: "Import Additional Question Bank",
  imModalTitle: "Question banks shared by other Quiz Masters", imLangLabel: "Language", imFind: "Search", imLoading: "Loading the list...", imNone: "No question banks have been shared yet.", imCount: "{n} of {m} question banks",
  imAllLang: "All languages", imName: "Name", imLangCol: "Language (ISO code)", imQs: "Questions", imBy: "Shared by", imDate: "Date", imDetails: "Details", imGet: "Download to my question banks",
  imHave: "Already in your question banks", imMine: "Shared by you", imGetting: "Downloading \u201c{name}\u201d...", imAdded: "Added \u201c{name}\u201d ({n} questions) to your question banks.",
  imFail: "Sorry, this question bank could not be downloaded. Try again later.", imClose: "Close",
  shKindTr: "Translated from the OBQ questions (Bible text {b}, {e})", shKindExcel: "From an Excel file", shFlagged: "{n} still need a check", shHasVerse: "includes Bible verse text", shDownloads: "{n} downloads",
  admBanks: "Shared question banks", admBanksNote: "Question banks that Quiz Masters shared with others. Hide one to take it off the list without deleting it.", admStatBanks: "Shared question banks", admHide: "Hide", admShow: "Show"
});

/* offline */
Object.assign(QUIZ_I18N.en, {
  offExcelReady: "Excel upload and download work offline (the Excel reader is saved on this device).", offExcelNot: "The Excel reader is not saved yet. Open the app with internet and wait a moment, then Excel upload and download work offline.",
  xlsxOffline: "The Excel reader could not be loaded. Connect to the internet once, open the app and try again: after that it also works offline."
});

/* AI-generated content and accuracy */
Object.assign(QUIZ_I18N.en, {
  aiTitle: "Please note:", aiTag: "needs review (AI / machine translation)",
  homeAiNote: "Questions in languages other than English, including the demo questions, were generated with the help of AI tools. Check and correct them before you use them with a public audience. We have not checked the theological accuracy of each question: a Bible scholar should review a question bank before wide release.",
  abAiTitle: "Important: AI-generated content and accuracy",
  abAi1: "Some content in OBQ is created or translated with the help of AI tools and machine translation: the demonstration questions and other content in languages other than English, the translations of the screens and messages, and question banks made with Generate questions or shared by other Quiz Masters.",
  abAi2: "It can contain mistakes. Please read it, compare it with the Bible text and correct it before you use it with a public audience. You are responsible for what you present.",
  abAi3: "We have not checked the theological accuracy of each question. A Bible scholar should review a question bank before wide release.",
  setupAiNote: "These questions were generated or translated with AI tools or machine translation, or shared by another Quiz Master. Check and correct them before you use them with a public audience.",
  trAiNote: "AI and machine translation can make mistakes, and answers can look right and be wrong. Check and correct every question before you use it with a public audience. We have not checked the theological accuracy of each question: a Bible scholar should review a question bank before wide release.",
  bankAiNote: "Question banks that were generated, translated or shared by others can contain mistakes. Check them before you use them with a public audience. The theological accuracy of each question has not been checked: a Bible scholar should review a bank before wide release."
});

/* analytics choice */
Object.assign(QUIZ_I18N.en, {
  consCheck: "Allow anonymous usage analytics (optional; you can change this at any time in Settings)", consTitle: "Anonymous usage analytics",
  consText: "May we collect anonymous usage analytics (for example which screens are used and how many quizzes are started) to improve OBQ? Nothing is collected unless you say yes, and you can change your choice at any time in Settings.",
  consAllow: "Yes, allow", consDeny: "No, thank you"
});

/* contact form with a one-time code */
Object.assign(QUIZ_I18N.en, {
  ctEmail: "Your registered email address (the code and our reply go here)", ctCodeBtn: "Send me a code", ctResend: "Send a new code", ctCodeLabel: "The six-digit code from the email",
  ctCodeSent: "We sent a six-digit code to {to}. It works once and for 10 minutes. Enter it below to send your message.",
  ctSendNote: "To stop automatic and repeated messages we send a one-time code to the email address of your account first. We also send the app version, your interface language and your browser type, to help us support you. We use your message and email address only to reply to you. You can send up to 3 messages a day.",
  ctNeedOnline: "The contact form needs an online account (sign in with the online accounts) and an internet connection.",
  ctR_wait: "Please wait a minute before you ask for another code.", ctR_daily_codes: "You have asked for several codes today. Please try again tomorrow.",
  ctR_daily_messages: "You have already sent the most messages that one account may send in a day. Please try again tomorrow.", ctR_wrong_code: "That code is not right. Check the email and try again.",
  ctR_code_expired: "The code has run out or was already used. Press Send me a code to get a new one.", ctR_too_many_attempts: "Too many wrong tries. Press Send me a code to get a new one.",
  ctR_email_not_verified: "Please confirm your email address first (use the link in the confirmation email).", ctR_bad_message: "Please choose a topic and write a message of 10 to 2000 characters.",
  ctR_too_many_links: "Please remove some web links from your message (up to two are allowed).", ctR_sign_in: "Please sign in with your online account.", ctR_fail: "Sorry, this could not be done now. Please try again later."
});

Object.assign(QUIZ_I18N.en, { shSlotsFull: "You can share up to 10 question banks. Stop sharing one of them first." });

/* your data */
Object.assign(QUIZ_I18N.en, {
  mdTitle: "Your data", mdIntro: "Download a copy of the data that the app holds for your account: your profile, settings, finished quizzes, saved quizzes and question banks on this device, and, when you are signed in online, the records stored in the cloud (sign-ins, quiz set-up records, shared banks and shared analytics). Participant names and points are never stored in the cloud.",
  mdDownload: "Download my data", mdDelTitle: "Delete my account", mdDelText: "This deletes your account and the data stored for it in the cloud (profile, sign-in records, quiz set-up records, saved quizzes, saved and shared question banks, shared analytics) and the data of this account on this device. It cannot be undone. Download your data first if you want to keep it.",
  mdConfirmLabel: "Type DELETE to confirm", mdDelete: "Delete my account and data", mdPreparing: "Preparing your data...", mdDownloaded: "Your data was saved to a file.", mdDeleting: "Deleting...",
  mdConfirmNeed: "Please type DELETE to confirm.", mdRecent: "For your safety, please sign out, sign in again and try once more (deleting an account needs a recent sign-in). Some of your data may already be deleted.", mdFail: "Sorry, this could not be done now. Please try again later."
});

/* contact form on the free Firebase plan: a confirmation link instead of a typed code */
Object.assign(QUIZ_I18N.en, {
  ctLinkBtn: "Email me a confirmation link", ctLinkSent: "We sent a confirmation link to {to}. Open it in this browser: it signs you in again and brings you back here, and then you can send your message within 9 minutes.",
  ctConfirmed: "Your email is confirmed. You can send your message now (within 9 minutes).",
  ctSendNote2: "To stop automatic and repeated messages we email a one-time confirmation link to the address of your account first. We also send the app version, your interface language and your browser type, to help us support you. We use your message and email address only to reply to you. You can send up to 3 messages a day.",
  ctR_not_sent: "The message was not sent: either you have already sent 3 messages today, or the email confirmation is more than 9 minutes old. Please confirm again, or try tomorrow."
});

/* translation services: how to get a key, and what each one costs */
Object.assign(QUIZ_I18N.en, {
  trHowTitle: "How to get a key for this service", trHowOpen: "Open the website of this service (new tab)",
  trHowPrivacy: "Keep your key private: do not share it, and do not paste it anywhere except this box. The app does not save it. Prices and free allowances change: check the service's own page before you start.",
  trOptGoogle: "Google Cloud Translation (Limited free, then paid: 500,000 characters a month free, billing needed)",
  trOptMicrosoft: "Microsoft Translator on Azure (Limited free, then paid: 2 million characters a month free)",
  trOptGemini: "Google Gemini (Limited free, key from Google AI Studio)", trOptChrome: "Chrome or Edge on this computer (Free, no key)",
  trOptLibre: "LibreTranslate (Free on your own server)", trManual: "A person with an Excel file (Free, no service)",
  trHow_gemini_1: "Open Google AI Studio (button below) and sign in with a Google account.",
  trHow_gemini_2: "Press Get API key, then Create API key, and choose or create a project.",
  trHow_gemini_3: "Copy the key and paste it in the key box above. Keep the model name as it is; if it stops working, use the model name shown in AI Studio.",
  trHow_google_1: "Open the Google Cloud console (button below), sign in and create a project.",
  trHow_google_2: "Switch on billing for the project (a payment card is needed; the first 500,000 characters each month are free, after that the service is paid).",
  trHow_google_3: "Open APIs and services, then Library, search for Cloud Translation API and press Enable.",
  trHow_google_4: "Open APIs and services, then Credentials, press Create credentials, then API key, and copy the key.",
  trHow_google_5: "Recommended: restrict the key to the Cloud Translation API, then paste it in the key box above.",
  trHow_microsoft_1: "Open the Azure portal (button below) and sign in (a free Azure account asks for a card to confirm who you are).",
  trHow_microsoft_2: "Press Create a resource, search for Translator, and press Create.",
  trHow_microsoft_3: "Choose the Free pricing tier (F0: 2 million characters a month free) and a region near you, then create it.",
  trHow_microsoft_4: "Open the resource, then Keys and Endpoint. Copy KEY 1 into the key box above and the region (for example centralindia) into the Region box.",
  trHow_libre_1: "Use a LibreTranslate server that you run yourself (free software; see libretranslate.com) or one that you are allowed to use. Public servers may ask for a paid key.",
  trHow_libre_2: "Type the server address (starting with https://) in the box above. Type a key only if the server asks for one."
});
