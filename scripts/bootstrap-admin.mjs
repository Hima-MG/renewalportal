// One-time bootstrap for the very first admin account.
//
// The in-app User Management page (Step 7) requires an existing admin to
// create further admin/finance users — so the first admin has to be
// created out-of-band, directly against the Admin SDK. Run this once per
// project, then manage everyone else from /dashboard/users.
//
// Usage:
//   npm run bootstrap:admin -- <email> <password> "<full name>"
//
// Requires the same FIREBASE_ADMIN_* env vars as the app — the npm script
// loads them from .env.local automatically (Node >= 20.6).

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const [, , email, password, name] = process.argv;

if (!email || !password || !name) {
  console.error(
    'Usage: node scripts/bootstrap-admin.mjs <email> <password> "<full name>"',
  );
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n",
);

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / " +
      "FIREBASE_ADMIN_PRIVATE_KEY in the environment.",
  );
  process.exit(1);
}

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});

const auth = getAuth(app);
const db = getFirestore(app);

const user = await auth.createUser({ email, password, displayName: name });
await auth.setCustomUserClaims(user.uid, { role: "admin" });

const now = FieldValue.serverTimestamp();
await db.collection("users").doc(user.uid).set({
  uid: user.uid,
  name,
  email,
  role: "admin",
  isActive: true,
  createdAt: now,
  updatedAt: now,
});

console.log(`Admin account created: ${email} (${user.uid})`);
