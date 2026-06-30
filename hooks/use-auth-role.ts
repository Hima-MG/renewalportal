"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase/auth";
import { isUserRole, type UserRole } from "@/types/user";

type AuthRoleState = {
  status: "loading" | "signed-out" | "ready";
  user: User | null;
  role: UserRole | null;
};

// Custom claims (not Firestore) are the source of truth here — this reads
// role straight off the ID token, refreshed on every auth state change.
export function useAuthRole(): AuthRoleState {
  const [state, setState] = useState<AuthRoleState>({
    status: "loading",
    user: null,
    role: null,
  });

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (!cancelled) {
          setState({ status: "signed-out", user: null, role: null });
        }
        return;
      }

      void user.getIdTokenResult().then((tokenResult) => {
        if (cancelled) return;
        const claimRole = tokenResult.claims.role;
        const role = isUserRole(claimRole) ? claimRole : null;
        setState({ status: "ready", user, role });
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return state;
}
