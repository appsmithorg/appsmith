-- index naming convention: (pkey reserved for primary keys)
-- unique constraint index - table_name_column_name_key
-- performance improvement index - table_name_column_name_idx
create unique index if not exists config_name_key on config(name) ;
create unique index if not exists prt_email_key on password_reset_token(email);
create unique index if not exists user_email_key on "user"(email);
create unique index if not exists sequence_name_key on sequence(name);

-- plugin table constraints
create unique index if not exists plugin_plugin_name_key on plugin(plugin_name) WHERE version IS NULL;
create unique index if not exists plugin_package_name_key on plugin(package_name) WHERE version IS NULL;
create unique index if not exists plugin_name_package_name_version_key on plugin(package_name, version) WHERE version IS NULL;

create unique index if not exists user_id_key on user_data(user_id);
create unique index if not exists datasource_workspace_name_deleted_key on datasource(workspace_id, name, deleted_at) NULLS NOT DISTINCT;
create unique index if not exists application_workspace_name_deleted_git_application_metadata_key on application(workspace_id, name, deleted_at, (git_application_metadata ->> 'remoteUrl'), (git_application_metadata ->>'branchName')) NULLS NOT DISTINCT;
create unique index if not exists dss_datasource_env_key on datasource_storage_structure(datasource_id, environment_id) NULLS NOT DISTINCT;
create unique index if not exists application_snapshot_application_chunkOrder_key on application_snapshot(application_id, chunk_order) NULLS NOT DISTINCT;
