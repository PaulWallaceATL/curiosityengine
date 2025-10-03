import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function getCorsHeaders(origin: string | null) {
  const allowOrigin = allowedOrigins.includes("*")
    ? "*"
    : origin && allowedOrigins.includes(origin)
    ? origin
    : "";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  } as Record<string, string>;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ received: body }, { headers: getCorsHeaders(origin) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const message = url.searchParams.get("message") || "hello";
  return NextResponse.json({ message }, { headers: getCorsHeaders(origin) });
}


