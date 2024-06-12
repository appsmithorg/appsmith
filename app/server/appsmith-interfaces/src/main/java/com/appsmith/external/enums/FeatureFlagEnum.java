package com.appsmith.external.enums;

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
    rollout_datasource_test_rate_limit_enabled,
    release_git_autocommit_feature_enabled,
    /**
     * Since checking eligibility for autocommit is an expensive operation,
     * We want to roll out this feature on cloud in a controlled manner.
     * We could have used the autocommit flag itself, however it is on tenant level,
     * and it can't be moved to user level due to its usage on non-reactive code paths.
     * We would keep the main autocommit flag false on production for the version <= testing versions,
     * and turn it to true for later versions
     * We would remove this feature flag once the testing is complete.
     */
    release_git_autocommit_eligibility_enabled,
    // Add EE flags below this line, to avoid conflicts.
}
