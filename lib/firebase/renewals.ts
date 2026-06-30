import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { toErrorMessage } from "@/lib/utils";
import type { ServiceResult } from "@/types/result";
import type {
  CreateRenewalInput,
  RenewalRequest,
  RenewalStatus,
  UpdateRenewalInput,
} from "@/types/renewal";

const RENEWALS_COLLECTION = "renewal_requests";
const COUNTERS_COLLECTION = "counters";

function renewalsCollection() {
  return collection(db, RENEWALS_COLLECTION);
}

// Generates sequential, human-readable request numbers like RN-20260001
// (RN- + year + 4-digit sequence) using a per-year counter document so
// concurrent submissions never collide.
export async function generateRequestId(): Promise<ServiceResult<string>> {
  try {
    const year = new Date().getFullYear();
    const counterRef = doc(db, COUNTERS_COLLECTION, `renewal_${year}`);

    const requestId = await runTransaction(db, async (transaction) => {
      const counterSnapshot = await transaction.get(counterRef);
      const nextSequence = counterSnapshot.exists()
        ? (counterSnapshot.data().sequence as number) + 1
        : 1;

      transaction.set(counterRef, { year, sequence: nextSequence });

      return `RN-${year}${String(nextSequence).padStart(4, "0")}`;
    });

    return { success: true, data: requestId };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function createRenewal(
  requestId: string,
  input: CreateRenewalInput,
): Promise<ServiceResult<RenewalRequest>> {
  try {
    const docRef = doc(db, RENEWALS_COLLECTION, requestId);

    await setDoc(docRef, {
      ...input,
      requestId,
      status: "Pending" satisfies RenewalStatus,
      remarks: input.remarks ?? "",
      verifiedBy: null,
      completedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const created = await getDoc(docRef);
    const data = created.data();

    if (!data) {
      return { success: false, error: "Renewal request was not created." };
    }

    return {
      success: true,
      data: { ...data, requestId: created.id } as RenewalRequest,
    };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export type GetRenewalsFilters = {
  status?: RenewalStatus;
};

// Live-subscribes to the renewal_requests collection so dashboard views
// reflect Firestore writes (from this client or any other) immediately.
export function subscribeToRenewals(
  onData: (renewals: RenewalRequest[]) => void,
  onError: (error: string) => void,
  filters: GetRenewalsFilters = {},
): Unsubscribe {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

  if (filters.status) {
    constraints.push(where("status", "==", filters.status));
  }

  return onSnapshot(
    query(renewalsCollection(), ...constraints),
    (snapshot) => {
      const renewals = snapshot.docs.map(
        (snapshotDoc) =>
          ({
            requestId: snapshotDoc.id,
            ...snapshotDoc.data(),
          }) as RenewalRequest,
      );
      onData(renewals);
    },
    (error) => onError(toErrorMessage(error)),
  );
}

// Intentionally no subscribeToRenewalById / subscribeToLatestRenewalByPhone.
// Students have zero Firestore read access (see firestore.rules) — direct
// lookups by request ID or phone would let anyone enumerate other
// students' requests. The /api/track route (Admin SDK) is the only path
// that can resolve a renewal for a student, and only after it verifies
// requestId + trackingToken together.

export async function updateRenewal(
  requestId: string,
  input: UpdateRenewalInput,
): Promise<ServiceResult<null>> {
  try {
    await updateDoc(doc(db, RENEWALS_COLLECTION, requestId), {
      ...input,
      updatedAt: serverTimestamp(),
    });

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}
