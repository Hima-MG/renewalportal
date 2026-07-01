import { RenewalForm } from "@/components/renewal/renewal-form";
import { InstructionsPanel } from "@/components/renewal/instructions-panel";
import { BrandHeader } from "@/components/renewal/brand-header";

export default function Home() {
  return (
    <main className="bg-muted/30 flex flex-1 flex-col">
      <BrandHeader />

      <section className="flex-1 px-4 pb-16 sm:pb-24">
        <InstructionsPanel />
        <RenewalForm />
      </section>
    </main>
  );
}
