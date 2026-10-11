CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS countries_name_trgm_idx ON countries USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS document_types_name_trgm_idx ON document_types USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS attestations_variant_trgm_idx ON attestations USING gin (variant gin_trgm_ops);
CREATE INDEX IF NOT EXISTS translations_source_language_trgm_idx ON translations USING gin (source_language gin_trgm_ops);
CREATE INDEX IF NOT EXISTS translations_target_language_trgm_idx ON translations USING gin (target_language gin_trgm_ops);
CREATE INDEX IF NOT EXISTS services_name_trgm_idx ON services USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS services_description_trgm_idx ON services USING gin (description gin_trgm_ops);
