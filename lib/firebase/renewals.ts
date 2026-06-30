import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/firestore";
import { toErrorMessage } from "@/lib/utils";
import type { ServiceResult } from "@/types/result";
import type {
  RenewalRequest,
  RenewalStatus,
  UpdateRenewalInput,
} from "@/types/renewal";

const RENEWALS_COLLECTION = "renewal_requests";

function renewalsCollection() {
  return collection(db, RENEWALS_COLLECTION);
}

// Backward compatibility: documents created before the "plan" ->
// "renewalDuration" rename only have "plan". Surface it as renewalDuration
// so the dashboard keeps displaying old requests correctly without a data
// migration.
function normalizeRenewal(
  requestId: string,
  data: DocumentData,
): RenewalRequest {
  return {
    ...data,
    requestId,
    renewalDuration: data.renewalDuration ?? data.plan ?? "",
  } as RenewalRequest;
}

export type GetRenewalsFilters = {
  status?: RenewalStatus;
};

// Live-subscribes to the renewal_requests collection so dashboard views
// reflect Firestore writes (from this client or any other) immediately.
//
// Intentionally no client-side createRenewal/generateRequestId here — both
// the counters/* transaction and the renewal_requests write now happen
// exclusively through app/api/create-renewal (Admin SDK). See that route
// for why: a client-side counter transaction required students to read
// and write counters/*, which is exactly the access this architecture
// removes.
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
      const renewals = snapshot.docs.map((snapshotDoc) =>
        normalizeRenewal(snapshotDoc.id, snapshotDoc.data()),
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
