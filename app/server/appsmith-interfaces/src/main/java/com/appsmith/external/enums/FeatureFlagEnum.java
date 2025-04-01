package com.appsmith.external.enums;

public enum FeatureFlagEnum {
    // ------------------- These features are only for JUnit testing. DO NOT use these features in your code path.--- //
    // ------------------- Couldn't find a better way to do this ---------------------------------------------------- //
    TEST_FEATURE_1,
    TEST_FEATURE_2,
    TEST_FEATURE_3,
    ORGANIZATION_TEST_FEATURE,
    // ------------------- End of features for testing -------------------------------------------------------------- //

    // ------------------- These are actual feature flags meant to be used across the product ----------------------- //
    release_datasource_environments_enabled,
    APP_NAVIGATION_LOGO_UPLOAD,
    release_embed_hide_share_settings_enabled,
    rollout_datasource_test_rate_limit_enabled,
    release_google_sheets_shared_drive_support_enabled,
    release_gs_all_sheets_options_enabled,
    /**
     * Feature flag to detect if the git reset optimization is enabled
     */
    release_git_reset_optimization_enabled,
    /**
     * Feature flag to detect if the RTS git reset is enabled
     */
    ab_rts_git_reset_enabled,

    // Deprecated CE flags over here
    release_git_autocommit_feature_enabled,
    release_git_autocommit_eligibility_enabled,
    release_dynamodb_connection_time_to_live_enabled,

    // Add EE flags below this line, to avoid conflicts.
}
