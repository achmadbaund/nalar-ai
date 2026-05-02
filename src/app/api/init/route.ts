import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";

export async function GET() {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { error: "POSTGRES_URL not configured" },
        { status: 500 }
      );
    }

    await initDatabase();

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}
