import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "bdhvs_admin";
const MAX_AGE = 60 * 60 * 12; // 12 giờ

function secret() {
  return process.env.SESSION_SECRET || "dev-only-insecure-secret";
}

function token() {
  return crypto.createHmac("sha256", secret()).update("admin-ok").digest("hex");
}

export async function createAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdmin() {
  const store = await cookies();
  const v = store.get(COOKIE_NAME)?.value;
  return Boolean(v) && v === token();
}

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
