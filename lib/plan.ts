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
  basP: string;
  basU: string;
  handlaggare: string;
  entreprenadform: "total" | "utforande" | "";
  projektbeskrivning: string;
  startDatum: string;
  slutDatum: string;
  narmstaAkut: string;
  akutTelefon: string;
  akutAdress: string;
}

export interface PersonRow {
  id: string;
  role: string;
  name: string;
  mobile: string;
  email: string;
  extra: string;
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
  organization: PersonRow[];
  workers: PersonRow[];
  subcontractors: PersonRow[];
  checklist: ChecklistItem[];
  safetyRounds: ChecklistItem[];
  receipts: PersonRow[];
  approvalName: string;
  approvalDate: string;
}

export const STORAGE_KEY = "arbetsmiljoplan-app-v2";
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
  basP: "",
  basU: "",
  handlaggare: "",
  entreprenadform: "",
  projektbeskrivning: "",
  startDatum: "",
  slutDatum: "",
  narmstaAkut: "",
  akutTelefon: "",
  akutAdress: "",
};

function row(role = "", extraLabel = ""): PersonRow {
  return { id: crypto.randomUUID(), role, name: "", mobile: "", email: "", extra: extraLabel };
}
function item(id: string, title: string): ChecklistItem {
  return { id, title, status: "", date: "", sign: "", note: "" };
}

export const defaultOrganization: PersonRow[] = [
  row("Projektchef"), row("Platschef"), row("Bas P"), row("Bas U"), row("Kontrollansvarig"),
  row("Kvalitetsansvarig"), row("Arbetsmiljösamordnare"), row("Arbetsmiljöansvarig"),
  row("Huvudskyddsombud"), row("Skyddsombud"), row("Arbetsledare"),
];

export const defaultChecklist: ChecklistItem[] = [
  item("fall", "Åtgärder mot fall till lägre nivå (2 m eller mer) – AFS 2023:10"),
  item("stallning", "Ställningar godkända och märkta"),
  item("tak", "Takarbete och fallskydd planerat"),
  item("lyft", "Lyftanordningar och lyftredskap utan skador"),
  item("maskiner", "Maskiner med skydd på plats"),
  item("el", "Tillfällig el och jordfelsbrytare"),
  item("heta", "Heta arbeten – tillstånd och utbildning"),
  item("brand", "Brandskydd och utrömning"),
  item("buller", "Buller och hörselskydd"),
  item("damm", "Damm och andningsskydd"),
  item("kem", "Farliga ämnen uppmärkta, SDS tillgängliga"),
  item("ergonomi", "Ergonomiska hjälpmedel"),
  item("trafik", "Trafik vid arbetsplatsen"),
  item("ordning", "Allmän ordning och städning"),
  item("tillbud", "Rutin för tillbud och olyckor"),
];

export const defaultSafetyRounds: ChecklistItem[] = [
  item("sr1", "Allmän ordning (städning)"),
  item("sr2", "Arbetsmiljö (trivsel, kränkande särbehandling)"),
  item("sr3", "Avstängningsanordningar"),
  item("sr4", "Brandskydd"),
  item("sr5", "Buller"),
  item("sr6", "Fallskydd"),
  item("sr7", "Farliga ämnen"),
  item("sr8", "Lyftanordningar / lyftredskap"),
  item("sr9", "Ställningar"),
  item("sr10", "Tillfällig el"),
];

export function createEmptyPlan(): PlanRecord {
  return {
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
    project: { ...emptyProject },
    policyNote: "",
    organization: defaultOrganization.map((r) => ({ ...r, id: crypto.randomUUID() })),
    workers: [row("", "ID06 / behörighet")],
    subcontractors: [row("Underentreprenör", "org.nr / antal")],
    checklist: defaultChecklist.map((c) => ({ ...c })),
    safetyRounds: defaultSafetyRounds.map((c) => ({ ...c })),
    receipts: [row("Medarbetare"), row("Underentreprenör")],
    approvalName: "",
    approvalDate: "",
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
    case "ok": return "1 – Godkänt";
    case "ej-ok": return "2 – Ej godkänt";
    case "ej-kontrollerat": return "3 – Ej kontrollerat";
    default: return "—";
  }
}

export function planProgress(plan: PlanRecord) {
  const all = [...plan.checklist, ...plan.safetyRounds];
  const done = all.filter((c) => c.status === "ok").length;
  return { done, total: all.length, percent: all.length ? Math.round((done / all.length) * 100) : 0 };
}
