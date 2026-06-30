"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Loader2, LogIn } from "lucide-react";

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
import { auth } from "@/lib/firebase/auth";
import { useAuthRole } from "@/hooks/use-auth-role";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

function authErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found"
  ) {
    return "Incorrect email or password.";
  }
  if (code === "auth/user-disabled") {
    return "This account has been disabled. Contact an administrator.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please try again later.";
  }
  return "Could not sign in. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const { status, role } = useAuthRole();
  const [error, setError] = useState<string | null>(null);

  // Already signed in as staff (e.g. navigated back to /login)? Skip
  // straight to the dashboard instead of showing the form again.
  useEffect(() => {
    if (status === "ready" && (role === "finance" || role === "admin")) {
      router.replace("/dashboard");
    }
  }, [status, role, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/dashboard");
    } catch (caught) {
      setError(authErrorMessage(caught));
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit(onSubmit)();
            }}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@civilezy.in"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
