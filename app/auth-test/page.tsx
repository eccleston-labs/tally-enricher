"use client";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { EnsureUserOnce } from "@/components/EnsureUserOnce"; // adjust import path if needed

export default function AuthTestPage() {
  return (
    <>
      <Authenticated>
        <EnsureUserOnce />   {/* runs once after sign in */}
        <UserButton />
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </>
  );
}

function Content() {
  return <div>Authenticated!</div>;
}
