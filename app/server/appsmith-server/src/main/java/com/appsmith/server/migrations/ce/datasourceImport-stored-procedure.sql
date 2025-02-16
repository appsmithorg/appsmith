DROP PROCEDURE IF EXISTS appsmith.import_datasources(
		VARCHAR, VARCHAR, JSONB, JSONB, JSONB, JSONB
);

CREATE OR REPLACE PROCEDURE appsmith.import_datasources(
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
		existing_datasource RECORD;
		imported_datasource JSONB;
		existing_datasource_id VARCHAR;
		target_datasource_name VARCHAR;
BEGIN
		-- Create maps for saved datasources by gitSyncId and name
		FOR existing_datasource IN
				SELECT * FROM appsmith.datasource WHERE workspace_id = workspace_id AND deleted_at IS NULL
				LOOP
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
		FOR imported_datasource IN
				SELECT * FROM jsonb_array_elements(imported_datasources)
				LOOP
						-- Check if plugin exists in the plugin_map
						IF NOT EXISTS (SELECT 1 FROM jsonb_each_text(plugin_map) WHERE value = imported_datasource->>'pluginId') THEN
								RAISE EXCEPTION 'Unable to find the plugin: %, available plugins are: %',
												imported_datasource->>'pluginId',
										(SELECT jsonb_object_keys(plugin_map));
						END IF;

						-- Check if existing datasource matches the imported gitSyncId
						IF imported_datasource->>'gitSyncId' IS NOT NULL THEN
								SELECT * INTO existing_datasource FROM appsmith.datasource
								WHERE git_sync_id = imported_datasource->>'gitSyncId';

								IF existing_datasource.id IS NOT NULL THEN
										-- Clear unnecessary fields from imported datasource
										imported_datasource := imported_datasource - 'id' - 'datasource_configuration' - 'plugin_id' - 'environment_id';

										-- Update existing datasource
										UPDATE appsmith.datasource
										SET name = imported_datasource->>'name',
												updated_at = NOW()
										WHERE id = existing_datasource.id;

										-- Add to the output map
										datasource_name_to_id_map := jsonb_set(
												datasource_name_to_id_map,
												('{' || imported_datasource->>'name' || '}'),
												to_jsonb(existing_datasource.id)
												);

										CONTINUE;
								END IF;
						END IF;

						-- Handle cases for new datasources or updates by name
						target_datasource_name := imported_datasource->>'name';

						-- Check if there's an existing datasource with the same name
						SELECT id INTO existing_datasource_id FROM appsmith.datasource
						WHERE name = target_datasource_name AND workspace_id = workspace_id AND deleted_at IS NULL;

						IF existing_datasource_id IS NOT NULL THEN
								-- Update existing datasource
								UPDATE appsmith.datasource
								SET updated_at = NOW()
								WHERE id = existing_datasource_id;

								-- Add to the output map
								datasource_name_to_id_map := jsonb_set(
										datasource_name_to_id_map,
										('{' || target_datasource_name || '}'),
										to_jsonb(existing_datasource_id)
										);

								CONTINUE;
						END IF;

						-- Create new datasource
						INSERT INTO appsmith.datasource (id, name, created_at, updated_at, workspace_id, plugin_id, datasource_configuration)
						VALUES (gen_random_uuid(), target_datasource_name, NOW(), NOW(), workspace_id, imported_datasource->>'pluginId', imported_datasource->'datasource_configuration')
						RETURNING id INTO existing_datasource_id;

						-- Add to the output map
						datasource_name_to_id_map := jsonb_set(
								datasource_name_to_id_map,
								('{' || target_datasource_name || '}'),
								to_jsonb(existing_datasource_id)
								);

				END LOOP;
END;
$$;
