import { NextResponse } from "next/server";
import { getBuildDiagnostics } from "@/lib/diagnostics";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(await getBuildDiagnostics());
}
