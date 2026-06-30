"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddUserSheet } from "@/components/admin/add-user-sheet";
import {
  assignRole,
  fetchUsers,
  removeRole,
  setUserActiveStatus,
} from "@/lib/api/admin-users";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/format";
import {
  isUserRole,
  USER_ROLES,
  type UserProfile,
  type UserRole,
} from "@/types/user";

type PendingAction =
  | { type: "assignRole"; uid: string; name: string; role: UserRole }
  | { type: "removeRole"; uid: string; name: string }
  | { type: "setActive"; uid: string; name: string; isActive: boolean };

const ROLE_STYLES: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  finance: "bg-blue-100 text-blue-700",
  student: "bg-slate-100 text-slate-700",
};

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);
  const latestRequestId = useRef(0);

  const loadUsers = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    const result = await fetchUsers({ search, role: roleFilter });

    // Ignore stale responses: if the user kept typing/filtering after this
    // request went out, a newer request's result should win instead.
    if (requestId !== latestRequestId.current) return;

    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setUsers(result.data);
  }, [search, roleFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => void loadUsers(), 300);
    return () => clearTimeout(timeout);
  }, [loadUsers]);

  const pendingCopy = useMemo(() => {
    if (!pendingAction) return null;
    switch (pendingAction.type) {
      case "assignRole":
        return {
          title: `Assign "${pendingAction.role}" to ${pendingAction.name}?`,
          description: "This immediately changes what this user can access.",
        };
      case "removeRole":
        return {
          title: `Remove role from ${pendingAction.name}?`,
          description: "They will lose all dashboard access until reassigned.",
        };
      case "setActive":
        return {
          title: `${pendingAction.isActive ? "Enable" : "Disable"} ${pendingAction.name}?`,
          description: pendingAction.isActive
            ? "They will be able to sign in again."
            : "They will be immediately signed out and blocked from signing in.",
        };
    }
  }, [pendingAction]);

  async function handleConfirm() {
    if (!pendingAction) return;
    setActionLoading(true);

    const result =
      pendingAction.type === "assignRole"
        ? await assignRole(pendingAction.uid, pendingAction.role)
        : pendingAction.type === "removeRole"
          ? await removeRole(pendingAction.uid)
          : await setUserActiveStatus(
              pendingAction.uid,
              pendingAction.isActive,
            );

    setActionLoading(false);
    setPendingAction(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Updated successfully.");
    void loadUsers();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            aria-label="Search users"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={roleFilter}
            onValueChange={(value) =>
              setRoleFilter(isUserRole(value) ? value : "all")
            }
          >
            <SelectTrigger size="sm" className="w-36" aria-label="Filter by role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {USER_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="size-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="bg-background overflow-hidden rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.role ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent font-medium capitalize",
                          ROLE_STYLES[user.role],
                        )}
                      >
                        {user.role}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        No role
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-transparent font-medium",
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700",
                      )}
                    >
                      {user.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Select
                        value={user.role ?? undefined}
                        onValueChange={(value) => {
                          if (!isUserRole(value)) return;
                          setPendingAction({
                            type: "assignRole",
                            uid: user.uid,
                            name: user.name,
                            role: value,
                          });
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          className="w-28"
                          aria-label={`Set role for ${user.name}`}
                        >
                          <SelectValue placeholder="Set role" />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!user.role}
                        onClick={() =>
                          setPendingAction({
                            type: "removeRole",
                            uid: user.uid,
                            name: user.name,
                          })
                        }
                      >
                        Remove
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPendingAction({
                            type: "setActive",
                            uid: user.uid,
                            name: user.name,
                            isActive: !user.isActive,
                          })
                        }
                      >
                        {user.isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddUserSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => void loadUsers()}
      />

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCopy?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingAction(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
