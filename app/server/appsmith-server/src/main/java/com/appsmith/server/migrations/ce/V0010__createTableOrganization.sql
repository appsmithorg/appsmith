CREATE TABLE appsmith.organization (
																			id VARCHAR(255) NOT NULL PRIMARY KEY,
																			slug TEXT NOT NULL UNIQUE,
																			display_name TEXT,
																			pricing_plan TEXT,
																			organization_configuration JSONB
);
