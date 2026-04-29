import { NextResponse } from "next/server";

import { prisma } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        ok: true,
        service: "database",
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    console.error("DB health check failed", error);

    return NextResponse.json(
      {
        ok: false,
        service: "database",
        timestamp: new Date().toISOString(),
        error: message,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
