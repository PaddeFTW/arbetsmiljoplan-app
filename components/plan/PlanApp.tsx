"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  FileText,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  createEmptyPlan,
  loadPlans,
  planProgress,
  savePlans,
  statusLabel,
  type ChecklistStatus,
  type PlanRecord,
  type ProjectInfo,
} from "@/lib/plan";
import { buildPlanExport } from "@/lib/export";
import { cn } from "@/lib/utils";

type View = "home" | "edit";

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function PlanApp() {
  const [mounted, setMounted] = useState(false);
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [view, setView] = useState<View>("home");
  const [active, setActive] = useState<PlanRecord | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setPlans(loadPlans());
    setMounted(true);
  }, []);

  const progress = useMemo(
    () => (active ? planProgress(active) : null),
    [active],
  );

  function persist(next: PlanRecord[]) {
    setPlans(next);
    savePlans(next);
  }

  function startNew() {
    const plan = createEmptyPlan();
    setActive(plan);
    setView("edit");
  }

  function openPlan(plan: PlanRecord) {
    setActive(plan);
    setView("edit");
  }

  function updateProject<K extends keyof ProjectInfo>(key: K, value: ProjectInfo[K]) {
    if (!active) return;
    setActive({
      ...active,
      updatedAt: new Date().toISOString(),
      project: { ...active.project, [key]: value },
    });
  }

  function updateChecklist(
    id: string,
    patch: Partial<{ status: ChecklistStatus; date: string; sign: string; note: string }>,
  ) {
    if (!active) return;
    setActive({
      ...active,
      updatedAt: new Date().toISOString(),
      checklist: active.checklist.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  function saveActive() {
    if (!active) return;
    const next = [...plans.filter((p) => p.id !== active.id), active].sort(
      (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    );
    persist(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  function deleteActive() {
    if (!active) return;
    if (!confirm("Ta bort denna arbetsmiljöplan?")) return;
    persist(plans.filter((p) => p.id !== active.id));
    setActive(null);
    setView("home");
  }

  function exportPlan(format: "pdf" | "word" | "txt") {
    if (!active) return;
    const doc = buildPlanExport(active);
    if (format === "txt") {
      const blob = new Blob([doc.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.baseFileName}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (format === "word") {
      const blob = new Blob([doc.html], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.baseFileName}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.write(doc.html);
    w.document.close();
    w.focus();
    w.print();
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Laddar…
      </div>
    );
  }

  if (view === "home") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-primary">Quality WorX</p>
          <h1 className="text-3xl font-semibold tracking-tight">Arbetsmiljöplan</h1>
          <p className="mt-2 text-muted-foreground">
            Fyll i projektinfo och kontrollmoment. Spara lokalt och exportera till PDF eller Word.
          </p>
        </header>
        <button type="button" onClick={startNew} className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft-sm transition hover:opacity-95">
          <Plus className="size-4" />
          Ny arbetsmiljöplan
        </button>
        <div className="space-y-3">
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Inga planer ännu. Skapa din första.
            </div>
          ) : (
            plans.map((plan) => {
              const prog = planProgress(plan);
              return (
                <button key={plan.id} type="button" onClick={() => openPlan(plan)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-soft-sm transition hover:border-primary/30 hover:shadow-soft-md">
                  <div>
                    <p className="font-medium">{plan.project.fastighetsbeteckning || plan.project.adress || "Namnlös plan"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{plan.project.entreprenorNamn || "Ingen entreprenör"} · {new Date(plan.updatedAt).toLocaleString("sv-SE")}</p>
                  </div>
                  <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-accent-foreground">{prog.done}/{prog.total}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (!active) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={() => { setView("home"); setActive(null); }} className="mb-2 text-sm text-muted-foreground hover:text-foreground">
            ← Tillbaka
          </button>
          <h1 className="text-2xl font-semibold">Redigera arbetsmiljöplan</h1>
          {progress ? <p className="mt-1 text-sm text-muted-foreground">Progress: {progress.done}/{progress.total} ({progress.percent}%)</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={saveActive} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{savedFlash ? <Check className="size-4" /> : <Save className="size-4" />}{savedFlash ? "Sparad" : "Spara"}</button>
          <button type="button" onClick={() => exportPlan("pdf")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm"><FileText className="size-4" />PDF</button>
          <button type="button" onClick={() => exportPlan("word")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm"><Download className="size-4" />Word</button>
          <button type="button" onClick={() => exportPlan("txt")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm">Text</button>
          <button type="button" onClick={deleteActive} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm text-destructive"><Trash2 className="size-4" /></button>
        </div>
      </div>
      <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft-sm">
        <h2 className="mb-4 text-lg font-semibold">1. Projektinformation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {([["fastighetsbeteckning","Fastighetsbeteckning"],["adress","Adress"],["postnr","Postnr"],["ort","Ort"],["kontaktperson","Kontaktperson arbetsplats"],["kontaktMobil","Mobil"],["kontaktEpost","E-post"],["bestallareNamn","Beställare / byggherre"],["bestallareOrgNr","Beställare org.nr"],["entreprenorNamn","Entreprenör"],["entreprenorOrgNr","Entreprenör org.nr"],["projektledare","Projektledare"],["kma","KMA"],["arbetsledare","Arbetsledare"],["skyddsombud","Skyddsombud"],["startDatum","Projektstart"],["slutDatum","Projektavslut"]] as const).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block text-muted-foreground">{label}</span>
              <input className={fieldClass} type={key.includes("Datum") ? "date" : "text"} value={active.project[key]} onChange={(e) => updateProject(key, e.target.value)} />
            </label>
          ))}
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-muted-foreground">Entreprenadform</span>
            <select className={fieldClass} value={active.project.entreprenadform} onChange={(e) => updateProject("entreprenadform", e.target.value as ProjectInfo["entreprenadform"])}>
              <option value="">Välj…</option>
              <option value="total">Totalentreprenad</option>
              <option value="utforande">Utförandeentreprenad</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-muted-foreground">Projektbeskrivning</span>
            <textarea className={cn(fieldClass, "min-h-24")} value={active.project.projektbeskrivning} onChange={(e) => updateProject("projektbeskrivning", e.target.value)} />
          </label>
        </div>
      </section>
      <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft-sm">
        <h2 className="mb-4 text-lg font-semibold">2. Arbetsmiljöpolicy / notering</h2>
        <textarea className={cn(fieldClass, "min-h-28")} placeholder="Egna tillägg till arbetsmiljöpolicyn för projektet…" value={active.policyNote} onChange={(e) => setActive({ ...active, policyNote: e.target.value, updatedAt: new Date().toISOString() })} />
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft-sm">
        <h2 className="mb-2 text-lg font-semibold">3. Arbetsmiljökontrollmoment</h2>
        <p className="mb-4 text-sm text-muted-foreground">1 = Godkänt · 2 = Ej godkänt · 3 = Ej kontrollerat</p>
        <div className="space-y-3">
          {active.checklist.map((item) => (
            <div key={item.id} className="rounded-xl border border-border/80 bg-background p-3">
              <p className="mb-2 text-sm font-medium">{item.title}</p>
              <div className="grid gap-2 sm:grid-cols-4">
                <select className={fieldClass} value={item.status} onChange={(e) => updateChecklist(item.id, { status: e.target.value as ChecklistStatus })}>
                  <option value="">Status…</option>
                  <option value="ok">{statusLabel("ok")}</option>
                  <option value="ej-ok">{statusLabel("ej-ok")}</option>
                  <option value="ej-kontrollerat">{statusLabel("ej-kontrollerat")}</option>
                </select>
                <input type="date" className={fieldClass} value={item.date} onChange={(e) => updateChecklist(item.id, { date: e.target.value })} />
                <input className={fieldClass} placeholder="Signatur" value={item.sign} onChange={(e) => updateChecklist(item.id, { sign: e.target.value })} />
                <input className={fieldClass} placeholder="Anteckning" value={item.note} onChange={(e) => updateChecklist(item.id, { note: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
