import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <main className="bg-muted/30 flex flex-1 flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          Finance &amp; Admin Sign In
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sign in with your email and password.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
