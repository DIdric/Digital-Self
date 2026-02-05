import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.SIMLI_API_KEY;
  const faceId = process.env.SIMLI_FACE_ID;

  if (!apiKey || !faceId) {
    return NextResponse.json(
      { error: "Simli credentials not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({ apiKey, faceId });
}
