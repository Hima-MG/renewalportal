"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { auth } from "@/lib/firebase/auth";

function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className={className}
    >
      <LogOut className="size-4" />
      Sign Out
    </Button>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col lg:flex-row">
      <aside className="bg-background hidden w-64 shrink-0 flex-col border-r px-4 py-6 lg:flex">
        <span className="px-3 text-lg font-semibold tracking-tight">
          Finance Dashboard
        </span>
        <div className="mt-8 flex-1">
          <DashboardNav />
        </div>
        <SignOutButton className="justify-start" />
      </aside>

      <header className="bg-background sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <span className="text-lg font-semibold tracking-tight">
          Finance Dashboard
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Open navigation"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="size-4" />
        </Button>
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-3/4 max-w-xs p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Finance Dashboard</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4">
            <DashboardNav onNavigate={() => setMobileNavOpen(false)} />
            <SignOutButton className="justify-start" />
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
