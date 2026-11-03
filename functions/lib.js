"use strict";
/* The rules of the contact form, kept apart from Firebase so they can be tested on their own (node --test functions/test).
   Flow: the signed-in Quiz Master asks for a code -> we email a 6-digit code to the address of the ACCOUNT (never an address typed in the form) ->
   they send the message with the code -> we email the message to the team address kept in the function settings (never in the app or the repository). */
const crypto = require("crypto");
const TOPICS = ["info", "support", "problem", "idea", "feature", "other"];
const LIMITS = { codesPerDay: 5, codeGapSec: 60, codeTtlSec: 600, maxAttempts: 5, messagesPerDay: 3 };
class Fail extends Error { constructor(code, reason) { super(reason); this.code = code; this.reason = reason; } }   // code = a Firebase HttpsError code, reason = a short word the app understands
const dayKey = (ms) => new Date(ms).toISOString().slice(0, 10);
function maskEmail(e) { const [u, d] = String(e).split("@"); return (u.slice(0, 1) + "***@" + (d || "")); }
function newCode() { return String(crypto.randomInt(0, 1000000)).padStart(6, "0"); }
function hashCode(code, uid, secret) { return crypto.createHash("sha256").update(secret + ":" + uid + ":" + code).digest("hex"); }
function cleanInput(i) {
  const name = String((i && i.name) || "").trim(), message = String((i && i.message) || "").trim(), topic = String((i && i.topic) || "");
  if (name.length < 2 || name.length > 80 || !TOPICS.includes(topic) || message.length < 10 || message.length > 2000) throw new Fail("invalid-argument", "bad-message");
  if ((message.match(/https?:\/\/|www\./gi) || []).length > 2) throw new Fail("invalid-argument", "too-many-links");
  const meta = (i && i.meta) || {}; const s = (v, n) => String(v || "").slice(0, n);
  return { name, message, topic, meta: { org: s(meta.org, 80), country: s(meta.country, 60), appVersion: s(meta.appVersion, 20), uiLang: s(meta.uiLang, 8), browser: s(meta.browser, 160) } };
}
function needUser(ctx) {
  if (!ctx || !ctx.uid || !ctx.email) throw new Fail("unauthenticated", "sign-in");
  if (!ctx.emailVerified) throw new Fail("failed-precondition", "email-not-verified");
}
async function requestCode(ctx, deps) {
  needUser(ctx);
  const ref = deps.db.doc("contactOtp/" + ctx.uid), snap = await ref.get(), d = snap.exists ? snap.data() : {}, now = deps.now(), today = dayKey(now);
  const sentToday = d.day === today ? (d.count || 0) : 0;
  if (d.sentAt && now - d.sentAt < LIMITS.codeGapSec * 1000) throw new Fail("resource-exhausted", "wait");
  if (sentToday >= LIMITS.codesPerDay) throw new Fail("resource-exhausted", "daily-codes");
  const code = newCode();
  await ref.set({ hash: hashCode(code, ctx.uid, deps.secret), exp: now + LIMITS.codeTtlSec * 1000, attempts: 0, sentAt: now, day: today, count: sentToday + 1 });
  await deps.mail.send({ to: ctx.email, subject: "Your Oral Bible Quiz code: " + code,
    text: "Your one-time code is " + code + "\n\nIt works once and for " + (LIMITS.codeTtlSec / 60) + " minutes. Enter it in the contact form of the app to send your message.\nIf you did not ask for it, you can ignore this email." });
  return { ok: true, to: maskEmail(ctx.email), expiresInSec: LIMITS.codeTtlSec };
}
async function sendMessage(ctx, input, deps) {
  needUser(ctx);
  const m = cleanInput(input), code = String((input && input.code) || "").trim();
  if (!/^[0-9]{6}$/.test(code)) throw new Fail("invalid-argument", "wrong-code");
  const oref = deps.db.doc("contactOtp/" + ctx.uid), snap = await oref.get(), now = deps.now(), today = dayKey(now);
  if (!snap.exists) throw new Fail("failed-precondition", "code-expired");
  const o = snap.data();
  if (now > o.exp) { await oref.delete(); throw new Fail("failed-precondition", "code-expired"); }
  if ((o.attempts || 0) >= LIMITS.maxAttempts) throw new Fail("resource-exhausted", "too-many-attempts");
  const a = Buffer.from(hashCode(code, ctx.uid, deps.secret)), b = Buffer.from(o.hash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) { await oref.update({ attempts: (o.attempts || 0) + 1 }); throw new Fail("permission-denied", "wrong-code"); }
  const lref = deps.db.doc("contactLimits/" + ctx.uid), ls = await lref.get(), l = ls.exists ? ls.data() : {}, n = l.day === today ? (l.n || 0) : 0;
  if (n >= LIMITS.messagesPerDay) throw new Fail("resource-exhausted", "daily-messages");
  await deps.mail.send({ to: deps.to, replyTo: ctx.email, subject: "OBQ contact (" + m.topic + "): " + m.name,
    text: ["From: " + m.name + " <" + ctx.email + "> (confirmed with a one-time code)", "Topic: " + m.topic, "Organisation: " + (m.meta.org || "-") + "   Country: " + (m.meta.country || "-"),
      "App version: " + (m.meta.appVersion || "-") + "   Interface language: " + (m.meta.uiLang || "-"), "Browser: " + (m.meta.browser || "-"), "", m.message].join("\n") });
  await lref.set({ day: today, n: n + 1 }); await oref.delete();                                    // the code works once
  await deps.db.collection("contactLog").add({ uid: ctx.uid, at: now, topic: m.topic, size: m.message.length });      // a record without the text
  return { ok: true };
}
module.exports = { LIMITS, TOPICS, Fail, requestCode, sendMessage, hashCode, maskEmail, cleanInput };
