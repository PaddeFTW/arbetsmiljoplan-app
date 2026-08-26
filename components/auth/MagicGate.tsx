"use client";

import { useEffect, useState } from "react";
import { LogOut, Mail } from "lucide-react";
import { clearSession, createMagicLink, loadSession, type AuthSession } from "@/lib/auth";

export function MagicGate({ productName, children }: { productName: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { setSession(loadSession()); setMounted(true); }, []);
  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLink(createMagicLink(email).href);
  }
  function handleLogout() { clearSession(); setSession(null); setLink(""); }
  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  if (!mounted) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Laddar…</div>;
  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
        <p className="mb-2 text-sm font-medium text-primary">Quality WorX</p>
        <h1 className="text-2xl font-semibold tracking-tight">Logga in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ange e-post så skapar vi en engångslänk till {productName}. Inget lösenord behövs.</p>
        <form onSubmit={handleSend} className="mt-6 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">E-post</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="du@foretag.se" className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"><Mail className="size-4" /> Skapa inloggningslänk</button>
        </form>
        {link ? (
          <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="font-medium">Länken är klar</p>
            <p className="mt-1 text-muted-foreground">I den här versionen skickas ingen e-post. Öppna länken direkt eller kopiera den.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={link} className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Öppna länken</a>
              <button type="button" onClick={copyLink} className="inline-flex rounded-xl border border-border px-4 py-2 text-sm">{copied ? "Kopierad" : "Kopiera länk"}</button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <div>
      <div className="border-b border-border bg-card/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2 text-sm">
          <span className="text-muted-foreground">{session.email}</span>
          <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><LogOut className="size-3.5" /> Logga ut</button>
        </div>
      </div>
      {children}
    </div>
  );
}
