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
    release_datasource_environments_enabled,
    APP_NAVIGATION_LOGO_UPLOAD,
    release_embed_hide_share_settings_enabled,
    ab_mock_mongo_schema_enabled,
    rollout_datasource_test_rate_limit_enabled,
    release_git_autocommit_feature_enabled,
    // Add EE flags below this line, to avoid conflicts.
}
