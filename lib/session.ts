import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "./db";

const COOKIE_NAME = "bdhvs_session";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 năm

function secret() {
  return process.env.SESSION_SECRET || "dev-only-insecure-secret";
}

function sign(userId: string) {
  const sig = crypto.createHmac("sha256", secret()).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret()).update(userId).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

export async function createSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = verify(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

export async function requireSession() {
  const user = await getSession();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
