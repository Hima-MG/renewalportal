"use client";

import { auth } from "@/lib/firebase/auth";
import type { ServiceResult } from "@/types/result";
import type { CreateUserInput, UserProfile, UserRole } from "@/types/user";

async function authHeader(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResult<T>(response: Response): Promise<ServiceResult<T>> {
  const json = (await response.json().catch(() => null)) as {
    data?: T;
    error?: string;
  } | null;

  if (!response.ok || !json) {
    return {
      success: false,
      error: json?.error ?? "Something went wrong. Please try again.",
    };
  }

  return { success: true, data: json.data as T };
}

export async function fetchUsers(filters: {
  search?: string;
  role?: UserRole | "all";
}): Promise<ServiceResult<UserProfile[]>> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.role) params.set("role", filters.role);

  const response = await fetch(`/api/admin/users?${params.toString()}`, {
    headers: await authHeader(),
  });
  return parseResult<UserProfile[]>(response);
}

export async function createUser(
  input: CreateUserInput,
): Promise<ServiceResult<UserProfile>> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify(input),
  });
  return parseResult<UserProfile>(response);
}

export async function assignRole(
  uid: string,
  role: UserRole,
): Promise<ServiceResult<null>> {
  const response = await fetch(`/api/admin/users/${uid}/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ role }),
  });
  return parseResult<null>(response);
}

export async function removeRole(uid: string): Promise<ServiceResult<null>> {
  const response = await fetch(`/api/admin/users/${uid}/role`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  return parseResult<null>(response);
}

export async function setUserActiveStatus(
  uid: string,
  isActive: boolean,
): Promise<ServiceResult<null>> {
  const response = await fetch(`/api/admin/users/${uid}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({ isActive }),
  });
  return parseResult<null>(response);
}
