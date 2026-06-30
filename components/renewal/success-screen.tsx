"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MoveRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SuccessScreenProps = {
  requestId: string;
  trackingToken: string;
  onTrackRenewal: () => void;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please copy it manually.");
    }
  }

  return (
    <div className="bg-muted w-full rounded-xl px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <p className="text-primary font-mono text-lg font-semibold tracking-wide">
          {value}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="size-4 text-green-600" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export function SuccessScreen({
  requestId,
  trackingToken,
  onTrackRenewal,
}: SuccessScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 sm:py-16">
      <div className="animate-in zoom-in-50 flex size-16 items-center justify-center rounded-full bg-green-100 duration-500 sm:size-20">
        <CheckCircle2 className="size-9 text-green-600 sm:size-11" />
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 mt-8 w-full text-center duration-500">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-xl font-semibold sm:text-2xl">
            Renewal Submitted Successfully
          </CardTitle>
          <CardDescription>
            Renewal request submitted successfully. We&apos;ve received your
            payment details and screenshot.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-4">
          <CopyField label="Request ID" value={requestId} />
          <CopyField label="Tracking Token" value={trackingToken} />

          <div className="flex w-full items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Save this Tracking Token. It will be required to check your
              renewal status.
            </span>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Clock className="size-4" />
            <span>
              Estimated verification time:{" "}
              <span className="text-foreground font-medium">
                Within 24 Hours
              </span>
            </span>
          </div>

          <Button onClick={onTrackRenewal} className="w-full" size="lg">
            Track Renewal
            <MoveRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
