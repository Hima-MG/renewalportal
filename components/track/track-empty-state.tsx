import { ShieldX } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function TrackEmptyState() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
          <ShieldX className="text-muted-foreground size-7" />
        </div>
        <div>
          <p className="text-foreground font-medium">
            Invalid Request ID or Tracking Token
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Double-check both fields and try again. The tracking token was shown
            only once, right after you submitted your renewal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
