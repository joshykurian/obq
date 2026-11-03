# OBQ contact form: Firebase Functions (OPTIONAL: needs the Blaze plan)

> **On the free Spark plan you do not need this folder.** The app's default contact form (`contactProvider: "firebase"`) works without a server: Firebase emails a one-time confirmation link and the database rules enforce the limits. Use these functions only if you later move to the Blaze plan and want a typed six-digit code and an email to your team (`contactProvider: "functions"`).

The contact form of the app needs a server, because a limit or a code checked only inside a web page can be bypassed. These two functions do the checking:

* `requestContactCode` emails a six-digit code to the **registered email address of the signed-in account** (never to an address typed in the form). Limits: one code a minute, five a day.
* `sendContactMessage` checks the code (it works once, for ten minutes, five tries) and emails the message to your team address. Limit: three messages a day for each account. It keeps a log without the text (`contactLog`).

The team address, the mail server and the passwords are **settings of the function**, not part of the app or this repository.

## Set up (once)
1. Firebase console: switch the project to the **Blaze** plan (pay as you go; this volume costs almost nothing). Set a **budget alert** (Billing).
2. `npm install -g firebase-tools`, `firebase login`, then in this folder `npm install`.
3. Settings: create `functions/.env` (do not commit it):
   ```
   CONTACT_TO=the-team-address@example.org
   SMTP_HOST=smtp.example.org
   SMTP_PORT=465
   SMTP_USER=the-sending-account@example.org
   SMTP_FROM=OBQ <the-sending-account@example.org>
   ```
   Secrets: `firebase functions:secrets:set SMTP_PASS` and `firebase functions:secrets:set CODE_SECRET` (a long random text).
4. Deploy: `firebase deploy --only functions` (and publish `firestore.rules`).
5. In the app's private site settings (`private/site.config.json`, or the GitHub secret `SITE_CONFIG_JSON`) set `"contactProvider": "functions"` (and `"contactRegion"` if you changed the region), then build again.
6. Recommended: switch on **App Check** (see the main README) and set `ENFORCE_APP_CHECK=true` in `.env`.

## Test
`npm test` runs the rules of the form with a fake database and a fake mailer (no internet).
