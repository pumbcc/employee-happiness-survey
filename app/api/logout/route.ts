import { NextResponse } from "next/server";
import { EMPLOYEE_COOKIE, isSameOrigin } from "@/lib/employee-session";
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "ไม่อนุญาต" }, { status: 403 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(EMPLOYEE_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
