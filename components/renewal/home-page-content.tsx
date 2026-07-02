"use client";

import { useSearchParams } from "next/navigation";

import { InstructionsPanel } from "@/components/renewal/instructions-panel";
import { PaymentSuccessBanner } from "@/components/renewal/payment-success-banner";
import { RenewalForm } from "@/components/renewal/renewal-form";
import {
  hasPrefill,
  parseRenewalQueryParams,
} from "@/utils/parse-renewal-query-params";

export function HomePageContent() {
  const searchParams = useSearchParams();
  const prefill = parseRenewalQueryParams(searchParams);
  const fromPayment = hasPrefill(prefill);

  return (
    <section className="flex-1 px-4 pb-16 sm:pb-24">
      {fromPayment && <PaymentSuccessBanner />}
      <InstructionsPanel />
      <RenewalForm prefill={fromPayment ? prefill : undefined} />
    </section>
  );
}
