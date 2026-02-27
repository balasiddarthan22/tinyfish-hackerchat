import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type UserType = "guest" | "regular";

export type Session = {
  user: {
    id: string;
    email: string;
    type: UserType;
  };
};

const COOKIE_NAME = "arena-session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function auth(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret());
    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        type: (payload.type as UserType) || "regular",
      },
    };
  } catch {
    return null;
  }
}

export async function createSession(user: {
  id: string;
  email: string;
  type: UserType;
}) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    type: user.type,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
