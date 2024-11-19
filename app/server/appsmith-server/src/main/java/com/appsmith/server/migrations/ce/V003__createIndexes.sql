-- index naming convention: (pkey reserved for primary keys)
-- unique constraint index - table_name_column_name_key
-- performance improvement index - table_name_column_name_idx
create unique index if not exists config_name_key on config(name) ;
create unique index if not exists prt_email_key on password_reset_token(email);
create unique index if not exists user_email_key on "user"(email);
create unique index if not exists sequence_name_key on sequence(name);

-- action_collection table constraints
create index if not exists action_collection_application_id_idx
		on action_collection(application_id)
		WHERE deleted_at IS NULL;
create index if not exists action_collection_unpublished_page_id_idx
		on action_collection((unpublished_collection ->> 'pageId'))
		WHERE deleted_at IS NULL;
create index if not exists action_collection_published_page_id_idx
		on action_collection((published_collection ->> 'pageId'))
		WHERE deleted_at IS NULL AND published_collection IS NOT NULL;
create index if not exists action_collection_base_id_branch_name_idx
		on action_collection(base_id, branch_name)
		WHERE deleted_at IS NULL;


-- plugin table constraints
create unique index if not exists plugin_package_name_key
		on plugin(package_name)
		WHERE plugin_name IS NULL AND version IS NULL AND deleted_at IS NULL;
create unique index if not exists plugin_package_name_version_key
		on plugin(package_name, plugin_name, version)
		WHERE plugin_name IS NOT NULL AND version IS NOT NULL AND deleted_at IS NULL;

-- Ideally we should have this constraint, but we have data that unfortunately violates this.
-- ALTER TABLE plugin
--     ADD CONSTRAINT plugin_package_name_version_chk CHECK(
--         (package_name is NULL AND version IS NULL)
--         OR (package_name is NOT NULL AND version IS NOT NULL)
--     );


-- user_data table constraints
create unique index if not exists user_id_key on user_data(user_id);

-- datasource table constraints
create unique index if not exists datasource_workspace_name_key
		on datasource(workspace_id, name)
		WHERE deleted_at is NULL;

-- application table constraints
create unique index if not exists application_workspace_name_key
		on application(workspace_id, name)
		WHERE deleted_at IS NULL AND (git_application_metadata IS NULL OR (git_application_metadata ->> 'remoteUrl' IS NULL AND git_application_metadata ->> 'branchName' IS NULL));
create unique index if not exists application_workspace_name_git_application_metadata_key
		on application(workspace_id, name, (git_application_metadata ->> 'remoteUrl'), (git_application_metadata ->>'branchName'))
		WHERE deleted_at IS NULL AND git_application_metadata IS NOT NULL AND git_application_metadata ->> 'remoteUrl' IS NOT NULL AND git_application_metadata ->> 'branchName' IS NOT NULL;
create index if not exists application_git_metadata_application_id_branch_idx
		on application((git_application_metadata ->> 'defaultApplicationId'), (git_application_metadata ->> 'branchName'))
		WHERE deleted_at IS NULL AND git_application_metadata IS NOT NULL;
create index if not exists application_git_metadata_artifact_id_branch_idx
		on application((git_application_metadata ->> 'branchName'), (git_application_metadata ->> 'defaultArtifactId'))
		WHERE deleted_at IS NULL AND git_application_metadata IS NOT NULL;

-- datasource_storage table constraints
create unique index if not exists datasource_storage_datasource_id_key
		on datasource_storage(datasource_id)
		WHERE environment_id IS NULL AND deleted_at IS NULL;
create unique index if not exists datasource_storage_datasource_id_env_id_key
		on datasource_storage(datasource_id, environment_id)
		WHERE environment_id IS NOT NULL AND deleted_at IS NULL;
create index if not exists datasource_storage_env_id_idx
		on datasource_storage(environment_id)
		WHERE deleted_at IS NULL;

-- datasource_storage_structure table constraints
create unique index if not exists dss_datasource_id_key
		on datasource_storage_structure(datasource_id)
		WHERE environment_id IS NULL AND deleted_at IS NULL;
create unique index if not exists dss_datasource_env_key
		on datasource_storage_structure(datasource_id, environment_id)
		WHERE environment_id IS NOT NULL AND deleted_at IS NULL;

-- application_snapshot table constraints
create unique index if not exists application_snapshot_application_chunk_order_key
		on application_snapshot(application_id, chunk_order);

-- customjslibs table constraints
create index if not exists custom_js_libs_name_idx
		on customjslib(uid_string);

-- new_action table constraints
create index if not exists new_action_application_id_idx
		on new_action(application_id)
		WHERE deleted_at IS NULL;
create index if not exists new_action_unpublished_page_id_idx
		on new_action((unpublished_action ->> 'pageId'))
		WHERE deleted_at IS NULL;
create index if not exists new_action_published_page_id_idx
		on new_action((published_action ->> 'pageId'))
		WHERE deleted_at IS NULL AND published_action IS NOT NULL;
create index if not exists new_action_application_id_plugin_type_idx
		on new_action(application_id, plugin_type)
		WHERE deleted_at IS NULL;
create index if not exists new_action_unpublished_collection_id_idx
		on new_action((unpublished_action ->> 'collectionId'))
		WHERE deleted_at IS NULL;
create index if not exists new_action_published_collection_id_idx
		on new_action((published_action ->> 'collectionId'))
		WHERE deleted_at IS NULL AND published_action IS NOT NULL;

-- create index if not exists new_action_unpublished_datasource_id_idx
--    on new_action((unpublished_action ->> 'datasource' ->> 'id'))
--    WHERE deleted_at IS NULL AND unpublished_action IS NOT NULL AND unpublished_action ->> 'datasource' IS NOT NULL;
-- create index if not exists new_action_published_datasource_id_idx
--    on new_action((published_action ->> 'datasource' ->> 'id'))
--    WHERE deleted_at IS NULL AND published_action IS NOT NULL AND published_action ->> 'datasource' IS NOT NULL;
create index if not exists new_action_base_id_branch_name_idx
		on new_action(base_id, branch_name)
		WHERE deleted_at IS NULL;

-- new_page table constraints
create index if not exists new_page_application_id_idx
		on new_page(application_id)
		WHERE deleted_at IS NULL;
create index if not exists new_page_base_id_branch_name_idx
		on new_page(base_id, branch_name)
		WHERE deleted_at IS NULL;

-- permission_group table constraints
create index if not exists permission_group_user_ids_idx
		on permission_group(assigned_to_user_ids)
		WHERE deleted_at IS NULL;
create index if not exists permission_group_domain_id_domain_type_idx
		on permission_group(default_domain_id, default_domain_type)
		WHERE deleted_at IS NULL;

-- theme table constraints
create index if not exists theme_system_theme_idx
		on theme(is_system_theme);
create index if not exists theme_application_id_idx
		on theme(application_id)
		WHERE deleted_at IS NULL;

-- workspace table constraints
create index if not exists workspace_tenant_id_idx
		on workspace(tenant_id)
		WHERE deleted_at IS NULL;
create index if not exists workspace_name_idx
		on workspace(name)
		WHERE deleted_at IS NULL;
