ALTER TABLE appsmith.new_page
		ADD COLUMN ref_type VARCHAR(255) DEFAULT NULL;

ALTER TABLE appsmith.new_page
		ADD COLUMN ref_name VARCHAR(255) DEFAULT NULL;


ALTER TABLE appsmith.new_action
		ADD COLUMN ref_name VARCHAR(255) DEFAULT NULL;

ALTER TABLE appsmith.new_action
		ADD COLUMN ref_type VARCHAR(255) DEFAULT NULL;

ALTER TABLE appsmith.action_collection
		ADD COLUMN ref_name VARCHAR(255) DEFAULT NULL;

ALTER TABLE appsmith.action_collection
		ADD COLUMN ref_type VARCHAR(255) DEFAULT NULL;
