CREATE TYPE "public"."document_category" AS ENUM('educational', 'personal', 'commercial', 'legal', 'other');--> statement-breakpoint
CREATE TYPE "public"."pricing_unit" AS ENUM('page', 'word', 'document');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('business_setup', 'pro', 'visa', 'other');--> statement-breakpoint
CREATE TYPE "public"."translation_kind" AS ENUM('legal', 'certified', 'general');--> statement-breakpoint
CREATE TABLE "attestations" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"document_type_id" integer NOT NULL,
	"variant" text DEFAULT 'Standard' NOT NULL,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_documents" text[] DEFAULT '{}' NOT NULL,
	"price_aed" numeric(10, 2),
	"government_fees_aed" numeric(10, 2),
	"price_note" text,
	"turnaround_min_days" integer,
	"turnaround_max_days" integer,
	"available" boolean DEFAULT true NOT NULL,
	"client_notes" text,
	"internal_notes" text,
	"last_verified_at" timestamp with time zone,
	"updated_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(2),
	"notes" text,
	CONSTRAINT "countries_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" "document_category" DEFAULT 'other' NOT NULL,
	"description" text,
	CONSTRAINT "document_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"changed_by_id" integer,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "service_category" DEFAULT 'other' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"requirements" text[] DEFAULT '{}' NOT NULL,
	"price_aed" numeric(10, 2),
	"government_fees_aed" numeric(10, 2),
	"price_note" text,
	"turnaround_min_days" integer,
	"turnaround_max_days" integer,
	"available" boolean DEFAULT true NOT NULL,
	"client_notes" text,
	"internal_notes" text,
	"last_verified_at" timestamp with time zone,
	"updated_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_language" text NOT NULL,
	"target_language" text NOT NULL,
	"document_type_id" integer,
	"kind" "translation_kind" DEFAULT 'legal' NOT NULL,
	"pricing_unit" "pricing_unit" DEFAULT 'page' NOT NULL,
	"minimum_charge_aed" numeric(10, 2),
	"price_aed" numeric(10, 2),
	"government_fees_aed" numeric(10, 2),
	"price_note" text,
	"turnaround_min_days" integer,
	"turnaround_max_days" integer,
	"available" boolean DEFAULT true NOT NULL,
	"client_notes" text,
	"internal_notes" text,
	"last_verified_at" timestamp with time zone,
	"updated_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'viewer' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_changed_by_id_users_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translations" ADD CONSTRAINT "translations_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translations" ADD CONSTRAINT "translations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attestation_unique" ON "attestations" USING btree ("country_id","document_type_id","variant");