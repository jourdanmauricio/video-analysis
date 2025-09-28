import { NextResponse } from "next/server";
import { userQueries } from "../../../services/turso-db";

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    const userCount = await userQueries.count();

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        userCount: userCount,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
