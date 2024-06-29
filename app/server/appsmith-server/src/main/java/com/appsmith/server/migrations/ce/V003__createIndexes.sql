-- index naming convention: (pkey reserved for primary keys)
-- unique constraint index - table_name_column_name_key
-- performance improvement index - table_name_column_name_idx
create unique index if not exists config_name_key on config(name) ;
create unique index if not exists prt_email_key on password_reset_token(email);
create unique index if not exists user_email_key on "user"(email);
create unique index if not exists sequence_name_key on sequence(name);

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
create unique index if not exists datasource_workspace_name_deleted_key
    on datasource(workspace_id, name)
    WHERE deleted_at is NULL;

create unique index if not exists application_workspace_name_key
    on application(workspace_id, name)
    WHERE deleted_at IS NULL and (git_application_metadata is null OR git_application_metadata ->> 'remoteUrl' is NULL);
create unique index if not exists application_workspace_name_deleted_git_application_metadata_key
    on application(workspace_id, name, (git_application_metadata ->> 'remoteUrl'), (git_application_metadata ->>'branchName'))
    WHERE deleted_at IS NULL and git_application_metadata is NOT null AND git_application_metadata ->> 'remoteUrl' is NOT NULL;

create unique index if not exists dss_datasource_id_key
    on datasource_storage_structure(datasource_id)
    WHERE environment_id IS NULL AND deleted_at IS NULL;
create unique index if not exists dss_datasource_env_key
    on datasource_storage_structure(datasource_id, environment_id)
    WHERE environment_id IS NOT NULL AND deleted_at IS NULL;

-- application_snapshot table constraints
create unique index if not exists application_snapshot_application_chunkOrder_key
    on application_snapshot(application_id, chunk_order);
