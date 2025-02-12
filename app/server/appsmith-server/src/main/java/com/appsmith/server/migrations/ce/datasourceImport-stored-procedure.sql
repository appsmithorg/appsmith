CREATE OR REPLACE PROCEDURE import_datasources(
		artifact_id VARCHAR,
		workspace_id VARCHAR,
		plugin_map JSONB,
		imported_datasources JSONB,
		decrypted_fields JSONB,
		OUT datasource_name_to_id_map JSONB
)
LANGUAGE PLPGSQL
AS $$
DECLARE
saved_datasources_git_id_to_datasource_map JSONB := '{}';
		saved_datasources_name_datasource_map JSONB := '{}';
		existing_datasource_cursor CURSOR FOR
SELECT * FROM datasources WHERE workspace_id = workspace_id AND deleted_at IS NULL;
existing_datasource RECORD;
		imported_datasource JSONB;
		existing_datasource_id VARCHAR;
		target_datasource_name VARCHAR;
BEGIN
		-- Create maps for saved datasources by gitSyncId and name
FOR existing_datasource IN existing_datasource_cursor LOOP
				IF existing_datasource.git_sync_id IS NOT NULL THEN
						saved_datasources_git_id_to_datasource_map := jsonb_set(
								saved_datasources_git_id_to_datasource_map,
								('{' || existing_datasource.git_sync_id || '}'),
								to_jsonb(existing_datasource)
						);
END IF;
				IF existing_datasource.name IS NOT NULL THEN
						saved_datasources_name_datasource_map := jsonb_set(
								saved_datasources_name_datasource_map,
								('{' || existing_datasource.name || '}'),
								to_jsonb(existing_datasource)
						);
END IF;
END LOOP;

		-- Initialize the output map
		datasource_name_to_id_map := '{}';

		-- Loop through imported datasources
FOR imported_datasource IN SELECT * FROM jsonb_array_elements(imported_datasources) LOOP
																				-- Check if plugin exists in the plugin_map
		IF NOT EXISTS (SELECT 1 FROM jsonb_each_text(plugin_map) WHERE value = imported_datasource->>'pluginId') THEN
						RAISE EXCEPTION 'Unable to find the plugin: %, available plugins are: %',
								imported_datasource->>'pluginId',
								(SELECT jsonb_object_keys(plugin_map));
END IF;

				-- Check if existing datasource matches the imported gitSyncId
				IF imported_datasource->>'gitSyncId' IS NOT NULL THEN
						existing_datasource := (
								SELECT * FROM jsonb_to_record(saved_datasources_git_id_to_datasource_map->imported_datasource->>'gitSyncId')
						);
						IF existing_datasource IS NOT NULL THEN
								-- Update existing datasource
								IF NOT importing_meta_dto.permission_provider.has_edit_permission(existing_datasource) THEN
										RAISE EXCEPTION 'Trying to update datasource % without edit permission',
												existing_datasource.name;
END IF;

								-- Clear unnecessary fields from imported datasource
								imported_datasource.id := NULL;
								imported_datasource.datasource_configuration := NULL;
								imported_datasource.plugin_id := NULL;
								imported_datasource.environment_id := NULL;

								-- Create or update the datasource
INSERT INTO datasources (name, created_at, updated_at, ...)
VALUES (imported_datasource->>'name', NOW(), NOW(), ...)
		ON CONFLICT (name, workspace_id) DO UPDATE
																						SET ...;

-- Add dry run queries for the datasource
-- (Assume this operation updates some dry run queries collection)
PERFORM add_dry_ops_for_entity('SAVE', mapped_importable_resources_dto.datasource_dry_run_queries, imported_datasource);

								-- Add to the output map
								datasource_name_to_id_map := jsonb_set(
										datasource_name_to_id_map,
										('{' || imported_datasource->>'name' || '}'),
										to_jsonb((SELECT id FROM datasources WHERE name = imported_datasource->>'name' AND workspace_id = workspace_id))
								);

CONTINUE;
END IF;
END IF;

				-- Handle cases for new datasources or updates by name
				imported_datasource_name := imported_datasource->>'name';

				-- Check if there's an existing datasource with the same name
				existing_datasource_id := (SELECT id FROM datasources WHERE name = imported_datasource_name AND workspace_id = workspace_id AND deleted_at IS NULL);
				IF existing_datasource_id IS NOT NULL THEN
						-- Update existing datasource
						...

						-- Add dry run queries for the datasource
						PERFORM add_dry_ops_for_entity('UPDATE', mapped_importable_resources_dto.datasource_dry_run_queries, imported_datasource);

						-- Add to the output map
						datasource_name_to_id_map := jsonb_set(
								datasource_name_to_id_map,
								('{' || imported_datasource_name || '}'),
								to_jsonb(existing_datasource_id)
						);

CONTINUE;
END IF;

				-- Create new datasource
...

				-- Add dry run queries for the datasource
				PERFORM add_dry_ops_for_entity('SAVE', mapped_importable_resources_dto.datasource_dry_run_queries, imported_datasource);

				-- Add to the output map
				datasource_name_to_id_map := jsonb_set(
						datasource_name_to_id_map,
						('{' || imported_datasource_name || '}'),
						to_jsonb((SELECT id FROM datasources WHERE name = imported_datasource_name AND workspace_id = workspace_id))
				);
END LOOP;
END;
$$;
