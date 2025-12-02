"use client";

import { Loader2Icon, Music } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export function AppBar(): JSX.Element {
  const session = useSession();
  const router = useRouter();
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center">
      <Link className="flex items-center justify-center" href="/">
        <Music className="h-6 w-6 mr-2" />
        <span className="font-bold">Myujik</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Link
          className="text-sm font-medium hover:underline underline-offset-4"
          href="#features"
        >
          Features
        </Link>
        <Link
          className="text-sm font-medium hover:underline underline-offset-4"
          href="#how-it-works"
        >
          How It Works
        </Link>
        <Link
          className="text-sm font-medium hover:underline underline-offset-4"
          href="#pricing"
        >
          Pricing
        </Link>
        <div>
          {session.status === "loading" ? (
            <Loader2Icon className="animate-spin" />
          ) : session.status === "authenticated" && session.data?.user ? (
            <div className="flex gap-3">
              <Button
                className="bg-gray-800 py-2 px-4 rounded-lg"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
              <Button
                className="py-2 px-4 rounded-lg"
                variant={"outline"}
                onClick={() => signOut()}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Button
              className="bg-gray-800 py-2 px-4 rounded-lg"
              onClick={() => signIn()}
            >
              Sign in
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
