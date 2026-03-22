import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
      <p className="text-xl font-medium text-gray-500 mb-2">404</p>
      <h1 className="text-2xl font-bold mb-2 text-center">Page not found</h1>
      <p className="text-gray-600 text-center max-w-md mb-8">
        That link may be wrong or the page was removed. Head back to the home
        page or your dashboard.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
