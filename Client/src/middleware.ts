import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [
  "/",
  "/students",
  "/dashboard",
  "/admin",
  "/receptionist",
  "/instructor",
];

function matchesProtectedPath(pathname: string): boolean {
  return protectedPaths.some(
    (p) =>
      pathname === p ||
      pathname.startsWith(p + "/") ||
      (p === "/" && pathname === "/"),
  );
}

const roleAccess: Record<string, string[]> = {
  "/admin": ["admin"],
  "/receptionist": ["admin", "receptionist"],
  "/instructor": ["admin", "instructor"],
};

function getRequiredSegments(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];
  return segments.reduce<string[]>((acc, _, i) => {
    acc.push("/" + segments.slice(0, i + 1).join("/"));
    return acc;
  }, []);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!matchesProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = request.cookies.get("role")?.value as string | undefined;
  const pathSegments = getRequiredSegments(pathname);

  for (const segment of pathSegments) {
    const allowed = roleAccess[segment];
    if (allowed && role && !allowed.includes(role)) {
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/students/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/receptionist/:path*",
    "/instructor/:path*",
  ],
};
