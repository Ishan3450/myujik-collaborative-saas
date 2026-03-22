"use client";

import { useEffect, useRef, useState } from "react";

import { signIn, signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import { Loader2Icon } from "lucide-react";

import { GoogleSignInButton } from "@/components/ui/google-sign-in-button";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Image from "next/image";
import toast from "react-hot-toast";


const EXAMPLE_STREAM_ID = "ba081067-464b-4f2c-a272-0a5ea13aed9d";

export function AppBar(): JSX.Element {
  const session = useSession();
  const router = useRouter();
  const currPath = usePathname();

  const urlInputRef = useRef<HTMLInputElement>(null);

  const envBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""; // removing trailing slash if present
  const [origin, setOrigin] = useState(envBase);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!envBase) {
      setOrigin(window.location.origin);
    }
  }, [envBase]);

  const exampleJoinUrl = origin
    ? `${origin}/stream/${EXAMPLE_STREAM_ID}`
    : null;

  if (currPath === "/dashboard" || currPath.startsWith("/stream")) {
    return (
      <header>
        <div className="flex items-center justify-center gap-2 my-2">
          <Image
            src="/icon.png"
            alt="Myujik Logo"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0"
          />
          <span className="font-bold">Myujik</span>
        </div>
      </header>
    )
  }

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center">
      <Link className="flex items-center justify-center gap-2" href="/">
        <Image
          src="/icon.png"
          alt="Myujik Logo"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0"
        />
        <span className="font-bold">Myujik</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Link
          className="text-sm font-medium hover:underline underline-offset-4"
          href="/#features"
        >
          Features
        </Link>
        <Link
          className="text-sm font-medium hover:underline underline-offset-4"
          href="/#how-it-works"
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
              {currPath !== "/settings" && (
                <Button
                  variant="secondary"
                  className="hover:bg-gray-200"
                  onClick={() => router.push("/settings")}
                >
                  Settings
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
                      <span className="bg-gray-200 px-2 py-1 rounded-xl break-all">
                        {exampleJoinUrl ??
                          `https://your-domain/stream/${EXAMPLE_STREAM_ID}`}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input ref={urlInputRef} className="h-8 text-sm px-2" type="url" placeholder="Paste the shared URL here..." />
                      <Button
                        className="h-8"
                        onClick={() => {
                          const raw = urlInputRef.current?.value.trim();
                          const trustedOrigin = origin || window.location.origin;

                          if (!raw) {
                            toast.error("Please enter URL !!");
                            return;
                          }
                          try {
                            const parsed = new URL(raw, trustedOrigin);
                            if (
                              parsed.origin !== trustedOrigin ||
                              !parsed.pathname.startsWith("/stream/")
                            ) {
                              toast.error("Invalid URL !!");
                              return;
                            }
                            window.location.assign(parsed.toString());
                          } catch {
                            toast.error("Invalid URL !!");
                            return;
                          }
                        }}>
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
            <GoogleSignInButton
              loading={googleLoading}
              onClick={async () => {
                setGoogleLoading(true);
                try {
                  await signIn("google", { callbackUrl: "/dashboard" });
                } finally {
                  setGoogleLoading(false);
                }
              }}
            />
          )}
        </div>
      </nav>
    </header>
  );
}
