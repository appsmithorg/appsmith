UPDATE flyway_schema_history
SET checksum = NULL
WHERE version IS NOT NULL;
