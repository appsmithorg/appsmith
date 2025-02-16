-- Ensure you are in the correct schema
SET search_path TO appsmith;

-- Create or replace the procedure
CREATE OR REPLACE PROCEDURE import_theme_to_application(
		IN app_id VARCHAR,
		IN new_unpublished_theme_id VARCHAR,
		IN new_published_theme_id VARCHAR
)
		LANGUAGE plpgsql
AS $$
DECLARE
		existing_unpublished_theme_id VARCHAR;
		existing_published_theme_id VARCHAR;
		existing_theme_is_system BOOLEAN;
BEGIN
		-- Get the current themes of the application
		SELECT published_mode_theme_id
		INTO existing_unpublished_theme_id, existing_published_theme_id
		FROM appsmith.application
		WHERE id = app_id;

		-- Update unpublished theme
		IF existing_unpublished_theme_id IS NULL THEN
				-- Insert new theme if not exists
				INSERT INTO appsmith.theme (id, is_system_theme) VALUES (new_unpublished_theme_id, FALSE);
		ELSE
				-- Check if the current theme is a system theme
				SELECT is_system_theme INTO existing_theme_is_system FROM appsmith.theme WHERE id = existing_unpublished_theme_id;

				IF existing_theme_is_system THEN
						-- Replace the system theme with the new theme
						UPDATE appsmith.application
						SET published_mode_theme_id = published_mode_theme_id
						WHERE id = app_id;
				ELSE
						-- Update existing theme properties
						UPDATE appsmith.theme SET id = new_unpublished_theme_id WHERE id = existing_unpublished_theme_id;
				END IF;
		END IF;

		-- Update published theme
		IF existing_published_theme_id IS NULL THEN
				INSERT INTO appsmith.theme (id, is_system_theme) VALUES (new_published_theme_id, FALSE);
		ELSE
				SELECT is_system_theme INTO existing_theme_is_system FROM appsmith.theme WHERE id = existing_published_theme_id;

				IF existing_theme_is_system THEN
						UPDATE appsmith.application
						SET published_mode_theme_id = new_published_theme_id
						WHERE id = app_id;
				ELSE
						UPDATE appsmith.theme SET id = new_published_theme_id WHERE id = existing_published_theme_id;
				END IF;
		END IF;

		-- Finally, update the application record
		UPDATE appsmith.application
		SET published_mode_theme_id = new_published_theme_id
		WHERE id = app_id;
END;
$$;
