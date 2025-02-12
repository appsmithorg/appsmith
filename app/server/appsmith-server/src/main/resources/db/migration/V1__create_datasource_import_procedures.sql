-- Function to check if a datasource exists by name and workspace
CREATE OR REPLACE FUNCTION check_datasource_exists(
		p_name VARCHAR,
		p_workspace_id VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
		RETURN EXISTS (
				SELECT 1 FROM datasource
				WHERE name = p_name
				AND workspace_id = p_workspace_id
				AND deleted_at IS NULL
		);
END;
$$ LANGUAGE plpgsql;

-- Function to get existing datasource by git sync id
CREATE OR REPLACE FUNCTION get_datasource_by_git_sync_id(
		p_git_sync_id VARCHAR
) RETURNS TABLE (
		id VARCHAR,
		name VARCHAR,
		workspace_id VARCHAR,
		plugin_id VARCHAR,
		git_sync_id VARCHAR,
		is_configured BOOLEAN
) AS $$
BEGIN
		RETURN QUERY
		SELECT d.id, d.name, d.workspace_id, d.plugin_id, d.git_sync_id, d.is_configured
		FROM datasource d
		WHERE d.git_sync_id = p_git_sync_id
		AND d.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to create unique datasource name
CREATE OR REPLACE FUNCTION generate_unique_datasource_name(
		p_base_name VARCHAR,
		p_workspace_id VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
		new_name VARCHAR;
		counter INTEGER := 1;
BEGIN
		new_name := p_base_name;
		WHILE EXISTS (
				SELECT 1 FROM datasource
				WHERE name = new_name
				AND workspace_id = p_workspace_id
				AND deleted_at IS NULL
		) LOOP
				new_name := p_base_name || ' #' || counter;
				counter := counter + 1;
		END LOOP;
		RETURN new_name;
END;
$$ LANGUAGE plpgsql;

-- Validation function for datasource fields
CREATE OR REPLACE FUNCTION validate_datasource_fields(
		p_name VARCHAR,
		p_workspace_id VARCHAR,
		p_plugin_id VARCHAR,
		p_environment_id VARCHAR,
		p_datasource_config JSONB
) RETURNS TABLE (
		is_valid BOOLEAN,
		error_message TEXT
) AS $$
BEGIN
		-- Name validation
		IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
				RETURN QUERY SELECT FALSE, 'Datasource name cannot be empty';
				RETURN;
		END IF;

		-- Workspace validation
		IF p_workspace_id IS NULL OR NOT EXISTS (
				SELECT 1 FROM workspace WHERE id = p_workspace_id AND deleted_at IS NULL
		) THEN
				RETURN QUERY SELECT FALSE, 'Invalid workspace ID';
				RETURN;
		END IF;

		-- Plugin validation
		IF p_plugin_id IS NULL OR NOT EXISTS (
				SELECT 1 FROM plugin WHERE id = p_plugin_id AND deleted_at IS NULL
		) THEN
				RETURN QUERY SELECT FALSE, 'Invalid plugin ID';
				RETURN;
		END IF;

		-- Environment validation
		IF p_environment_id IS NULL OR NOT EXISTS (
				SELECT 1 FROM environment WHERE id = p_environment_id AND deleted_at IS NULL
		) THEN
				RETURN QUERY SELECT FALSE, 'Invalid environment ID';
				RETURN;
		END IF;

		-- Configuration validation
		IF p_datasource_config IS NULL OR p_datasource_config = '{}'::jsonb THEN
				RETURN QUERY SELECT FALSE, 'Datasource configuration cannot be empty';
				RETURN;
		END IF;

		RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Main procedure to import datasource
CREATE OR REPLACE PROCEDURE import_datasource_with_validation(
		p_datasource_list JSONB,  -- Array of datasource objects
		p_workspace_id VARCHAR,
		p_plugin_map JSONB,       -- Map of plugin IDs
		OUT imported_datasource_ids VARCHAR[],
		OUT error_message TEXT
) LANGUAGE plpgsql AS $$
DECLARE
		datasource_record RECORD;
		v_plugin_id VARCHAR;
		v_unique_name VARCHAR;
		v_new_datasource_id VARCHAR;
		v_validation RECORD;
BEGIN
		-- Initialize array for storing created datasource IDs
		imported_datasource_ids := ARRAY[]::VARCHAR[];

		-- Validate workspace
		IF NOT EXISTS (SELECT 1 FROM workspace WHERE id = p_workspace_id AND deleted_at IS NULL) THEN
				error_message := 'Invalid workspace ID';
				RETURN;
		END IF;

		-- Iterate through datasource list
		FOR datasource_record IN SELECT * FROM jsonb_array_elements(p_datasource_list)
		LOOP
				-- Extract plugin ID from plugin map
				v_plugin_id := p_plugin_map->>datasource_record->>'pluginId';

				-- Validate plugin
				IF v_plugin_id IS NULL OR NOT EXISTS (
						SELECT 1 FROM plugin WHERE id = v_plugin_id AND deleted_at IS NULL
				) THEN
						error_message := 'Invalid plugin ID for datasource: ' || datasource_record->>'name';
						RETURN;
				END IF;

				-- Check for existing datasource with same git sync id
				IF datasource_record->>'gitSyncId' IS NOT NULL
				AND EXISTS (
						SELECT 1 FROM datasource
						WHERE git_sync_id = datasource_record->>'gitSyncId'
						AND workspace_id = p_workspace_id
						AND deleted_at IS NULL
				) THEN
						-- Update existing datasource
						UPDATE datasource SET
								name = datasource_record->>'name',
								plugin_id = v_plugin_id,
								environment_id = datasource_record->>'environmentId',
								datasource_configuration = datasource_record->'datasourceConfiguration',
								is_configured = (datasource_record->>'isConfigured')::boolean,
								updated_at = NOW()
						WHERE git_sync_id = datasource_record->>'gitSyncId'
						AND workspace_id = p_workspace_id
						RETURNING id INTO v_new_datasource_id;

						-- Update datasource storage
						UPDATE datasource_storage SET
								datasource_configuration = datasource_record->'datasourceConfiguration',
								plugin_id = v_plugin_id,
								updated_at = NOW()
						WHERE datasource_id = v_new_datasource_id
						AND environment_id = datasource_record->>'environmentId';
				ELSE
						-- Generate unique name
						v_unique_name := datasource_record->>'name';
						WHILE EXISTS (
								SELECT 1 FROM datasource
								WHERE name = v_unique_name
								AND workspace_id = p_workspace_id
								AND deleted_at IS NULL
						) LOOP
								v_unique_name := v_unique_name || ' #' || floor(random() * 1000)::text;
						END LOOP;

						-- Insert new datasource
						INSERT INTO datasource (
								id,
								name,
								workspace_id,
								plugin_id,
								git_sync_id,
								environment_id,
								datasource_configuration,
								is_configured,
								created_at,
								updated_at
						) VALUES (
								gen_random_uuid()::VARCHAR,
								v_unique_name,
								p_workspace_id,
								v_plugin_id,
								datasource_record->>'gitSyncId',
								datasource_record->>'environmentId',
								datasource_record->'datasourceConfiguration',
								(datasource_record->>'isConfigured')::boolean,
								NOW(),
								NOW()
						) RETURNING id INTO v_new_datasource_id;

						-- Insert datasource storage
						INSERT INTO datasource_storage (
								id,
								datasource_id,
								environment_id,
								datasource_configuration,
								plugin_id,
								workspace_id,
								created_at,
								updated_at
						) VALUES (
								gen_random_uuid()::VARCHAR,
								v_new_datasource_id,
								datasource_record->>'environmentId',
								datasource_record->'datasourceConfiguration',
								v_plugin_id,
								p_workspace_id,
								NOW(),
								NOW()
						);
				END IF;

				-- Add datasource ID to return array
				imported_datasource_ids := array_append(imported_datasource_ids, v_new_datasource_id);
		END LOOP;
END;
$$;

-- Function to update existing datasource
CREATE OR REPLACE PROCEDURE update_datasource(
		p_datasource_id VARCHAR,
		p_name VARCHAR,
		p_workspace_id VARCHAR,
		p_plugin_id VARCHAR,
		p_environment_id VARCHAR,
		p_datasource_config JSONB,
		p_is_configured BOOLEAN,
		OUT error_message TEXT
) AS $$
DECLARE
		v_validation RECORD;
BEGIN
		-- Validate input fields
		SELECT * INTO v_validation
		FROM validate_datasource_fields(p_name, p_workspace_id, p_plugin_id, p_environment_id, p_datasource_config);

		IF NOT v_validation.is_valid THEN
				error_message := v_validation.error_message;
				RETURN;
		END IF;

		-- Check if datasource exists
		IF NOT EXISTS (
				SELECT 1 FROM datasource
				WHERE id = p_datasource_id
				AND deleted_at IS NULL
		) THEN
				error_message := 'Datasource not found';
				RETURN;
		END IF;

		-- Update datasource with validation
		BEGIN
				UPDATE datasource SET
						name = p_name,
						workspace_id = p_workspace_id,
						plugin_id = p_plugin_id,
						environment_id = p_environment_id,
						datasource_configuration = p_datasource_config,
						is_configured = p_is_configured,
						updated_at = NOW()
				WHERE id = p_datasource_id;
		EXCEPTION WHEN OTHERS THEN
				error_message := 'Failed to update datasource: ' || SQLERRM;
				RETURN;
		END;

		-- Update datasource storage with validation
		BEGIN
				UPDATE datasource_storage SET
						datasource_configuration = p_datasource_config,
						plugin_id = p_plugin_id,
						workspace_id = p_workspace_id,
						updated_at = NOW()
				WHERE datasource_id = p_datasource_id
				AND environment_id = p_environment_id;
		EXCEPTION WHEN OTHERS THEN
				error_message := 'Failed to update datasource storage: ' || SQLERRM;
				RETURN;
		END;
END;
$$ LANGUAGE plpgsql;

-- Function to handle authentication configuration
CREATE OR REPLACE FUNCTION update_datasource_auth(
		p_datasource_id VARCHAR,
		p_auth_type VARCHAR,
		p_auth_config JSONB
) RETURNS VOID AS $$
BEGIN
		UPDATE datasource_storage
		SET datasource_configuration = jsonb_set(
				datasource_configuration,
				'{authentication}',
				p_auth_config
		)
		WHERE datasource_id = p_datasource_id;
END;
$$ LANGUAGE plpgsql;
