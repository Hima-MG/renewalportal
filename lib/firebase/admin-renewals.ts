import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import { toErrorMessage } from "@/lib/utils";
import type { ServiceResult } from "@/types/result";
import type { CreateRenewalInput } from "@/types/renewal";

const RENEWALS_COLLECTION = "renewal_requests";
const COUNTERS_COLLECTION = "counters";

// Generates sequential, human-readable request numbers like RN-20260001
// (RN- + year + 4-digit sequence). Runs entirely through the Admin SDK —
// counters/* is no longer reachable from any client, so this is the only
// place a request ID is ever minted, eliminating the race/permission
// problems that came from doing this as a client-side transaction.
export async function generateRequestIdAdmin(): Promise<ServiceResult<string>> {
  try {
    const year = new Date().getFullYear();
    const counterRef = getAdminDb()
      .collection(COUNTERS_COLLECTION)
      .doc(`renewal_${year}`);

    const requestId = await getAdminDb().runTransaction(async (transaction) => {
      const counterSnapshot = await transaction.get(counterRef);
      const nextSequence = counterSnapshot.exists
        ? (counterSnapshot.data()?.sequence as number) + 1
        : 1;

      transaction.set(counterRef, { year, sequence: nextSequence });

      return `RN-${year}${String(nextSequence).padStart(4, "0")}`;
    });

    return { success: true, data: requestId };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

// Writes the renewal_requests document via the Admin SDK. This bypasses
// firestore.rules entirely — callers are responsible for having already
// verified the requester's identity/role and for not trusting client input
// for createdBy/updatedBy/studentUid (see app/api/create-renewal).
export async function createRenewalDocumentAdmin(
  requestId: string,
  input: CreateRenewalInput,
): Promise<ServiceResult<null>> {
  try {
    await getAdminDb()
      .collection(RENEWALS_COLLECTION)
      .doc(requestId)
      .set({
        ...input,
        requestId,
        status: "Pending",
        remarks: input.remarks ?? "",
        verifiedBy: null,
        completedBy: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}
