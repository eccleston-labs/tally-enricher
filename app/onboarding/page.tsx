"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingForm } from "@/components/form";

export default function OnboardingPage() {
  const me = useQuery(api.users.me, {}); // { user, workspace } | null
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("");

  // Route safety
  useEffect(() => {
    if (me === undefined) return; // still loading

    if (me === null) {
      // no user row/session
      router.replace("/home");
    } else if (me.workspace) {
      // already linked to workspace
      router.replace("/dashboard");
    }
  }, [me, router]);

  if (me === undefined) {
    return <p className="text-gray-500">Loading...</p>;
  }

  // If me is null or has workspace, we’re already redirecting, so render nothing
  if (me === null || me.workspace) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Onboarding</h1>
      </div>

      <OnboardingForm setWorkspaceName={setWorkspaceName} />
    </div>
  );
}
