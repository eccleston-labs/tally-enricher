"use client";
import { useEffect } from "react";
import { useConvex, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";

export function EnsureUserOnce() {
  const convex = useConvex();
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    convex.mutation(api.users.ensureUser, {}).catch(console.error);
  }, [convex, isAuthenticated, isLoading]);

  return null;
}
