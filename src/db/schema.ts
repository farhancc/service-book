import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "editor", "viewer"]);

export const documentCategoryEnum = pgEnum("document_category", [
  "educational",
  "personal",
  "commercial",
  "legal",
  "other",
]);

export const translationKindEnum = pgEnum("translation_kind", [
  "legal",
  "certified",
  "general",
]);

export const pricingUnitEnum = pgEnum("pricing_unit", ["page", "word", "document"]);

export const serviceCategoryEnum = pgEnum("service_category", [
  "business_setup",
  "pro",
  "visa",
  "other",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("viewer"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: varchar("code", { length: 2 }),
  notes: text("notes"),
});

export const documentTypes = pgTable("document_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: documentCategoryEnum("category").notNull().default("other"),
  description: text("description"),
});

/** One step of an attestation route, stored in order. */
export type AttestationStep = {
  title: string;
  authority?: string;
  where?: string;
  days?: string;
  notes?: string;
};

/** Columns every priced entry shares. */
const pricing = {
  priceAed: numeric("price_aed", { precision: 10, scale: 2 }),
  governmentFeesAed: numeric("government_fees_aed", { precision: 10, scale: 2 }),
  priceNote: text("price_note"),
  turnaroundMinDays: integer("turnaround_min_days"),
  turnaroundMaxDays: integer("turnaround_max_days"),
  available: boolean("available").notNull().default(true),
  clientNotes: text("client_notes"),
  internalNotes: text("internal_notes"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  updatedById: integer("updated_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const attestations = pgTable(
  "attestations",
  {
    id: serial("id").primaryKey(),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "restrict" }),
    documentTypeId: integer("document_type_id")
      .notNull()
      .references(() => documentTypes.id, { onDelete: "restrict" }),
    variant: text("variant").notNull().default("Standard"),
    steps: jsonb("steps").$type<AttestationStep[]>().notNull().default([]),
    requiredDocuments: text("required_documents").array().notNull().default([]),
    ...pricing,
  },
  (t) => [uniqueIndex("attestation_unique").on(t.countryId, t.documentTypeId, t.variant)],
);

export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  documentTypeId: integer("document_type_id").references(() => documentTypes.id, {
    onDelete: "set null",
  }),
  kind: translationKindEnum("kind").notNull().default("legal"),
  pricingUnit: pricingUnitEnum("pricing_unit").notNull().default("page"),
  minimumChargeAed: numeric("minimum_charge_aed", { precision: 10, scale: 2 }),
  ...pricing,
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  category: serviceCategoryEnum("category").notNull().default("other"),
  name: text("name").notNull(),
  description: text("description"),
  requirements: text("requirements").array().notNull().default([]),
  ...pricing,
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // attestation | translation | service
  entityId: integer("entity_id").notNull(),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedById: integer("changed_by_id").references(() => users.id, { onDelete: "set null" }),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Role = User["role"];
export type Country = typeof countries.$inferSelect;
export type DocumentType = typeof documentTypes.$inferSelect;
export type Attestation = typeof attestations.$inferSelect;
export type Translation = typeof translations.$inferSelect;
export type Service = typeof services.$inferSelect;
export type EntityType = "attestation" | "translation" | "service";
