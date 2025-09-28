import { NextRequest, NextResponse } from "next/server";
import { getJobStatus } from "@/services/turso-jobs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Job ID requerido" }, { status: 400 });
  }

  const jobStatus = await getJobStatus(jobId);

  if (!jobStatus) {
    return NextResponse.json({ error: "Job no encontrado" }, { status: 404 });
  }

  return NextResponse.json(jobStatus, { status: 200 });
}
