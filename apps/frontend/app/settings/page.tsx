"use client";

import { useEffect, useState } from "react";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import toast from "react-hot-toast";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const session = useSession();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.replace("/");
    }
  }, [session.status, router]);

  async function handleDeleteAccount() {
    setPending(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }
      setConfirmOpen(false);
      toast.success("Your account has been deleted.");
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not delete your account."
      );
    } finally {
      setPending(false);
    }
  }

  if (session.status === "loading") {
    return (
      <div className="container mx-auto p-4 flex items-center gap-2 text-gray-600">
        <Loader2Icon className="h-5 w-5 animate-spin" aria-hidden />
        Loading…
      </div>
    );
  }

  if (session.status !== "authenticated" || !session.data?.user) {
    return null;
  }

  const email = session.data.user.email;

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-2">Account</h1>
      <p className="text-sm text-gray-600 mb-6">
        Signed in as {email ?? "your account"}
      </p>

      <Card className="p-4 border-red-200 bg-red-50/50">
        <h2 className="text-lg font-semibold text-red-900 mb-1">Delete account</h2>
        <p className="text-sm text-gray-700 mb-4">
          Permanently remove your Myujik account and profile from our database.
          You can sign in again later with Google, a new account record will be
          created.
        </p>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setConfirmOpen(true)}
        >
          Delete my account
        </Button>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Your user record will be removed from our
              database immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
