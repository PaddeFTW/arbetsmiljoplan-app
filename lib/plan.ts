export type ChecklistStatus = "ok" | "ej-ok" | "ej-kontrollerat" | "";

export interface ProjectInfo {
  fastighetsbeteckning: string;
  adress: string;
  postnr: string;
  ort: string;
  kontaktperson: string;
  kontaktMobil: string;
  kontaktEpost: string;
  bestallareNamn: string;
  bestallareOrgNr: string;
  entreprenorNamn: string;
  entreprenorOrgNr: string;
  projektledare: string;
  kma: string;
  arbetsledare: string;
  skyddsombud: string;
  entreprenadform: "total" | "utforande" | "";
  projektbeskrivning: string;
  startDatum: string;
  slutDatum: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  status: ChecklistStatus;
  date: string;
  sign: string;
  note: string;
}

export interface PlanRecord {
  id: string;
  updatedAt: string;
  project: ProjectInfo;
  policyNote: string;
  checklist: ChecklistItem[];
}

export const STORAGE_KEY = "arbetsmiljoplan-app-v1";
export const PRODUCT_TITLE = "Arbetsmiljöplan";

export const emptyProject: ProjectInfo = {
  fastighetsbeteckning: "",
  adress: "",
  postnr: "",
  ort: "",
  kontaktperson: "",
  kontaktMobil: "",
  kontaktEpost: "",
  bestallareNamn: "",
  bestallareOrgNr: "",
  entreprenorNamn: "",
  entreprenorOrgNr: "",
  projektledare: "",
  kma: "",
  arbetsledare: "",
  skyddsombud: "",
  entreprenadform: "",
  projektbeskrivning: "",
  startDatum: "",
  slutDatum: "",
};

export const defaultChecklist: ChecklistItem[] = [
  { id: "riskbedomning", title: "Riskbedömning genomförd för arbetsmoment", status: "", date: "", sign: "", note: "" },
  { id: "skyddsutrustning", title: "Personlig skyddsutrustning kravställd", status: "", date: "", sign: "", note: "" },
  { id: "introduktion", title: "Arbetsmiljöintroduktion för nya på plats", status: "", date: "", sign: "", note: "" },
  { id: "fallskydd", title: "Fallskydd planerat där höjdarbete förekommer", status: "", date: "", sign: "", note: "" },
  { id: "tunga_lyft", title: "Tunga lyft och ergonomi bedömda", status: "", date: "", sign: "", note: "" },
  { id: "maskiner", title: "Maskiner och verktyg i säkert skick", status: "", date: "", sign: "", note: "" },
  { id: "el", title: "Elsäkerhet och provisorisk el kontrollerad", status: "", date: "", sign: "", note: "" },
  { id: "brand", title: "Brandskydd och utrömningsvägar kända", status: "", date: "", sign: "", note: "" },
  { id: "forsta_hjalpen", title: "Första hjälpen och nödnummer anslagna", status: "", date: "", sign: "", note: "" },
  { id: "kem_exponering", title: "Exponering för damm/kemikalier minimerad", status: "", date: "", sign: "", note: "" },
  { id: "trafik", title: "Trafik och logistik på arbetsplatsen säkrad", status: "", date: "", sign: "", note: "" },
  { id: "skyddsombud", title: "Skyddsombud informerat och delaktigt", status: "", date: "", sign: "", note: "" },
  { id: "tillbud", title: "Rutin för tillbud och olyckor känd", status: "", date: "", sign: "", note: "" },
  { id: "samordning", title: "BAS-P/BAS-U-samordning fungerar", status: "", date: "", sign: "", note: "" },
  { id: "uppfoljning_am", title: "Arbetsmiljöuppföljning under projektet", status: "", date: "", sign: "", note: "" }
];

export function createEmptyPlan(): PlanRecord {
  return {
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
    project: { ...emptyProject },
    policyNote: "",
    checklist: defaultChecklist.map((item) => ({ ...item })),
  };
}

export function loadPlans(): PlanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PlanRecord[];
  } catch {
    return [];
  }
}

export function savePlans(plans: PlanRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function statusLabel(status: ChecklistStatus) {
  switch (status) {
    case "ok":
      return "1 – Godkänt";
    case "ej-ok":
      return "2 – Ej godkänt";
    case "ej-kontrollerat":
      return "3 – Ej kontrollerat";
    default:
      return "—";
  }
}

export function planProgress(plan: PlanRecord) {
  const done = plan.checklist.filter((c) => c.status === "ok").length;
  return {
    done,
    total: plan.checklist.length,
    percent: Math.round((done / plan.checklist.length) * 100),
  };
}
