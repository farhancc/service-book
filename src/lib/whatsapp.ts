import type { AttestationStep } from "@/db/schema";
import { formatAed, formatTurnaround } from "./format";

/**
 * Client-facing summaries for pasting into WhatsApp.
 * Internal notes are never included. *bold* is WhatsApp formatting.
 */

type Priced = {
  priceAed: string | null;
  governmentFeesAed: string | null;
  priceNote: string | null;
  turnaroundMinDays: number | null;
  turnaroundMaxDays: number | null;
  clientNotes: string | null;
};

function priceLines(p: Priced, includePrice: boolean, unitSuffix = ""): string[] {
  const lines: string[] = [];
  const turnaround = formatTurnaround(p.turnaroundMinDays, p.turnaroundMaxDays);
  if (turnaround) lines.push(`*Time:* ${turnaround}`);
  if (includePrice) {
    const price = formatAed(p.priceAed);
    const fees = formatAed(p.governmentFeesAed);
    if (price) lines.push(`*Our fee:* ${price}${unitSuffix}`);
    if (fees) lines.push(`*Government fees:* ${fees}`);
    if (p.priceNote) lines.push(p.priceNote);
  }
  return lines;
}

function list(title: string, items: string[]): string[] {
  if (items.length === 0) return [];
  return ["", `*${title}*`, ...items.map((i) => `• ${i}`)];
}

export function attestationMessage(
  a: Priced & { steps: AttestationStep[]; requiredDocuments: string[]; variant: string },
  country: string,
  documentType: string,
  includePrice: boolean,
): string {
  const heading =
    a.variant && a.variant !== "Standard"
      ? `*${documentType} attestation — ${country} (${a.variant})*`
      : `*${documentType} attestation — ${country}*`;
  const lines = [heading, ""];
  if (a.steps.length) {
    lines.push("*Process*");
    a.steps.forEach((s, i) => {
      const where = s.where ? ` (${s.where})` : "";
      lines.push(`${i + 1}. ${s.title}${where}`);
    });
  }
  lines.push(...list("Documents needed", a.requiredDocuments));
  const priced = priceLines(a, includePrice);
  if (priced.length) lines.push("", ...priced);
  if (a.clientNotes) lines.push("", a.clientNotes);
  return lines.join("\n").trim();
}

export function translationMessage(
  t: Priced & { sourceLanguage: string; targetLanguage: string; minimumChargeAed: string | null },
  kindLabel: string,
  unitLabel: string,
  documentType: string | null,
  includePrice: boolean,
): string {
  const doc = documentType ? ` — ${documentType}` : "";
  const lines = [`*${kindLabel} translation: ${t.sourceLanguage} → ${t.targetLanguage}${doc}*`, ""];
  lines.push(...priceLines(t, includePrice, ` ${unitLabel}`));
  if (includePrice) {
    const min = formatAed(t.minimumChargeAed);
    if (min) lines.push(`*Minimum charge:* ${min}`);
  }
  if (t.clientNotes) lines.push("", t.clientNotes);
  return lines.join("\n").trim();
}

export function serviceMessage(
  s: Priced & { name: string; description: string | null; requirements: string[] },
  includePrice: boolean,
): string {
  const lines = [`*${s.name}*`];
  if (s.description) lines.push("", s.description);
  lines.push(...list("What we need from you", s.requirements));
  const priced = priceLines(s, includePrice);
  if (priced.length) lines.push("", ...priced);
  if (s.clientNotes) lines.push("", s.clientNotes);
  return lines.join("\n").trim();
}
