import { Suspense } from "react";

import { BrandHeader } from "@/components/renewal/brand-header";
import { HomePageContent } from "@/components/renewal/home-page-content";
import { PageLoader } from "@/components/shared/loading-spinner";

export default function Home() {
  return (
    <main className="bg-muted/30 flex flex-1 flex-col">
      <BrandHeader />

      <Suspense fallback={<PageLoader />}>
        <HomePageContent />
      </Suspense>
    </main>
  );
}
