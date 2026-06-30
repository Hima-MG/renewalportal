import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="bg-muted/30 flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="bg-muted flex size-14 items-center justify-center rounded-full">
            <FileQuestion className="text-muted-foreground size-7" />
          </div>
          <div>
            <p className="text-foreground font-medium">Page not found</p>
            <p className="text-muted-foreground mt-1 text-sm">
              The page you&apos;re looking for doesn&apos;t exist or has moved.
            </p>
          </div>
          <Button render={<Link href="/" />}>Back to Home</Button>
        </CardContent>
      </Card>
    </main>
  );
}
