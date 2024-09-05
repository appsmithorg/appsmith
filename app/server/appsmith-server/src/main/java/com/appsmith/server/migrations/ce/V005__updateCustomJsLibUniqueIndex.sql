DROP INDEX IF EXISTS custom_js_libs_uidstring_key;
CREATE UNIQUE INDEX IF NOT EXISTS custom_js_libs_uidstring_key ON customjslib(uid_string) WHERE deleted_at IS NULL;
