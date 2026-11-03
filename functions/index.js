"use strict";
/* Firebase Functions for the OBQ contact form.  Deploy:  cd functions && npm install && firebase deploy --only functions
   Settings (not in the repository):  firebase functions:secrets:set SMTP_PASS  and  CODE_SECRET ;  CONTACT_TO, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_FROM in functions/.env  (see README.md). */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString, defineBoolean } = require("firebase-functions/params");
const admin = require("firebase-admin"), nodemailer = require("nodemailer"), lib = require("./lib");
admin.initializeApp(); const db = admin.firestore();
const CONTACT_TO = defineString("CONTACT_TO"), SMTP_HOST = defineString("SMTP_HOST"), SMTP_PORT = defineString("SMTP_PORT", { default: "465" }), SMTP_USER = defineString("SMTP_USER"), SMTP_FROM = defineString("SMTP_FROM");
const SMTP_PASS = defineSecret("SMTP_PASS"), CODE_SECRET = defineSecret("CODE_SECRET"), ENFORCE_APP_CHECK = defineBoolean("ENFORCE_APP_CHECK", { default: false });
const opts = { secrets: [SMTP_PASS, CODE_SECRET], region: "us-central1", maxInstances: 5, enforceAppCheck: ENFORCE_APP_CHECK };
const ctx = (req) => ({ uid: req.auth && req.auth.uid, email: req.auth && req.auth.token && req.auth.token.email, emailVerified: !!(req.auth && req.auth.token && req.auth.token.email_verified) });
function deps() {
  const t = nodemailer.createTransport({ host: SMTP_HOST.value(), port: Number(SMTP_PORT.value()), secure: Number(SMTP_PORT.value()) === 465, auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() } });
  return { db: { doc: (p) => db.doc(p), collection: (p) => db.collection(p) }, now: () => Date.now(), secret: CODE_SECRET.value(), to: CONTACT_TO.value(), mail: { send: (m) => t.sendMail(Object.assign({ from: SMTP_FROM.value() }, m)) } };
}
const wrap = (fn) => async (req) => { try { return await fn(req); } catch (e) { if (e instanceof lib.Fail) throw new HttpsError(e.code, e.reason); console.error(e); throw new HttpsError("internal", "send-failed"); } };
exports.requestContactCode = onCall(opts, wrap((req) => lib.requestCode(ctx(req), deps())));
exports.sendContactMessage = onCall(opts, wrap((req) => lib.sendMessage(ctx(req), req.data, deps())));
