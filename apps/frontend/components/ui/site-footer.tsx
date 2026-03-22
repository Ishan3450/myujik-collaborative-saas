import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t mt-8">
      <p className="text-xs text-gray-500">
        © {currentYear} Myujik. All rights reserved.
      </p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <Link
          className="text-xs hover:underline underline-offset-4"
          href="/terms"
        >
          Terms of Service
        </Link>
        <Link
          className="text-xs hover:underline underline-offset-4"
          href="/privacy"
        >
          Privacy
        </Link>
      </nav>
    </footer>
  );
}
