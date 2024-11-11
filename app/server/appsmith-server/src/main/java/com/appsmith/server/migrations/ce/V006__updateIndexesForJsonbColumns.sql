-- This migration updates the indexes for the JSONB columns in action_collection tables.
DROP INDEX IF EXISTS action_collection_unpublished_page_id_idx;
CREATE INDEX IF NOT EXISTS action_collection_unpublished_page_id_idx
		ON action_collection (JSONB_EXTRACT_PATH_TEXT(unpublished_collection, 'pageId'))
		WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS action_collection_published_page_id_idx;
CREATE INDEX IF NOT EXISTS action_collection_published_page_id_idx
		ON action_collection (JSONB_EXTRACT_PATH_TEXT(published_collection, 'pageId'))
		WHERE deleted_at IS NULL;

-- This migration updates the indexes for the JSONB columns in new_action tables.
DROP INDEX IF EXISTS new_action_unpublished_page_id_idx;
CREATE INDEX IF NOT EXISTS new_action_unpublished_page_id_idx
		ON new_action (JSONB_EXTRACT_PATH_TEXT(unpublished_action, 'pageId'))
		WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS new_action_published_page_id_idx;
CREATE INDEX IF NOT EXISTS new_action_published_page_id_idx
		ON new_action (JSONB_EXTRACT_PATH_TEXT(published_action, 'pageId'))
		WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS new_action_unpublished_collection_id_idx;
CREATE INDEX IF NOT EXISTS new_action_unpublished_collection_id_idx
		ON new_action (JSONB_EXTRACT_PATH_TEXT(unpublished_action, 'collectionId'))
		WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS new_action_published_collection_id_idx;
CREATE INDEX IF NOT EXISTS new_action_published_collection_id_idx
		ON new_action (JSONB_EXTRACT_PATH_TEXT(published_action, 'collectionId'))
		WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS new_action_unpublished_datasource_id_idx;
CREATE INDEX IF NOT EXISTS new_action_unpublished_datasource_id_idx
		ON new_action(JSONB_EXTRACT_PATH_TEXT(unpublished_action, 'datasource', 'id'))
		WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS new_action_published_datasource_id_idx;
CREATE INDEX IF NOT EXISTS new_action_published_datasource_id_idx
		on new_action(JSONB_EXTRACT_PATH_TEXT(published_action, 'datasource', 'id'))
		WHERE deleted_at IS NULL;
