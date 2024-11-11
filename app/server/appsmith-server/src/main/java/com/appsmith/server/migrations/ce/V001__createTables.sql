create table action_collection
(
		id varchar(255) not null
				primary key,
		base_id text,
		branch_name text,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		application_id text,
		context_type text,
		published_collection jsonb,
		unpublished_collection jsonb,
		workspace_id text
);

create table application
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		app_is_example boolean not null default false,
		application_version integer,
		client_schema_version integer,
		cloned_from_application_id text,
		collapse_invisible_widgets boolean,
		color text,
		edit_mode_theme_id text,
		embed_setting jsonb,
		evaluation_version integer,
		export_with_configuration boolean,
		fork_with_configuration boolean,
		forked_from_template_title text,
		forking_enabled boolean,
		git_application_metadata jsonb,
		icon text,
		is_auto_update boolean,
		is_community_template boolean,
		is_manual_update boolean,
		is_public boolean,
		last_deployed_at timestamp(6) with time zone,
		last_edited_at timestamp(6) with time zone,
		name text not null,
		pages jsonb,
		published_app_layout jsonb,
		published_application_detail jsonb,
		published_customjslibs jsonb,
		published_mode_theme_id text,
		published_pages jsonb,
		server_schema_version integer,
		slug text,
		unpublished_app_layout jsonb,
		unpublished_application_detail jsonb,
		unpublished_customjslibs jsonb,
		view_mode boolean,
		workspace_id text NOT NULL
);

create table application_snapshot
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		application_id text NOT NULL,
		chunk_order integer NOT NULL,
		data bytea
);

create table asset
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		content_type text,
		data bytea
);

create table collection
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		actions jsonb,
		application_id text,
		name text,
		shared boolean,
		workspace_id text
);

create table config
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		config jsonb,
		name text
				constraint uk_kjjh66cda2b9nc24it8fhbfwx
						unique
);

create table customjslib
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		default_resources jsonb,
		accessor jsonb,
		-- This was `String` in MongoDB, but since we need to store `NUL` (\u0000) character in it (for libraries like
		-- xlsx), which Postgres doesn't allow in text/varchar, we have to use a byte array (`bytea`) here.
		defs bytea,
		docs_url text,
		name text,
		uid_string text,
		url text,
		version text
);

create table datasource
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		datasource_configuration jsonb,
		has_datasource_storage boolean,
		invalids jsonb,
		is_configured boolean,
		is_mock boolean,
		is_template boolean,
		name text,
		plugin_id text,
		template_name text,
		workspace_id text
);

create table datasource_storage
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		datasource_configuration jsonb,
		datasource_id text,
		environment_id text,
		invalids jsonb,
		is_configured boolean
);

create table datasource_storage_structure
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		datasource_id text,
		environment_id text,
		structure jsonb
);

create table email_verification_token
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		email text,
		token_generated_at timestamp(6) with time zone,
		token_hash text
);

create table git_deploy_keys
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		email text,
		git_auth jsonb
);

create table new_action
(
		id varchar(255) not null
				primary key,
		base_id text,
		branch_name text,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		application_id text,
		documentation jsonb,
		plugin_id text,
		plugin_type text,
		published_action jsonb,
		unpublished_action jsonb,
		workspace_id text
);

create table new_page
(
		id varchar(255) not null
				primary key,
		base_id text,
		branch_name text,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		application_id text,
		published_page jsonb,
		unpublished_page jsonb
);

create table password_reset_token
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		email text,
		first_request_time timestamp(6) with time zone,
		request_count integer not null DEFAULT 0,
		token_hash text
);

create table permission_group
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		assigned_to_group_ids jsonb,
		assigned_to_user_ids jsonb,
		default_domain_id text,
		default_domain_type text,
		default_workspace_id text,
		description text,
		name text not null,
		permissions jsonb,
		tenant_id text
);

create table plugin
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		action_component text,
		action_params jsonb,
		action_ui_config jsonb,
		allow_user_datasources boolean,
		datasource_component text,
		datasource_params jsonb,
		datasource_ui_config jsonb,
		default_install boolean,
		documentation_link text,
		generatecrudpage_component text,
		icon_location text,
		is_dependent_oncs boolean,
		is_remote_plugin boolean not null default false,
		is_supported_for_air_gap boolean not null default true,
		jar_location text,
		max_appsmith_version_supported text,
		min_appsmith_version_supported text,
		name text,
		package_name text NOT NULL,
		plugin_name text,
		response_type text,
		type text,
		ui_component text,
		version text
);

create table sequence
(
		name text not null
				primary key,
		next_number bigint
);

create table tenant
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		display_name text,
		pricing_plan text,
		slug text unique,
		tenant_configuration jsonb
);

create table theme
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		application_id text,
		config jsonb,
		display_name text,
		is_system_theme boolean not null,
		name text,
		properties jsonb,
		stylesheet jsonb,
		workspace_id text
);

create table usage_pulse
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		email text,
		instance_id text,
		is_anonymous_user boolean,
		tenant_id text,
		"user" text,
		view_mode boolean
);

create table "user"
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		current_workspace_id text,
		email text,
		email_verification_required boolean,
		email_verified boolean,
		examples_workspace_id text,
		hashed_email text,
		invite_token text,
		is_anonymous boolean,
		is_enabled boolean,
		is_system_generated boolean,
		last_active_at timestamp(6) with time zone,
		name text,
		password text,
		password_reset_initiated boolean,
		source text,
		state text,
		tenant_id text,
		workspace_ids jsonb
);

create table user_data
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		git_profiles jsonb,
		is_intercom_consent_given boolean not null default false,
		proficiency text,
		profile_photo_asset_id text,
		recently_used_app_ids jsonb,
		recently_used_entity_ids jsonb,
		recently_used_workspace_ids jsonb,
		release_notes_viewed_version text,
		role text,
		use_case text,
		user_claims jsonb,
		user_id text
);

create table workspace
(
		id varchar(255) not null
				primary key,
		created_at timestamp(6) with time zone,
		created_by text,
		deleted_at timestamp(6) with time zone,
		git_sync_id text,
		modified_by text,
		policies jsonb,
		policy_map jsonb,
		updated_at timestamp(6) with time zone,
		default_permission_groups jsonb,
		domain text,
		email text,
		has_environments boolean,
		is_auto_generated_workspace boolean,
		logo_asset_id text,
		name text,
		plugins jsonb,
		slug text,
		tenant_id text,
		website text
);
