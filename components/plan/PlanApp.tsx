"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Download, FileText, Plus, Save, Trash2 } from "lucide-react";
import {
  createEmptyPlan,
  loadPlans,
  planProgress,
  savePlans,
  statusLabel,
  type ChecklistItem,
  type ChecklistStatus,
  type PersonRow,
  type PlanRecord,
  type ProjectInfo,
} from "@/lib/plan";
import { buildPlanExport } from "@/lib/export";
import { cn } from "@/lib/utils";

type View = "home" | "edit";
const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

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

  const progress = useMemo(() => (active ? planProgress(active) : null), [active]);

  function persist(next: PlanRecord[]) {
    setPlans(next);
    savePlans(next);
  }
  function startNew() {
    setActive(createEmptyPlan());
    setView("edit");
  }
  function saveActive() {
    if (!active) return;
    persist([...plans.filter((p) => p.id !== active.id), active].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }
  function deleteActive() {
    if (!active || !confirm("Ta bort denna arbetsmiljöplan?")) return;
    persist(plans.filter((p) => p.id !== active.id));
    setActive(null);
    setView("home");
  }
  function exportPlan(format: "pdf" | "word" | "txt") {
    if (!active) return;
    const doc = buildPlanExport(active);
    if (format === "pdf") {
      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) return;
      w.document.write(doc.html);
      w.document.close();
      w.focus();
      w.print();
      return;
    }
    const blob = new Blob([format === "txt" ? doc.text : doc.html], {
      type: format === "txt" ? "text/plain;charset=utf-8" : "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.baseFileName}.${format === "txt" ? "txt" : "doc"}`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function setProject<K extends keyof ProjectInfo>(key: K, value: ProjectInfo[K]) {
    if (!active) return;
    setActive({ ...active, updatedAt: new Date().toISOString(), project: { ...active.project, [key]: value } });
  }
  function patchList(key: "organization" | "workers" | "subcontractors" | "receipts", id: string, patch: Partial<PersonRow>) {
    if (!active) return;
    setActive({ ...active, updatedAt: new Date().toISOString(), [key]: active[key].map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  }
  function addPerson(key: "organization" | "workers" | "subcontractors" | "receipts", role: string) {
    if (!active) return;
    setActive({ ...active, updatedAt: new Date().toISOString(), [key]: [...active[key], { id: crypto.randomUUID(), role, name: "", mobile: "", email: "", extra: "" }] });
  }
  function patchCheck(key: "checklist" | "safetyRounds", id: string, patch: Partial<ChecklistItem>) {
    if (!active) return;
    setActive({ ...active, updatedAt: new Date().toISOString(), [key]: active[key].map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  if (!mounted) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Laddar…</div>;

  if (view === "home") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="mb-2 text-sm font-medium text-primary">Quality WorX</p>
        <h1 className="text-3xl font-semibold tracking-tight">Arbetsmiljöplan</h1>
        <p className="mt-2 text-muted-foreground">Samma innehåll som Word-mallen: projekt, organisation, risker, skyddsrond, nödläge och kvittens.</p>
        <button type="button" onClick={startNew} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
          <Plus className="size-4" /> Ny arbetsmiljöplan
        </button>
        <div className="mt-6 space-y-3">
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Inga planer ännu.</div>
          ) : (
            plans.map((plan) => {
              const prog = planProgress(plan);
              return (
                <button key={plan.id} type="button" onClick={() => { setActive(plan); setView("edit"); }} className="flex w-full items-center justify-between rounded-2xl border bg-card p-4 text-left">
                  <div>
                    <p className="font-medium">{plan.project.fastighetsbeteckning || plan.project.adress || "Namnlös plan"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(plan.updatedAt).toLocaleString("sv-SE")}</p>
                  </div>
                  <span className="rounded-full bg-primary-light px-3 py-1 text-xs">{prog.done}/{prog.total}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (!active) return null;

  const fields = [
    ["fastighetsbeteckning", "Fastighetsbeteckning"],
    ["adress", "Adress"],
    ["postnr", "Postnr"],
    ["ort", "Ort"],
    ["kontaktperson", "Kontaktperson arbetsplats"],
    ["kontaktMobil", "Mobil"],
    ["kontaktEpost", "E-post"],
    ["bestallareNamn", "Byggherre / beställare"],
    ["bestallareOrgNr", "Beställare org.nr"],
    ["entreprenorNamn", "Entreprenör"],
    ["entreprenorOrgNr", "Entreprenör org.nr"],
    ["basP", "Bas P"],
    ["basU", "Bas U"],
    ["handlaggare", "Handläggare"],
    ["projektledare", "Projektledare"],
    ["skyddsombud", "Skyddsombud"],
    ["startDatum", "Projektstart"],
    ["slutDatum", "Projektavslut"],
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <button type="button" onClick={() => { setView("home"); setActive(null); }} className="mb-2 text-sm text-muted-foreground">← Tillbaka</button>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Redigera arbetsmiljöplan</h1>
          {progress ? <p className="text-sm text-muted-foreground">Progress {progress.done}/{progress.total} ({progress.percent}%)</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={saveActive} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">{savedFlash ? <Check className="size-4" /> : <Save className="size-4" />}{savedFlash ? "Sparad" : "Spara"}</button>
          <button type="button" onClick={() => exportPlan("pdf")} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"><FileText className="size-4" />PDF</button>
          <button type="button" onClick={() => exportPlan("word")} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"><Download className="size-4" />Word</button>
          <button type="button" onClick={deleteActive} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm text-destructive"><Trash2 className="size-4" /></button>
        </div>
      </div>

      <Section title="1. Projektinformation">
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block text-muted-foreground">{label}</span>
              <input className={fieldClass} type={key.includes("Datum") ? "date" : "text"} value={active.project[key]} onChange={(e) => setProject(key, e.target.value)} />
            </label>
          ))}
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-muted-foreground">Entreprenadform</span>
            <select className={fieldClass} value={active.project.entreprenadform} onChange={(e) => setProject("entreprenadform", e.target.value as ProjectInfo["entreprenadform"])}>
              <option value="">Välj…</option>
              <option value="total">Totalentreprenad</option>
              <option value="utforande">Utförandeentreprenad</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-muted-foreground">Projektbeskrivning</span>
            <textarea className={cn(fieldClass, "min-h-24")} value={active.project.projektbeskrivning} onChange={(e) => setProject("projektbeskrivning", e.target.value)} />
          </label>
        </div>
      </Section>

      <PersonTable title="2. Entreprenör – projektorganisation" rows={active.organization} extraLabel="Datum" onChange={(id, patch) => patchList("organization", id, patch)} onAdd={() => addPerson("organization", "Övrig roll")} />
      <PersonTable title="3. Yrkesarbetare (behörighet / ID06)" rows={active.workers} extraLabel="Behörighet / ID06" onChange={(id, patch) => patchList("workers", id, patch)} onAdd={() => addPerson("workers", "Yrkesarbetare")} />
      <PersonTable title="4. Underentreprenörer" rows={active.subcontractors} extraLabel="Org.nr / antal" onChange={(id, patch) => patchList("subcontractors", id, patch)} onAdd={() => addPerson("subcontractors", "Underentreprenör")} />

      <Section title="5. Arbetsmiljöpolicy / notering">
        <textarea className={cn(fieldClass, "min-h-28")} placeholder="Komplettera policyn för projektet…" value={active.policyNote} onChange={(e) => setActive({ ...active, policyNote: e.target.value, updatedAt: new Date().toISOString() })} />
      </Section>

      <CheckTable title="6. Identifiering av arbetsmiljörisker" items={active.checklist} onChange={(id, patch) => patchCheck("checklist", id, patch)} />
      <CheckTable title="7. Skyddsrond" items={active.safetyRounds} onChange={(id, patch) => patchCheck("safetyRounds", id, patch)} />

      <Section title="8. Nödlägesberedskap">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm"><span className="mb-1 block text-muted-foreground">Närmsta akutmottagning</span><input className={fieldClass} value={active.project.narmstaAkut} onChange={(e) => setProject("narmstaAkut", e.target.value)} /></label>
          <label className="block text-sm"><span className="mb-1 block text-muted-foreground">Telefon</span><input className={fieldClass} value={active.project.akutTelefon} onChange={(e) => setProject("akutTelefon", e.target.value)} /></label>
          <label className="block text-sm sm:col-span-2"><span className="mb-1 block text-muted-foreground">Adress</span><input className={fieldClass} value={active.project.akutAdress} onChange={(e) => setProject("akutAdress", e.target.value)} /></label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Akut 112 · Polis 114 14 · Giftinformation 010-456 67 00 · 1177 · AV jour 08-737 15 55</p>
      </Section>

      <PersonTable title="9. Kvittens av arbetsmiljöplan" rows={active.receipts} extraLabel="Datum / signatur" onChange={(id, patch) => patchList("receipts", id, patch)} onAdd={() => addPerson("receipts", "Kvittens")} />

      <Section title="10. Godkännande">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm"><span className="mb-1 block text-muted-foreground">Namn byggherre / projektansvarig</span><input className={fieldClass} value={active.approvalName} onChange={(e) => setActive({ ...active, approvalName: e.target.value, updatedAt: new Date().toISOString() })} /></label>
          <label className="block text-sm"><span className="mb-1 block text-muted-foreground">Datum</span><input className={fieldClass} type="date" value={active.approvalDate} onChange={(e) => setActive({ ...active, approvalDate: e.target.value, updatedAt: new Date().toISOString() })} /></label>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft-sm"><h2 className="mb-4 text-lg font-semibold">{title}</h2>{children}</section>;
}

function PersonTable({ title, rows, extraLabel, onChange, onAdd }: { title: string; rows: PersonRow[]; extraLabel: string; onChange: (id: string, patch: Partial<PersonRow>) => void; onAdd: () => void }) {
  return (
    <Section title={title}>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-2 rounded-xl border border-border/80 p-3 sm:grid-cols-5">
            <input className={fieldClass} placeholder="Roll / företag" value={row.role} onChange={(e) => onChange(row.id, { role: e.target.value })} />
            <input className={fieldClass} placeholder="Namn" value={row.name} onChange={(e) => onChange(row.id, { name: e.target.value })} />
            <input className={fieldClass} placeholder="Mobil" value={row.mobile} onChange={(e) => onChange(row.id, { mobile: e.target.value })} />
            <input className={fieldClass} placeholder="E-post" value={row.email} onChange={(e) => onChange(row.id, { email: e.target.value })} />
            <input className={fieldClass} placeholder={extraLabel} value={row.extra} onChange={(e) => onChange(row.id, { extra: e.target.value })} />
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} className="mt-3 text-sm text-primary">+ Lägg till rad</button>
    </Section>
  );
}

function CheckTable({ title, items, onChange }: { title: string; items: ChecklistItem[]; onChange: (id: string, patch: Partial<ChecklistItem>) => void }) {
  return (
    <Section title={title}>
      <p className="mb-3 text-sm text-muted-foreground">1 = Godkänt · 2 = Ej godkänt · 3 = Ej kontrollerat</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-border/80 p-3">
            <p className="mb-2 text-sm font-medium">{item.title}</p>
            <div className="grid gap-2 sm:grid-cols-4">
              <select className={fieldClass} value={item.status} onChange={(e) => onChange(item.id, { status: e.target.value as ChecklistStatus })}>
                <option value="">Status…</option>
                <option value="ok">{statusLabel("ok")}</option>
                <option value="ej-ok">{statusLabel("ej-ok")}</option>
                <option value="ej-kontrollerat">{statusLabel("ej-kontrollerat")}</option>
              </select>
              <input type="date" className={fieldClass} value={item.date} onChange={(e) => onChange(item.id, { date: e.target.value })} />
              <input className={fieldClass} placeholder="Signatur" value={item.sign} onChange={(e) => onChange(item.id, { sign: e.target.value })} />
              <input className={fieldClass} placeholder="Anteckning / åtgärd" value={item.note} onChange={(e) => onChange(item.id, { note: e.target.value })} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
