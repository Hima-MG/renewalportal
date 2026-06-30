"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Download, Loader2, XCircle, ZoomIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ScreenshotViewer } from "@/components/shared/screenshot-viewer";
import { TrackTimeline } from "@/components/track/track-timeline";
import { auth, updateRenewal } from "@/lib/firebase";
import { formatCurrency, formatDateTime } from "@/utils/format";
import type { RenewalRequest } from "@/types/renewal";

type RenewalDrawerProps = {
  renewal: RenewalRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PendingAction = "Approved" | "Rejected" | "Completed";

const ACTION_COPY: Record<
  PendingAction,
  { title: string; description: string }
> = {
  Approved: {
    title: "Approve this renewal?",
    description:
      "The student will be marked as approved. You can still mark it completed later.",
  },
  Rejected: {
    title: "Reject this renewal?",
    description: "The student's renewal request will be marked as rejected.",
  },
  Completed: {
    title: "Mark this renewal as completed?",
    description: "This confirms the renewal has been fully processed.",
  },
};

function currentActor(): string {
  return auth.currentUser?.email ?? auth.currentUser?.uid ?? "Finance Team";
}

export function RenewalDrawer({
  renewal,
  open,
  onOpenChange,
}: RenewalDrawerProps) {
  const [remarks, setRemarks] = useState("");
  const [loadedRequestId, setLoadedRequestId] = useState<string | null>(null);
  const [savingRemarks, setSavingRemarks] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [statusUpdating, setStatusUpdating] = useState<PendingAction | null>(
    null,
  );
  const [viewerOpen, setViewerOpen] = useState(false);

  // Reset the remarks draft whenever a different renewal is opened, without
  // clobbering in-progress edits when this renewal's live data refreshes.
  if (renewal && renewal.requestId !== loadedRequestId) {
    setLoadedRequestId(renewal.requestId);
    setRemarks(renewal.remarks);
  }

  if (!renewal) return null;

  // Status transitions: Completed is terminal (nothing changes it from
  // here); Rejected can still be corrected to Approved; Completed only
  // makes sense once a request has been Approved.
  const canApprove =
    renewal.status !== "Approved" && renewal.status !== "Completed";
  const canReject =
    renewal.status !== "Rejected" && renewal.status !== "Completed";
  const canComplete = renewal.status === "Approved";

  async function handleSaveRemarks() {
    if (!renewal) return;
    setSavingRemarks(true);
    const result = await updateRenewal(renewal.requestId, { remarks });
    setSavingRemarks(false);

    if (result.success) {
      toast.success("Remarks saved.");
    } else {
      toast.error(result.error);
    }
  }

  async function handleConfirmAction() {
    if (!renewal || !pendingAction) return;

    setStatusUpdating(pendingAction);

    const result = await updateRenewal(renewal.requestId, {
      status: pendingAction,
      ...(pendingAction === "Completed"
        ? { completedBy: currentActor() }
        : { verifiedBy: currentActor() }),
    });

    setStatusUpdating(null);
    setPendingAction(null);

    if (result.success) {
      toast.success(`Renewal marked as ${pendingAction}.`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle className="font-mono text-base">
              {renewal.requestId}
            </SheetTitle>
            <SheetDescription>
              Submitted {formatDateTime(renewal.createdAt)}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-4 pb-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={renewal.status} />
            </div>

            <section className="space-y-3">
              <h3 className="text-foreground text-sm font-medium">
                Student Details
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="text-right font-medium">
                  {renewal.studentName}
                </dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="text-right font-medium">{renewal.phone}</dd>
                <dt className="text-muted-foreground">Course</dt>
                <dd className="text-right font-medium">{renewal.course}</dd>
                <dt className="text-muted-foreground">Renewal Duration</dt>
                <dd className="text-right font-medium">
                  {renewal.renewalDuration}
                </dd>
              </dl>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-foreground text-sm font-medium">
                Transaction Details
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Transaction ID</dt>
                <dd className="text-right font-mono text-xs font-medium">
                  {renewal.transactionId}
                </dd>
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="text-right font-medium">
                  {formatCurrency(renewal.amount)}
                </dd>
                <dt className="text-muted-foreground">Payment Method</dt>
                <dd className="text-right font-medium">
                  {renewal.paymentMethod}
                </dd>
              </dl>
            </section>

            <Separator />

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-sm font-medium">
                  Payment Screenshot
                </h3>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setViewerOpen(true)}
                    disabled={!renewal.screenshotUrl}
                    aria-label="Zoom screenshot"
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={!renewal.screenshotUrl}
                    render={
                      renewal.screenshotUrl ? (
                        <a
                          href={renewal.screenshotUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Download screenshot"
                        />
                      ) : undefined
                    }
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
              </div>
              {renewal.screenshotUrl ? (
                <button
                  type="button"
                  onClick={() => setViewerOpen(true)}
                  className="bg-muted block w-full overflow-hidden rounded-xl border"
                >
                  <Image
                    src={renewal.screenshotUrl}
                    alt={`Payment screenshot for ${renewal.requestId}`}
                    width={640}
                    height={480}
                    unoptimized
                    className="h-auto w-full object-contain"
                  />
                </button>
              ) : (
                <div className="bg-muted text-muted-foreground flex h-40 w-full items-center justify-center rounded-xl border text-sm">
                  Screenshot unavailable.
                </div>
              )}
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-foreground text-sm font-medium">Timeline</h3>
              <TrackTimeline renewal={renewal} />
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 id="renewal-remarks-label" className="text-foreground text-sm font-medium">
                Remarks
              </h3>
              <Textarea
                id="remarks"
                aria-labelledby="renewal-remarks-label"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={3}
                placeholder="Add a note for this renewal..."
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveRemarks}
                disabled={savingRemarks}
              >
                {savingRemarks ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Remarks"
                )}
              </Button>
            </section>
          </div>

          <SheetFooter className="grid grid-cols-1 gap-2 border-t sm:grid-cols-3">
            <Button
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
              disabled={statusUpdating !== null || !canApprove}
              onClick={() => setPendingAction("Approved")}
            >
              {statusUpdating === "Approved" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Approve
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
              disabled={statusUpdating !== null || !canReject}
              onClick={() => setPendingAction("Rejected")}
            >
              {statusUpdating === "Rejected" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              Reject
            </Button>
            <Button
              disabled={statusUpdating !== null || !canComplete}
              onClick={() => setPendingAction("Completed")}
            >
              {statusUpdating === "Completed" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Mark Completed
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="sm:col-span-3"
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ScreenshotViewer
        src={viewerOpen ? renewal.screenshotUrl : null}
        alt={`Payment screenshot for ${renewal.requestId}`}
        fileName={`${renewal.requestId}-screenshot.jpg`}
        onClose={() => setViewerOpen(false)}
      />

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) setPendingAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction ? ACTION_COPY[pendingAction].title : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction ? ACTION_COPY[pendingAction].description : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingAction(null)}
              disabled={statusUpdating !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={statusUpdating !== null}
            >
              {statusUpdating !== null ? (
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
    </>
  );
}
