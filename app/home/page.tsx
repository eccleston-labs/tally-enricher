"use client";

import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { EnsureUserOnce } from "@/components/EnsureUserOnce"; // import your helper

export default function HomePage() {
  const router = useRouter();
  const me = useQuery(api.users.me, {}); // { user, workspace } | null
  const loading = me === undefined;

  useEffect(() => {
    if (loading) return;

    if (me) {
      if (me.workspace) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [me, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Unauthenticated>
        <SignInButton mode="modal">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Sign in with Google
          </button>
        </SignInButton>
      </Unauthenticated>

      <Authenticated>
        {/* Ensures user row exists before redirect logic above runs */}
        <EnsureUserOnce />
        <p>Redirecting...</p>
      </Authenticated>
    </div>
  );
}
