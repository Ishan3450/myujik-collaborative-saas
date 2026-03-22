import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stream",
  robots: { index: false, follow: false },
};

export default function StreamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
