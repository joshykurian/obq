import os, re
from harness import ROOT, ok
NAME = "database rules (static review; they still need a try in Firebase)"
def run(t):
    p = os.path.join(ROOT, "private", "firestore.rules")
    if not os.path.exists(p): print("   skipped - private/firestore.rules is not in this copy of the repository"); return
    s = open(p, encoding="utf-8").read()
    ok("no rule allows everything", not re.search(r"allow [a-z, ]+:\s*if\s+true", s))
    ok("no wildcard that opens all documents", "{document=**}" not in s)
    cm = re.search(r"match /contactMessages/\{id\} \{.*?\n    \}", s, re.S).group(0)
    ok("contact messages need a fresh sign-in (10 minutes), the account's own email and an id of user + today + 1 to 3", "auth_time" in cm and "token.email" in cm and "['1', '2', '3']" in cm and "request.time.day()" in cm and "allow update, delete: if false" in cm)
    ok("shared banks are limited to 10 places and 4 chunks", "_s([1-9]|10)" in s and "chunks <= 4" in s.replace("request.resource.data.", ""))
    ok("usage records are limited to a ring of 400 per user", "_([0-9]|[1-9][0-9]|[1-3][0-9][0-9])" in s)
    ok("an owner can delete their own account record (privacy rights)", re.search(r"match /quizMasters/\{uid\} \{.*?allow delete: if isOwner\(uid\)", s, re.S) is not None)
    ok("every write needs a confirmed email", s.count("verified()") >= 12)
    ok("no email address in the rules", not re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}", s))
