-- index naming convention: (pkey reserved for primary keys)
-- unique constraint index - table_name_column_name_key
-- performance improvement index - table_name_column_name_idx
-- Only 63 chars are supported for index name in postgres

-- custom_js_libs
DROP INDEX IF EXISTS custom_js_libs_name_idx;
CREATE UNIQUE INDEX IF NOT EXISTS custom_js_libs_uidstring_key ON customjslib(uid_string);

-- new-action
CREATE INDEX IF NOT EXISTS new_action_unpublished_datasource_id_idx
		ON new_action(((unpublished_action ->> 'datasource')::jsonb ->> 'id'))
		WHERE deleted_at IS NULL AND unpublished_action IS NOT NULL AND unpublished_action ->> 'datasource' IS NOT NULL;
CREATE INDEX IF NOT EXISTS new_action_published_datasource_id_idx
		on new_action(((published_action ->> 'datasource')::jsonb ->> 'id'))
		WHERE deleted_at IS NULL AND published_action IS NOT NULL AND published_action ->> 'datasource' IS NOT NULL;

-- plugin
CREATE INDEX IF NOT EXISTS plugin_type_idx ON plugin (type);

-- workspace
CREATE INDEX IF NOT EXISTS workspace_policy_manage_workspace_tanantId_idx
		ON workspace (((policy_map ->> 'manage:workspaces')::jsonb ->> 'permissionGroups'), tenant_id)
		WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS workspace_policy_read_workspace_tanantId_idx
		ON workspace (((policy_map ->> 'read:workspaces')::jsonb ->> 'permissionGroups'), tenant_id)
		WHERE deleted_at IS NULL;
