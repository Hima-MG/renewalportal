"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInAnonymously, signOut, type User } from "firebase/auth";
import { ImageUp, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SuccessScreen } from "@/components/renewal/success-screen";
import { RenewalStepper } from "@/components/renewal/renewal-stepper";
import { auth } from "@/lib/firebase/auth";
import { createRenewal } from "@/lib/api/create-renewal";
import { uploadScreenshot } from "@/lib/api/upload-screenshot";
import {
  ACCEPTED_SCREENSHOT_TYPES,
  PAYMENT_METHODS,
  renewalFormSchema,
  type RenewalFormValues,
} from "@/lib/validations/renewal";
import { compressImage } from "@/utils/image";
import { RENEWAL_DURATIONS } from "@/types/renewal";
import type { RenewalPrefill } from "@/utils/parse-renewal-query-params";

const STEP_FIELDS: Record<number, FieldPath<RenewalFormValues>[]> = {
  1: ["studentName", "phone", "email", "course", "renewalDuration"],
  2: ["amount", "paymentMethod", "transactionId"],
  3: ["screenshot", "remarks"],
};

type SubmitPhase =
  "idle" | "preparing" | "compressing" | "uploading" | "saving";

const CLAIM_POLL_INTERVAL_MS = 300;
const CLAIM_POLL_TIMEOUT_MS = 5000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// setCustomUserClaims() on the server does not guarantee the very next
// force-refreshed ID token already carries the new claim — there is a
// short, variable propagation delay on Firebase's side. A single
// `getIdToken(true)` right after the claim-student call is therefore not
// reliable: Firestore can reject the write with "Missing or insufficient
// permissions" because the token it received still has no role claim,
// even though the API call that set it already returned 200 OK. This
// polls (forcing a fresh token each attempt) until the claim is actually
// present, bounded to CLAIM_POLL_TIMEOUT_MS, instead of writing blind.
async function waitForStudentClaim(user: User): Promise<{ ok: boolean }> {
  const deadline = Date.now() + CLAIM_POLL_TIMEOUT_MS;

  while (true) {
    const result = await user.getIdTokenResult(true);
    if (result.claims.role === "student") {
      return { ok: true };
    }

    if (Date.now() >= deadline) {
      return { ok: false };
    }

    await delay(CLAIM_POLL_INTERVAL_MS);
  }
}

type SubmittedRequest = {
  requestId: string;
  trackingToken: string;
};

export function RenewalForm({ prefill }: { prefill?: RenewalPrefill }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState<SubmittedRequest | null>(null);
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const form = useForm<RenewalFormValues>({
    resolver: zodResolver(renewalFormSchema),
    defaultValues: {
      studentName: "",
      phone: "",
      email: "",
      course: prefill?.course ?? "",
      renewalDuration: prefill?.renewalDuration ?? undefined,
      amount: prefill?.amount ?? 0,
      transactionId: "",
      paymentMethod: undefined,
      remarks: "",
    },
  });

  const isBusy = phase !== "idle";

  async function handleNext() {
    const valid = await form.trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, 3));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function onSubmit(values: RenewalFormValues) {
    // Guards against duplicate submissions from rapid double-clicks, since
    // React state updates (and therefore the disabled prop) are async.
    if (isSubmittingRef.current) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSubmitError("You're offline. Reconnect and try again.");
      return;
    }

    isSubmittingRef.current = true;
    setSubmitError(null);

    try {
      // The renewal form only ever operates as an anonymous student. If
      // this browser already has a *different* signed-in identity (e.g.
      // someone tested the Finance Dashboard email/password login earlier
      // in the same browser — Firebase Auth persists that session), reusing
      // it here would send a non-anonymous token to /api/auth/claim-student,
      // which correctly refuses to grant 'student' to a staff account and
      // returns 403. Sign that identity out first so this always starts a
      // fresh anonymous session instead of silently failing on stale auth.
      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        await signOut(auth);
      }
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const user = auth.currentUser;
      if (!user) {
        setSubmitError("Could not start a session. Please try again.");
        return;
      }

      // Anonymous sign-in alone carries no role claim. Self-claim 'student'
      // (the endpoint only ever grants that role to anonymous users), then
      // verify the claim has actually propagated to a refreshed token
      // before ever attempting a Firestore write.
      let idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims.role !== "student") {
        const idToken = await user.getIdToken();
        const claimResponse = await fetch("/api/auth/claim-student", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!claimResponse.ok) {
          const claimJson = (await claimResponse.json().catch(() => null)) as {
            error?: string;
          } | null;
          setSubmitError(
            claimJson?.error ??
              "Could not verify your session. Please try again.",
          );
          return;
        }

        setPhase("preparing");
        const claimResult = await waitForStudentClaim(user);
        setPhase("idle");

        if (!claimResult.ok) {
          console.error(
            "[renewal-form] Student claim did not propagate within",
            CLAIM_POLL_TIMEOUT_MS,
            "ms for uid:",
            user.uid,
          );
          setSubmitError(
            "Unable to prepare your account. Please refresh and try again.",
          );
          return;
        }

        // waitForStudentClaim's last attempt already force-refreshed the
        // token, so this just reads that already-fresh cached result.
        idTokenResult = await user.getIdTokenResult();
      }

      // Final verification, right before the Firestore write — never
      // create the renewal document without explicit confirmation that
      // the authenticated user's token actually carries role: "student".
      if (idTokenResult.claims.role !== "student") {
        console.error(
          "[renewal-form] Refusing to create renewal: role is not 'student'.",
          { uid: user.uid, claims: idTokenResult.claims },
        );
        setSubmitError(
          "Unable to prepare your account. Please refresh and try again.",
        );
        return;
      }

      setPhase("compressing");
      const compressedScreenshot = await compressImage(values.screenshot);

      setPhase("uploading");
      setUploadProgress(0);
      const uploadResult = await uploadScreenshot(
        compressedScreenshot,
        setUploadProgress,
      );
      if (!uploadResult.success) {
        toast.error(uploadResult.error);
        setSubmitError(uploadResult.error);
        return;
      }

      // Request ID + tracking token generation and the Firestore write all
      // happen server-side here — the client never touches counters/* and
      // never writes renewal_requests directly.
      setPhase("saving");
      const createResult = await createRenewal({
        studentName: values.studentName,
        phone: values.phone,
        email: values.email || undefined,
        course: values.course,
        renewalDuration: values.renewalDuration,
        amount: values.amount,
        transactionId: values.transactionId,
        paymentMethod: values.paymentMethod,
        screenshotUrl: uploadResult.data.secureUrl,
        cloudinaryPublicId: uploadResult.data.publicId,
        imageWidth: uploadResult.data.width,
        imageHeight: uploadResult.data.height,
        imageBytes: uploadResult.data.bytes,
        imageFormat: uploadResult.data.format,
        remarks: values.remarks,
      });

      if (!createResult.success) {
        setSubmitError(createResult.error);
        return;
      }

      toast.success("Renewal request submitted successfully.");
      setSubmitted(createResult.data);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      isSubmittingRef.current = false;
      setPhase("idle");
    }
  }

  // Wraps handleSubmit so the form/button only call form.handleSubmit(...)
  // at event time, not on every render pass.
  function submitForm() {
    void form.handleSubmit(onSubmit)();
  }

  if (submitted) {
    return (
      <SuccessScreen
        requestId={submitted.requestId}
        trackingToken={submitted.trackingToken}
        onTrackRenewal={() => {
          window.location.href = `/track?requestId=${submitted.requestId}&token=${submitted.trackingToken}`;
        }}
      />
    );
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardContent>
        <RenewalStepper currentStep={step} />

        <Form {...form}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitForm();
            }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Student Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          placeholder="9876543210"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="Enter your email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Civil Engineering"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="renewalDuration"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Renewal Duration</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select renewal duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RENEWAL_DURATIONS.map((duration) => (
                            <SelectItem key={duration} value={duration}>
                              {duration}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          name={field.name}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          value={field.value === 0 ? "" : field.value}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === ""
                                ? 0
                                : Number(event.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Transaction ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Payment reference / UTR number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 3 && (
              <>
                <FormField
                  control={form.control}
                  name="screenshot"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Upload Screenshot</FormLabel>
                      <FormControl>
                        <ScreenshotUploader
                          value={value}
                          onChange={onChange}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Additional Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Anything else we should know?"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {phase === "uploading" && (
                  <div className="sm:col-span-2">
                    <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                      <span>Uploading screenshot...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                {submitError && (
                  <div
                    role="alert"
                    className="border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm sm:col-span-2"
                  >
                    <span>{submitError}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={submitForm}
                    >
                      <RotateCcw className="size-4" />
                      Retry
                    </Button>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 sm:col-span-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isBusy}
                  className="flex-1"
                >
                  Back
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1"
                  size="lg"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  disabled={isBusy}
                  className="flex-1"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {phase === "preparing" &&
                        "Preparing your account... Please wait..."}
                      {phase === "compressing" && "Optimizing image..."}
                      {phase === "uploading" && "Uploading..."}
                      {phase === "saving" && "Submitting..."}
                    </>
                  ) : (
                    "Submit Renewal Request"
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

type ScreenshotUploaderProps = {
  value?: File;
  onChange: (file: File | undefined) => void;
  id?: string;
};

function ScreenshotUploader({
  value,
  onChange,
  id,
  ...props
}: ScreenshotUploaderProps) {
  const previewUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  );

  // Cleanup-only effect: revoke the previous object URL once a new one
  // takes its place (or the component unmounts).
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div>
      {/* Always mounted (visually hidden), not just while no file is
          selected — FormLabel's htmlFor points at this id regardless of
          which branch below is showing, and a label whose `for` has no
          matching element in the DOM is an accessibility/autofill bug. */}
      <input
        {...props}
        id={id}
        type="file"
        accept={ACCEPTED_SCREENSHOT_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0])}
      />
      {value && previewUrl ? (
        <div className="border-input bg-muted/40 flex items-center gap-3 rounded-xl border p-3">
          <Image
            src={previewUrl}
            alt="Screenshot preview"
            width={56}
            height={56}
            unoptimized
            className="size-14 shrink-0 rounded-lg object-cover"
          />
          <span className="text-foreground min-w-0 flex-1 truncate text-sm">
            {value.name}
          </span>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
            aria-label="Remove screenshot"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="border-input hover:bg-muted/40 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors"
        >
          <ImageUp className="text-muted-foreground size-6" />
          <span className="text-foreground text-sm">
            Click to upload payment screenshot
          </span>
          <span className="text-muted-foreground text-xs">
            JPG, JPEG, PNG, or WEBP, up to 5 MB
          </span>
        </label>
      )}
    </div>
  );
}
