import { getAuth, type Auth } from "firebase/auth";

import { firebaseApp } from "@/lib/firebase/config";

// Deferred to the browser. Next.js statically prerenders pages that import
// this module (via client components like the renewal form), which runs
// this file's top level in the build/server worker too — if env vars are
// ever missing there, getAuth() throws and takes the whole build down with
// it, not just the page that needed auth. Nothing in this codebase reads
// `auth.*` synchronously during render (only inside effects/handlers, which
// are browser-only), so this stub is never actually touched server-side.
export const auth: Auth =
  typeof window === "undefined"
    ? (new Proxy(
        {},
        {
          get(_target, prop) {
            throw new Error(
              `Firebase Auth is client-only — "${String(prop)}" was accessed during server rendering.`,
            );
          },
        },
      ) as Auth)
    : getAuth(firebaseApp);
