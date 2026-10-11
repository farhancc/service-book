ALTER TABLE "attestations" ADD COLUMN "cost_aed" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "cost_aed" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "translations" ADD COLUMN "code" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "translations" ADD COLUMN "cost_aed" numeric(10, 2);