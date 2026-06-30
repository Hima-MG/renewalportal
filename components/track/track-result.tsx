import Image from "next/image";
import { Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TrackTimeline } from "@/components/track/track-timeline";
import { formatDateTime, timestampToDate } from "@/utils/format";
import type { TrackedRenewal } from "@/types/renewal";

function estimatedCompletion(renewal: TrackedRenewal): string | null {
  if (renewal.status !== "Pending" && renewal.status !== "Approved") {
    return null;
  }

  const createdDate = timestampToDate(renewal.createdAt);
  if (!createdDate) return null;

  const deadline = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(deadline);
}

export function TrackResult({ renewal }: { renewal: TrackedRenewal }) {
  const completionEstimate = estimatedCompletion(renewal);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs">Request Number</p>
            <CardTitle className="font-mono text-lg">
              {renewal.requestId}
            </CardTitle>
          </div>
          <StatusBadge status={renewal.status} />
        </CardHeader>
        <CardContent className="space-y-6">
          {completionEstimate && (
            <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-xl px-4 py-3 text-sm">
              <Clock className="size-4 shrink-0" />
              <span>
                Estimated completion:{" "}
                <span className="text-foreground font-medium">
                  {completionEstimate}
                </span>
              </span>
            </div>
          )}

          <TrackTimeline renewal={renewal} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Student</dt>
              <dd className="text-right font-medium">{renewal.studentName}</dd>
              <dt className="text-muted-foreground">Course</dt>
              <dd className="text-right font-medium">{renewal.course}</dd>
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="text-right font-medium">{renewal.plan}</dd>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="text-right font-medium">
                {formatDateTime(renewal.createdAt)}
              </dd>
            </dl>

            {renewal.remarks && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-muted-foreground text-xs">Remarks</p>
                  <p className="mt-1 text-sm">{renewal.remarks}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {renewal.screenshotUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Screenshot</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={renewal.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-muted block overflow-hidden rounded-xl border"
              >
                <Image
                  src={renewal.screenshotUrl}
                  alt={`Payment screenshot for ${renewal.requestId}`}
                  width={320}
                  height={240}
                  unoptimized
                  className="h-auto w-full object-contain"
                />
              </a>
              <p className="text-muted-foreground mt-2 text-xs">
                Click to view the full-size screenshot.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
