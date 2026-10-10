/**
 * Seeds reference data and the first admin.
 *
 *   SEED_ADMIN_EMAIL=you@company.com SEED_ADMIN_PASSWORD='a-strong-password' npm run db:seed
 *   npm run db:seed -- --sample   # also adds clearly marked sample entries
 *
 * Safe to run more than once: existing rows are left alone.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const COUNTRIES: [string, string][] = [
  ["India", "IN"], ["Pakistan", "PK"], ["Bangladesh", "BD"], ["Sri Lanka", "LK"],
  ["Nepal", "NP"], ["Philippines", "PH"], ["Indonesia", "ID"], ["Egypt", "EG"],
  ["Jordan", "JO"], ["Lebanon", "LB"], ["Syria", "SY"], ["Sudan", "SD"],
  ["Kenya", "KE"], ["Nigeria", "NG"], ["Ethiopia", "ET"], ["United Kingdom", "GB"],
  ["United States", "US"], ["Canada", "CA"], ["Australia", "AU"], ["China", "CN"],
  ["Russia", "RU"], ["Ukraine", "UA"], ["Iran", "IR"], ["Turkey", "TR"],
  ["United Arab Emirates", "AE"],
];

const DOCUMENT_TYPES: [string, schema.DocumentType["category"]][] = [
  ["Degree certificate", "educational"],
  ["Diploma certificate", "educational"],
  ["Transcript / mark sheet", "educational"],
  ["School certificate (10th / 12th)", "educational"],
  ["Birth certificate", "personal"],
  ["Marriage certificate", "personal"],
  ["Divorce certificate", "personal"],
  ["Death certificate", "personal"],
  ["Police clearance certificate", "personal"],
  ["Medical report", "personal"],
  ["Power of attorney", "legal"],
  ["Court judgment", "legal"],
  ["Affidavit", "legal"],
  ["Certificate of incorporation", "commercial"],
  ["Memorandum / articles of association", "commercial"],
  ["Commercial invoice", "commercial"],
  ["Certificate of origin", "commercial"],
  ["Board resolution", "commercial"],
];

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 10) throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters.");
    await db
      .insert(schema.users)
      .values({
        name: process.env.SEED_ADMIN_NAME ?? "Admin",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "admin",
      })
      .onConflictDoNothing();
    console.log(`Admin ready: ${email}`);
  } else {
    console.log("Skipped admin (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one).");
  }

  await db
    .insert(schema.countries)
    .values(COUNTRIES.map(([name, code]) => ({ name, code })))
    .onConflictDoNothing();
  await db
    .insert(schema.documentTypes)
    .values(DOCUMENT_TYPES.map(([name, category]) => ({ name, category })))
    .onConflictDoNothing();
  console.log(`Countries: ${COUNTRIES.length}, document types: ${DOCUMENT_TYPES.length}`);

  if (process.argv.includes("--sample")) await seedSamples();
  await pool.end();
}

/** Example rows so the screens aren't empty. Every one is marked SAMPLE and unverified. */
async function seedSamples() {
  const country = await db.query.countries.findFirst({ where: (c, { eq }) => eq(c.name, "India") });
  const degree = await db.query.documentTypes.findFirst({
    where: (d, { eq }) => eq(d.name, "Degree certificate"),
  });
  const birth = await db.query.documentTypes.findFirst({
    where: (d, { eq }) => eq(d.name, "Birth certificate"),
  });
  if (!country || !degree || !birth) return;

  await db
    .insert(schema.attestations)
    .values({
      countryId: country.id,
      documentTypeId: degree.id,
      variant: "Standard",
      steps: [
        { title: "Notary", where: "Home country", days: "1–2", notes: "SAMPLE — replace with your process" },
        { title: "State verification", authority: "State education dept.", where: "Home country", days: "5–10" },
        { title: "Ministry of External Affairs", where: "Home country", days: "2–4" },
        { title: "UAE Embassy", where: "Home country", days: "3–5" },
        { title: "MOFA", authority: "UAE Ministry of Foreign Affairs", where: "UAE", days: "1–2" },
      ],
      requiredDocuments: ["Original degree certificate", "Passport copy", "Visa copy (if in UAE)"],
      turnaroundMinDays: 15,
      turnaroundMaxDays: 25,
      clientNotes: "SAMPLE entry. Edit or delete it before sharing with clients.",
      internalNotes: "SAMPLE — not real pricing.",
    })
    .onConflictDoNothing();

  await db.insert(schema.translations).values({
    sourceLanguage: "English",
    targetLanguage: "Arabic",
    documentTypeId: birth.id,
    kind: "legal",
    pricingUnit: "page",
    turnaroundMinDays: 1,
    turnaroundMaxDays: 2,
    internalNotes: "SAMPLE — not real pricing.",
  });

  await db.insert(schema.services).values({
    category: "business_setup",
    name: "Mainland company formation (sample)",
    description: "SAMPLE — describe the package your company sells.",
    requirements: ["Passport copy", "Visa or entry stamp", "Proposed trade names"],
    internalNotes: "SAMPLE — not real pricing.",
  });
  console.log("Sample entries added.");
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
