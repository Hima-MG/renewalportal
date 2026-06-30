import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { toErrorMessage } from "@/lib/utils";
import type { ServiceResult } from "@/types/result";
import {
  isUserRole,
  type CreateUserInput,
  type UserProfile,
  type UserRole,
} from "@/types/user";

const USERS_COLLECTION = "users";

// The only place in the codebase allowed to set a Firebase Auth custom
// claim. Custom claims — not the Firestore `users` doc — are the sole
// source of truth for authorization everywhere else (Firestore/Storage
// rules, API route guards).
export async function setUserRole(
  uid: string,
  role: UserRole,
): Promise<ServiceResult<null>> {
  try {
    await getAdminAuth().setCustomUserClaims(uid, { role });

    await getAdminDb()
      .collection(USERS_COLLECTION)
      .doc(uid)
      .set({ role, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function removeUserRole(
  uid: string,
): Promise<ServiceResult<null>> {
  try {
    await getAdminAuth().setCustomUserClaims(uid, { role: null });

    await getAdminDb()
      .collection(USERS_COLLECTION)
      .doc(uid)
      .set(
        { role: null, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function getUserRole(
  uid: string,
): Promise<ServiceResult<UserRole | null>> {
  try {
    const user = await getAdminAuth().getUser(uid);
    const claimRole = user.customClaims?.role;
    const role = isUserRole(claimRole) ? claimRole : null;
    return { success: true, data: role };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function setUserActive(
  uid: string,
  isActive: boolean,
): Promise<ServiceResult<null>> {
  try {
    await getAdminAuth().updateUser(uid, { disabled: !isActive });

    await getAdminDb()
      .collection(USERS_COLLECTION)
      .doc(uid)
      .set(
        { isActive, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

// Creates a Firebase Auth account (email/password) for an admin or finance
// user, assigns its role claim, and writes the Firestore profile doc.
// Students never go through this path — they self-claim anonymously.
export async function createUserWithRole(
  input: CreateUserInput,
): Promise<ServiceResult<UserProfile>> {
  try {
    const userRecord = await getAdminAuth().createUser({
      email: input.email,
      password: input.password,
      displayName: input.name,
    });

    await getAdminAuth().setCustomUserClaims(userRecord.uid, {
      role: input.role,
    });

    const now = FieldValue.serverTimestamp();
    await getAdminDb().collection(USERS_COLLECTION).doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: input.name,
      email: input.email,
      role: input.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      data: {
        uid: userRecord.uid,
        name: input.name,
        email: input.email,
        role: input.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export type ListUsersFilters = {
  search?: string;
  role?: UserRole | "all";
};

export async function listUsers(
  filters: ListUsersFilters = {},
): Promise<ServiceResult<UserProfile[]>> {
  try {
    const snapshot = await getAdminDb()
      .collection(USERS_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    let profiles = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: typeof data.name === "string" ? data.name : "",
        email: typeof data.email === "string" ? data.email : null,
        role: isUserRole(data.role) ? data.role : null,
        isActive: typeof data.isActive === "boolean" ? data.isActive : true,
        createdAt:
          data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      } satisfies UserProfile;
    });

    if (filters.role && filters.role !== "all") {
      profiles = profiles.filter((profile) => profile.role === filters.role);
    }

    if (filters.search) {
      const search = filters.search.trim().toLowerCase();
      profiles = profiles.filter(
        (profile) =>
          profile.name.toLowerCase().includes(search) ||
          (profile.email ?? "").toLowerCase().includes(search),
      );
    }

    return { success: true, data: profiles };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}
