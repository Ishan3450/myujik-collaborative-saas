import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import prismaClient from "@repo/db";

import { authOptions } from "@/lib/auth-options";

function isPrismaNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  );
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prismaClient.user.delete({
      where: { id: userId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    console.error("DELETE /api/account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
