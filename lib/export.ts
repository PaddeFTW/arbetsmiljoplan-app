import { statusLabel, PRODUCT_TITLE, type PlanRecord } from "@/lib/plan";

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&#38;";
    if (ch === "<") return "&#60;";
    if (ch === ">") return "&#62;";
    if (ch === '"') return "&#34;";
    return "&#39;";
  });
}

export function buildPlanExport(plan: PlanRecord) {
  const p = plan.project;
  const title = `${PRODUCT_TITLE} – ${p.fastighetsbeteckning || p.adress || "projekt"}`;
  const baseFileName = `arbetsmiljoplan-${(p.fastighetsbeteckning || "projekt").replaceAll(" ", "-").toLowerCase()}`;
  const lines = [
    title,
    "",
    "1. Projektinformation",
    `Fastighetsbeteckning: ${p.fastighetsbeteckning || "-"}`,
    `Adress: ${p.adress || "-"}, ${p.postnr || ""} ${p.ort || ""}`.trim(),
    `Kontakt: ${p.kontaktperson || "-"} (${p.kontaktMobil || "-"}, ${p.kontaktEpost || "-"})`,
    `Beställare: ${p.bestallareNamn || "-"} (${p.bestallareOrgNr || "-"})`,
    `Entreprenör: ${p.entreprenorNamn || "-"} (${p.entreprenorOrgNr || "-"})`,
    `Bas P: ${p.basP || "-"}`,
    `Bas U: ${p.basU || "-"}`,
    `Handläggare: ${p.handlaggare || "-"}`,
    `Period: ${p.startDatum || "-"} – ${p.slutDatum || "-"}`,
    `Projektbeskrivning: ${p.projektbeskrivning || "-"}`,
    "",
    "2. Projektorganisation",
    ...plan.organization.map((r) => `- ${r.role}: ${r.name || "-"} | ${r.mobile || "-"} | ${r.email || "-"}`),
    "",
    "3. Yrkesarbetare",
    ...plan.workers.map((r) => `- ${r.name || "-"} | ${r.mobile || "-"} | ${r.extra || "-"}`),
    "",
    "4. Underentreprenörer",
    ...plan.subcontractors.map((r) => `- ${r.name || r.role || "-"} | ${r.mobile || "-"} | ${r.extra || "-"}`),
    "",
    "5. Arbetsmiljöpolicy / notering",
    plan.policyNote || "-",
    "",
    "6. Riskbedömning / kontrollmoment",
    ...plan.checklist.map((item) => `- ${item.title}: ${statusLabel(item.status)} | ${item.date || "-"} | ${item.sign || "-"}${item.note ? " | " + item.note : ""}`),
    "",
    "7. Skyddsrond",
    ...plan.safetyRounds.map((item) => `- ${item.title}: ${statusLabel(item.status)} | ${item.date || "-"} | ${item.sign || "-"}${item.note ? " | " + item.note : ""}`),
    "",
    "8. Nödläge",
    `Närmsta akutmottagning: ${p.narmstaAkut || "-"}`,
    `Telefon: ${p.akutTelefon || "-"}`,
    `Adress: ${p.akutAdress || "-"}`,
    "Akut: 112 | Polis: 114 14 | Giftinformation: 010-456 67 00 | 1177 | AV jour: 08-737 15 55",
    "",
    "9. Kvittens",
    ...plan.receipts.map((r) => `- ${r.role}: ${r.name || "-"} | ${r.extra || "-"}`),
    "",
    `Godkännande: ${plan.approvalName || "-"} ${plan.approvalDate || ""}`,
    `Uppdaterad: ${new Date(plan.updatedAt).toLocaleString("sv-SE")}`,
  ];
  const text = lines.join("\n");
  const html = "<!DOCTYPE html>\n<html lang=\"sv\"><head><meta charset=\"utf-8\" /><title>" + escapeHtml(title) + "</title></head><body><h1>" + escapeHtml(title) + "</h1><pre>" + escapeHtml(text) + "</pre></body></html>";
  return { title, baseFileName, text, html };
}
