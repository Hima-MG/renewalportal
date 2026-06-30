export { firebaseApp } from "@/lib/firebase/config";
export { auth } from "@/lib/firebase/auth";
export { db } from "@/lib/firebase/firestore";
export {
  generateRequestId,
  createRenewal,
  subscribeToRenewals,
  updateRenewal,
  type GetRenewalsFilters,
} from "@/lib/firebase/renewals";
