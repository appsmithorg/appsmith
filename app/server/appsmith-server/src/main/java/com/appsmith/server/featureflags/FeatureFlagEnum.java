package com.appsmith.server.featureflags;

public enum FeatureFlagEnum {
    // ------------------- These features are only for JUnit testing. DO NOT use these features in your code path.--- //
    // ------------------- Couldn't find a better way to do this ---------------------------------------------------- //
    TEST_FEATURE_1,
    TEST_FEATURE_2,
    TEST_FEATURE_3,
    TENANT_TEST_FEATURE,
    // ------------------- End of features for testing -------------------------------------------------------------- //

    // ------------------- These are actual feature flags meant to be used across the product ----------------------- //
    license_custom_environments_enabled,
    APP_NAVIGATION_LOGO_UPLOAD,
    release_embed_hide_share_settings_enabled,
    ab_mock_mongo_schema_enabled,
    rollout_datasource_test_rate_limit_enabled,
    release_query_module_enabled,

    // Add EE flags below this line, to avoid conflicts.
    RBAC,

    /**
     * feature flag for knowledge base generation
     * knowledge base is the summary of the application on per page basis
     */
    release_knowledge_base_enabled,

    /**
     * Feature flag to detect if workflows feature is enabled for the tenant
     */
    release_workflows_enabled,

    /**
     * feature flag for making connection pool sizes for plugins manually
     * configurable
     */
    license_connection_pool_size_enabled,

    // Feature flags which should not be deleted
    release_datasource_environments_enabled,
    ask_ai,
    ask_ai_sql,
    ask_ai_js,
    ab_ai_js_function_completion_enabled,
    license_session_limit_enabled,
    /**
     * feature flag for scim provisioning
     */
    license_scim_enabled,
    /**
     * Feature flag to enable the audit log functionality
     */
    license_audit_logs_enabled,
    /**
     * Feature flag to detect if unlimited private repos are supported for the
     * tenant
     */
    license_git_unlimited_repo_enabled,

    /**
     * Feature flag to detect if custom branding is supported for the tenant
     */
    license_branding_enabled,

    /**
     * Feature flag to detect if GAC i.e. custom roles and groups are supported for
     * the tenant
     */
    license_gac_enabled,

    /**
     * Feature flag to detect if message listener is supported for the tenant
     */
    license_message_listener_enabled,

    /**
     * Feature flag to detect if programmatic access control is supported for the
     * tenant
     */
    license_pac_enabled,

    /**
     * Feature flag to detect if private embeds are supported for the tenant
     */
    license_private_embeds_enabled,

    /**
     * Feature flag to detect if SSO OIDC is supported for the tenant
     */
    license_sso_oidc_enabled,

    /**
     * Feature flag to detect if SSO SAML is supported for the tenant
     */
    license_sso_saml_enabled,

    /**
     * Flag to detect if branch protection and configuration is supported for the tenant
     */
    license_git_branch_protection_enabled,

    /**
     * Feature flag to detect if scheduled backup is supported for the tenant
     */
    license_scheduled_backup_enabled,
}
