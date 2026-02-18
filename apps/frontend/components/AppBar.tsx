"use client";

import { useRef } from "react";

import { signIn, signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import { Loader2Icon, Music } from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


export function AppBar(): JSX.Element {
  const session = useSession();
  const router = useRouter();
  const currPath = usePathname();

  const urlInputRef = useRef<HTMLInputElement>(null);

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
        <div>
          {session.status === "loading" ? (
            <Loader2Icon className="animate-spin" aria-label="Loading authentication status" />
          ) : session.status === "authenticated" && session.data?.user ? (
            <div className="flex gap-3">
              {currPath !== "/dashboard" && (
                <Button
                  className="bg-gray-800 py-2 px-4 rounded-lg"
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                </Button>
              )}
              {currPath === "/" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="hover:bg-gray-200">
                      Join
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="mt-1 border-gray-100 w-full">
                    <div className="text-xs mb-3">
                      Example:{" "}
                      <span className=" bg-gray-200 px-2 py-1 rounded-xl">http://localhost:3000/stream/ba081067-464b-4f2c-a272-0a5ea13aed9d</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input ref={urlInputRef} className="h-8 text-sm px-2" type="url" placeholder="Paste the shared URL here..." />
                      <Button
                        className="h-8"
                        onClick={() => urlInputRef.current && router.push(urlInputRef.current.value)}
                      >
                        Join
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Button
                className="py-2 px-4 rounded-lg hover:bg-gray-200"
                variant={"secondary"}
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
