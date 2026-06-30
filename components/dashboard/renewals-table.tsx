"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

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
import { StatusBadge } from "@/components/dashboard/status-badge";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatDateTime,
  isThisWeek,
  isToday,
} from "@/utils/format";
import type { RenewalRequest, RenewalStatus } from "@/types/renewal";

const PAGE_SIZE = 10;

type QuickFilter = "all" | "today" | "week" | "pending" | "completed";
type SortOption = "latest" | "oldest" | "amount";

function isSortOption(value: string | null): value is SortOption {
  return value === "latest" || value === "oldest" || value === "amount";
}

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount", label: "Amount" },
];

type RenewalsTableProps = {
  renewals: RenewalRequest[];
  loading: boolean;
  onSelect: (renewal: RenewalRequest) => void;
  hideStatusQuickFilters?: boolean;
};

export function RenewalsTable({
  renewals,
  loading,
  onSelect,
  hideStatusQuickFilters = false,
}: RenewalsTableProps) {
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sort, setSort] = useState<SortOption>("latest");
  const [page, setPage] = useState(1);

  const visibleQuickFilters = hideStatusQuickFilters
    ? QUICK_FILTERS.filter((f) => f.value === "today" || f.value === "week")
    : QUICK_FILTERS;

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = renewals.filter((renewal) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        renewal.studentName.toLowerCase().includes(normalizedSearch) ||
        renewal.phone.toLowerCase().includes(normalizedSearch) ||
        renewal.transactionId.toLowerCase().includes(normalizedSearch) ||
        renewal.requestId.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) return false;

      switch (quickFilter) {
        case "today":
          return isToday(renewal.createdAt);
        case "week":
          return isThisWeek(renewal.createdAt);
        case "pending":
          return renewal.status === ("Pending" satisfies RenewalStatus);
        case "completed":
          return renewal.status === ("Completed" satisfies RenewalStatus);
        default:
          return true;
      }
    });

    const sorted = [...result];
    if (sort === "latest") {
      sorted.sort(
        (a, b) =>
          (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
      );
    } else if (sort === "oldest") {
      sorted.sort(
        (a, b) =>
          (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0),
      );
    } else {
      sorted.sort((a, b) => b.amount - a.amount);
    }

    return sorted;
  }, [renewals, search, quickFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Jump back to page 1 whenever the result set changes shape, derived
  // during render rather than via an effect.
  const resultsKey = `${search}:${quickFilter}:${sort}:${filtered.length}`;
  const [trackedResultsKey, setTrackedResultsKey] = useState(resultsKey);
  if (resultsKey !== trackedResultsKey) {
    setTrackedResultsKey(resultsKey);
    setPage(1);
  }

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, phone, request or transaction ID"
            aria-label="Search renewal requests"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={quickFilter === "all" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setQuickFilter("all")}
          >
            All
          </Button>
          {visibleQuickFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={quickFilter === filter.value ? "secondary" : "outline"}
              size="sm"
              onClick={() => setQuickFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}

          <Select
            value={sort}
            onValueChange={(v) => {
              if (isSortOption(v)) setSort(v);
            }}
          >
            <SelectTrigger size="sm" className="w-32" aria-label="Sort renewal requests">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  Sort: {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-background overflow-hidden rounded-2xl border shadow-sm">
        <div className="max-h-[28rem] overflow-auto">
          <Table>
            <TableHeader className="bg-background sticky top-0 z-10 shadow-[0_1px_0_0_var(--border)]">
              <TableRow className="hover:bg-transparent">
                <TableHead>Request ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 9 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No renewal requests found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((renewal) => (
                  <TableRow
                    key={renewal.requestId}
                    onClick={() => onSelect(renewal)}
                    className={cn("cursor-pointer")}
                  >
                    <TableCell className="text-primary font-mono text-xs font-medium">
                      {renewal.requestId}
                    </TableCell>
                    <TableCell className="font-medium">
                      {renewal.studentName}
                    </TableCell>
                    <TableCell>{renewal.phone}</TableCell>
                    <TableCell>{renewal.course}</TableCell>
                    <TableCell>{formatCurrency(renewal.amount)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {renewal.transactionId}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={renewal.status} />
                    </TableCell>
                    <TableCell>{formatDateTime(renewal.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(renewal);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
