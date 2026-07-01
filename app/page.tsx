import { RenewalForm } from "@/components/renewal/renewal-form";
import { InstructionsPanel } from "@/components/renewal/instructions-panel";

export default function Home() {
  return (
    <main className="bg-muted/30 flex flex-1 flex-col">
      <section className="px-4 pt-16 pb-10 text-center sm:pt-24 sm:pb-14">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-5xl">
          Renew Your Membership
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md text-base sm:text-lg">
          Submit your payment details for quick renewal.
        </p>
      </section>

      <section className="flex-1 px-4 pb-16 sm:pb-24">
        <InstructionsPanel />
        <RenewalForm />
      </section>
    </main>
  );
}
