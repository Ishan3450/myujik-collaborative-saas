import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { SiteFooter } from "@/components/ui/site-footer";

type LegalPageShellProps = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container max-w-3xl mx-auto px-4 py-10 md:py-14 flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to home
        </Link>
        <article className="text-gray-800">
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 mb-2">
            {title}
          </h1>
          <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>
          <div className="space-y-6 text-[15px] leading-relaxed">{children}</div>
        </article>
      </div>
      <SiteFooter />
    </div>
  );
}

export function LegalH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-gray-950 mt-10 first:mt-0 pt-2">
      {children}
    </h2>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-700">{children}</p>;
}

export function LegalUl({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc pl-6 space-y-2 text-gray-700">{children}</ul>
  );
}
