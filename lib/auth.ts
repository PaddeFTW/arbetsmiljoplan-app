export const AUTH_STORAGE_KEY = "qw-auth-session-v1";
export const AUTH_PENDING_KEY = "qw-auth-pending-v1";

export interface AuthSession {
  email: string;
  loggedInAt: string;
}

export interface PendingLink {
  email: string;
  token: string;
  createdAt: string;
}

function randomToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replaceAll("-", "");
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function createMagicLink(email: string) {
  const pending: PendingLink = {
    email: email.trim().toLowerCase(),
    token: randomToken(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_PENDING_KEY, JSON.stringify(pending));
  const url = new URL("/auth/verify", window.location.origin);
  url.searchParams.set("token", pending.token);
  url.searchParams.set("email", pending.email);
  return { pending, href: url.toString() };
}

export function consumeMagicLink(token: string, email: string): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_PENDING_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as PendingLink;
    if (pending.token !== token) return null;
    if (pending.email !== email.trim().toLowerCase()) return null;
    const created = new Date(pending.createdAt).getTime();
    if (Date.now() - created > 24 * 60 * 60 * 1000) return null;
    const session: AuthSession = {
      email: pending.email,
      loggedInAt: new Date().toISOString(),
    };
    saveSession(session);
    localStorage.removeItem(AUTH_PENDING_KEY);
    return session;
  } catch {
    return null;
  }
}
