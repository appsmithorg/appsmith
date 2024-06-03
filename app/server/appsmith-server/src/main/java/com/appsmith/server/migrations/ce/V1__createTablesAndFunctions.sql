create table action_collection
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    default_resources jsonb,
    application_id varchar(255),
    context_type varchar(255),
    published_collection jsonb,
    unpublished_collection jsonb,
    workspace_id varchar(255)
);

create table application
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    app_is_example boolean not null,
    application_version integer,
    client_schema_version integer,
    cloned_from_application_id varchar(255),
    collapse_invisible_widgets boolean,
    color varchar(255),
    edit_mode_theme_id varchar(255),
    embed_setting jsonb,
    evaluation_version integer,
    export_with_configuration boolean,
    fork_with_configuration boolean,
    forked_from_template_title varchar(255),
    forking_enabled boolean,
    git_application_metadata jsonb,
    icon varchar(255),
    is_auto_update boolean,
    is_community_template boolean,
    is_manual_update boolean,
    is_public boolean,
    last_deployed_at timestamp(6) with time zone,
    last_edited_at timestamp(6) with time zone,
    name varchar(255) not null,
    pages jsonb,
    published_app_layout jsonb,
    published_application_detail jsonb,
    published_customjslibs jsonb,
    published_mode_theme_id varchar(255),
    published_pages jsonb,
    server_schema_version integer,
    slug varchar(255),
    unpublished_app_layout jsonb,
    unpublished_application_detail jsonb,
    unpublished_customjslibs jsonb,
    view_mode boolean,
    workspace_id varchar(255)
);

create table application_snapshot
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    application_id varchar(255),
    chunk_order integer not null,
    data bytea
);

create table asset
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    content_type varchar(255),
    data bytea
);

create table collection
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    actions jsonb,
    application_id varchar(255),
    name varchar(255),
    shared boolean,
    workspace_id varchar(255)
);

create table config
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    config jsonb,
    name varchar(255)
        constraint uk_kjjh66cda2b9nc24it8fhbfwx
            unique
);

create table customjslib
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    default_resources jsonb,
    accessor jsonb,
    -- This was `String` in MongoDB, but since we need to store `NUL` (\u0000) character in it (for libraries like
    -- xlsx), which Postgres doesn't allow in text/varchar, we have to use a byte array (`bytea`) here.
    defs bytea,
    docs_url varchar(255),
    name varchar(255),
    uid_string varchar(255),
    url text,
    version varchar(255)
);

create table datasource
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    default_resources jsonb,
    datasource_configuration jsonb,
    has_datasource_storage boolean,
    invalids jsonb,
    is_configured boolean,
    is_mock boolean,
    is_template boolean,
    name varchar(255),
    plugin_id varchar(255),
    template_name varchar(255),
    workspace_id varchar(255)
);

create table datasource_storage
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    datasource_configuration jsonb,
    datasource_id varchar(255),
    environment_id varchar(255),
    invalids jsonb,
    is_configured boolean
);

create table datasource_storage_structure
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    datasource_id varchar(255),
    environment_id varchar(255),
    structure jsonb
);

create table email_verification_token
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    email varchar(255),
    token_generated_at timestamp(6) with time zone,
    token_hash varchar(255)
);

create table git_deploy_keys
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    email varchar(255),
    git_auth jsonb
);

create table new_action
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    default_resources jsonb,
    application_id varchar(255),
    documentation jsonb,
    plugin_id varchar(255),
    plugin_type varchar(255),
    published_action jsonb,
    unpublished_action jsonb,
    workspace_id varchar(255)
);

create table new_page
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    default_resources jsonb,
    application_id varchar(255),
    published_page jsonb,
    unpublished_page jsonb
);

create table password_reset_token
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    email varchar(255),
    first_request_time timestamp(6) with time zone,
    request_count integer not null,
    token_hash varchar(255)
);

create table permission_group
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    assigned_to_group_ids jsonb,
    assigned_to_user_ids jsonb,
    default_domain_id varchar(255),
    default_domain_type varchar(255),
    default_workspace_id varchar(255),
    description varchar(255),
    name varchar(255) not null,
    permissions jsonb,
    tenant_id varchar(255)
);

create table plugin
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    action_component varchar(255),
    action_params jsonb,
    action_ui_config jsonb,
    allow_user_datasources boolean,
    datasource_component varchar(255),
    datasource_params jsonb,
    datasource_ui_config jsonb,
    default_install boolean,
    documentation_link varchar(255),
    generatecrudpage_component varchar(255),
    icon_location varchar(255),
    is_dependent_oncs boolean,
    is_remote_plugin boolean not null,
    is_supported_for_air_gap boolean not null,
    jar_location varchar(255),
    max_appsmith_version_supported varchar(255),
    min_appsmith_version_supported varchar(255),
    name varchar(255),
    package_name varchar(255),
    plugin_name varchar(255),
    response_type varchar(255),
    type varchar(255),
    ui_component varchar(255),
    version varchar(255)
);

create table sequence
(
    name varchar(255) not null
        primary key,
    next_number bigint
);

create table tenant
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    display_name varchar(255),
    pricing_plan varchar(255),
    slug varchar(255) unique,
    tenant_configuration jsonb
);

create table theme
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    application_id varchar(255),
    config jsonb,
    display_name varchar(255),
    is_system_theme boolean not null,
    name varchar(255),
    properties jsonb,
    stylesheet jsonb,
    workspace_id varchar(255)
);

create table usage_pulse
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    email varchar(255),
    instance_id varchar(255),
    is_anonymous_user boolean,
    tenant_id varchar(255),
    "user" varchar(255),
    view_mode boolean
);

create table "user"
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    current_workspace_id varchar(255),
    email text,
    email_verification_required boolean,
    email_verified boolean,
    examples_workspace_id varchar(255),
    group_ids jsonb,
    hashed_email text,
    invite_token varchar(255),
    is_anonymous boolean,
    is_enabled boolean,
    is_system_generated boolean,
    name text,
    password text,
    password_reset_initiated boolean,
    permissions jsonb,
    source varchar(255),
    state varchar(255),
    tenant_id varchar(255),
    workspace_ids jsonb
);

create table user_data
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    git_profiles jsonb,
    is_intercom_consent_given boolean not null,
    proficiency varchar(255),
    profile_photo_asset_id varchar(255),
    recently_used_app_ids jsonb,
    recently_used_entity_ids jsonb,
    recently_used_workspace_ids jsonb,
    release_notes_viewed_version varchar(255),
    role varchar(255),
    use_case varchar(255),
    user_claims jsonb,
    user_id varchar(255)
);

create table workspace
(
    id varchar(255) not null
        primary key,
    created_at timestamp(6) with time zone,
    created_by varchar(255),
    deleted_at timestamp(6) with time zone,
    git_sync_id varchar(255),
    modified_by varchar(255),
    policies jsonb,
    policy_map jsonb,
    updated_at timestamp(6) with time zone,
    default_permission_groups jsonb,
    domain varchar(255),
    email varchar(255),
    has_environments boolean,
    is_auto_generated_workspace boolean,
    logo_asset_id varchar(255),
    name varchar(255),
    plugins jsonb,
    slug varchar(255),
    tenant_id varchar(255),
    website varchar(255)
);

create function jsonb_minus(l jsonb, r text) returns jsonb
  language sql
RETURN (l - r);
