import type { Metadata } from "next";

import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Collaborative live music streams",
};

export default function Home() {
  return (
    <LandingPage />
  );
}
