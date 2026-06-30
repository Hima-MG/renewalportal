import { getFirestore } from "firebase/firestore";

import { firebaseApp } from "@/lib/firebase/config";

export const db = getFirestore(firebaseApp);
