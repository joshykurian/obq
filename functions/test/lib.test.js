"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), lib = require("../lib");
function world(start) {
  const data = new Map(), sent = []; let clock = start || Date.UTC(2026, 10, 3, 10, 0, 0);
  const doc = (p) => ({ get: async () => ({ exists: data.has(p), data: () => ({ ...data.get(p) }) }), set: async (v) => { data.set(p, { ...v }); }, update: async (v) => { data.set(p, { ...data.get(p), ...v }); }, delete: async () => { data.delete(p); } });
  const deps = { db: { doc, collection: (c) => ({ add: async (v) => { data.set(c + "/" + data.size, v); } }) }, now: () => clock, secret: "s3cret", to: "team@example.org", mail: { send: async (m) => { sent.push(m); } } };
  return { deps, data, sent, tick: (s) => { clock += s * 1000; }, ctx: { uid: "U1", email: "ann@example.org", emailVerified: true } };
}
const input = (code, extra) => Object.assign({ name: "Ann", topic: "support", message: "Please help me with the question bank upload.", code, meta: { org: "Youth", appVersion: "1.9.0" } }, extra);
const codeOf = (w) => /code: (\d{6})/.exec(w.sent[w.sent.length - 1].subject)[1];
test("the code goes to the registered address and only that", async () => {
  const w = world(); const r = await lib.requestCode(w.ctx, w.deps);
  assert.equal(w.sent.length, 1); assert.equal(w.sent[0].to, "ann@example.org"); assert.equal(r.to, "a***@example.org"); assert.match(w.sent[0].subject, /\d{6}/);
});
test("an unverified or signed-out user gets nothing", async () => {
  const w = world(); await assert.rejects(lib.requestCode({ ...w.ctx, emailVerified: false }, w.deps), { reason: "email-not-verified" });
  await assert.rejects(lib.requestCode({}, w.deps), { reason: "sign-in" }); assert.equal(w.sent.length, 0);
});
test("codes: one a minute, five a day", async () => {
  const w = world(); await lib.requestCode(w.ctx, w.deps); await assert.rejects(lib.requestCode(w.ctx, w.deps), { reason: "wait" });
  for (let i = 0; i < 4; i++) { w.tick(61); await lib.requestCode(w.ctx, w.deps); }
  w.tick(61); await assert.rejects(lib.requestCode(w.ctx, w.deps), { reason: "daily-codes" }); assert.equal(w.sent.length, 5);
});
test("a right code sends the message to the team, once", async () => {
  const w = world(); await lib.requestCode(w.ctx, w.deps); const code = codeOf(w);
  const r = await lib.sendMessage(w.ctx, input(code), w.deps); assert.equal(r.ok, true);
  const m = w.sent[w.sent.length - 1]; assert.equal(m.to, "team@example.org"); assert.equal(m.replyTo, "ann@example.org"); assert.match(m.text, /confirmed with a one-time code/);
  await assert.rejects(lib.sendMessage(w.ctx, input(code), w.deps), { reason: "code-expired" });          // the code cannot be used again
});
test("a wrong code is refused and five wrong tries lock the code", async () => {
  const w = world(); await lib.requestCode(w.ctx, w.deps);
  for (let i = 0; i < 5; i++) await assert.rejects(lib.sendMessage(w.ctx, input("000000"), w.deps), { reason: "wrong-code" });
  await assert.rejects(lib.sendMessage(w.ctx, input(codeOf(w)), w.deps), { reason: "too-many-attempts" }); assert.equal(w.sent.length, 1);
});
test("an old code does not work", async () => {
  const w = world(); await lib.requestCode(w.ctx, w.deps); const code = codeOf(w); w.tick(601);
  await assert.rejects(lib.sendMessage(w.ctx, input(code), w.deps), { reason: "code-expired" });
});
test("three messages a day, then no more", async () => {
  const w = world();
  for (let i = 0; i < 3; i++) { w.tick(61); await lib.requestCode(w.ctx, w.deps); await lib.sendMessage(w.ctx, input(codeOf(w)), w.deps); }
  w.tick(61); await lib.requestCode(w.ctx, w.deps); await assert.rejects(lib.sendMessage(w.ctx, input(codeOf(w)), w.deps), { reason: "daily-messages" });
  w.tick(86400); await lib.requestCode(w.ctx, w.deps); assert.equal((await lib.sendMessage(w.ctx, input(codeOf(w)), w.deps)).ok, true);    // a new day
});
test("bad messages are refused before anything is sent", async () => {
  const w = world(); await lib.requestCode(w.ctx, w.deps); const code = codeOf(w);
  await assert.rejects(lib.sendMessage(w.ctx, input(code, { message: "short" }), w.deps), { reason: "bad-message" });
  await assert.rejects(lib.sendMessage(w.ctx, input(code, { topic: "spam" }), w.deps), { reason: "bad-message" });
  await assert.rejects(lib.sendMessage(w.ctx, input(code, { message: "see http://a.com http://b.com http://c.com for more details" }), w.deps), { reason: "too-many-links" });
  assert.equal(w.sent.length, 1);
});
test("a code of another person does not work", async () => {
  const w = world(); await lib.requestCode(w.ctx, w.deps); const code = codeOf(w);
  await assert.rejects(lib.sendMessage({ ...w.ctx, uid: "U2", email: "ben@example.org" }, input(code), w.deps), { reason: "code-expired" });
});
