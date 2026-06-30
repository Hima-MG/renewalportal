import { getFirestore, type Firestore } from "firebase/firestore";

import { firebaseApp } from "@/lib/firebase/config";

// See lib/firebase/auth.ts for why this is deferred to the browser.
export const db: Firestore =
  typeof window === "undefined"
    ? (new Proxy(
        {},
        {
          get(_target, prop) {
            throw new Error(
              `Firestore is client-only — "${String(prop)}" was accessed during server rendering.`,
            );
          },
        },
      ) as Firestore)
    : getFirestore(firebaseApp);
