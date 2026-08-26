import { statusLabel, PRODUCT_TITLE, type PlanRecord } from "@/lib/plan";

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
    `Kontaktperson: ${p.kontaktperson || "-"} (${p.kontaktMobil || "-"}, ${p.kontaktEpost || "-"})`,
    `Beställare: ${p.bestallareNamn || "-"} (${p.bestallareOrgNr || "-"})`,
    `Entreprenör: ${p.entreprenorNamn || "-"} (${p.entreprenorOrgNr || "-"})`,
    `Projektledare: ${p.projektledare || "-"}`,
    `KMA: ${p.kma || "-"}`,
    `Arbetsledare: ${p.arbetsledare || "-"}`,
    `Skyddsombud: ${p.skyddsombud || "-"}`,
    `Entreprenadform: ${
      p.entreprenadform === "total"
        ? "Totalentreprenad"
        : p.entreprenadform === "utforande"
          ? "Utförandeentreprenad"
          : "-"
    }`,
    `Period: ${p.startDatum || "-"} – ${p.slutDatum || "-"}`,
    `Projektbeskrivning: ${p.projektbeskrivning || "-"}`,
    "",
    "2. Arbetsmiljöpolicy / notering",
    p.policyNote || "-",
    "",
    "3. Arbetsmiljökontrollmoment",
    ...plan.checklist.map(
      (item) =>
        `- ${item.title}: ${statusLabel(item.status)} | Datum: ${item.date || "-"} | Sign: ${item.sign || "-"}${
          item.note ? ` | Not: ${item.note}` : ""
        }`,
    ),
    "",
    `Uppdaterad: ${new Date(plan.updatedAt).toLocaleString("sv-SE")}`,
  ];

  const text = lines.join("\n");
  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #18181b; line-height: 1.5; }
    h1 { font-size: 24px; margin-bottom: 24px; }
    pre { white-space: pre-wrap; font-family: inherit; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <pre>${escapeHtml(text)}</pre>
</body>
</html>`;

  return { title, baseFileName, text, html };
}
