export const USER_ROLES = ["admin", "finance", "student"] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Runtime guard for anything that ultimately comes from outside the type
// system — a custom claim, a query param, a Select's onValueChange — so we
// never have to `as UserRole` an unvalidated value.
export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

// Profile/display data only. Never used for authorization — that's always
// the Firebase Auth custom claim (token.role), checked server-side.
export type UserProfile = {
  uid: string;
  name: string;
  email: string | null;
  role: UserRole | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "student">;
};
