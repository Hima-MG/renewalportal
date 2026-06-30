"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackFormSchema } from "@/lib/validations/track";
import type { TrackQuery } from "@/hooks/use-track-renewal";

type TrackSearchFormProps = {
  onSearch: (query: TrackQuery) => void;
  loading: boolean;
  initialRequestId?: string;
  initialTrackingToken?: string;
};

export function TrackSearchForm({
  onSearch,
  loading,
  initialRequestId = "",
  initialTrackingToken = "",
}: TrackSearchFormProps) {
  const [requestId, setRequestId] = useState(initialRequestId);
  const [trackingToken, setTrackingToken] = useState(initialTrackingToken);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = trackFormSchema.safeParse({ requestId, trackingToken });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setError(null);
    onSearch(result.data);
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="requestId">Request ID</Label>
            <Input
              id="requestId"
              value={requestId}
              onChange={(event) => setRequestId(event.target.value)}
              placeholder="RN-20260001"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trackingToken">Tracking Token</Label>
            <Input
              id="trackingToken"
              value={trackingToken}
              onChange={(event) => setTrackingToken(event.target.value)}
              placeholder="7KDF9A2M5P"
              className="font-mono uppercase"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Track Renewal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
