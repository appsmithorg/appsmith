package com.appsmith.server.featureflags;

import org.ff4j.core.FlippingStrategy;
import org.ff4j.strategy.PonderationStrategy;
import org.ff4j.strategy.time.OfficeHourStrategy;

/**
 * This enum lists all the feature flags available along with their flipping strategy.
 * In order to create a new feature flag, create another enum entry and add the same string to {@link features/init-flags.xml}
 * <p>
 * If you wish to define a custom flipping strategy, define a class that implements {@link FlippingStrategy} and
 * ensure that you've mentioned this custom class when defining the feature in {@link features/init-flags.xml}
 * <p>
 * The feature flag implementation class should extend an existing feature flag implementation like {@link PonderationStrategy},
 * {@link OfficeHourStrategy} etc. These default classes provide a lot of basic functionality out of the box.
 */
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

    // Add EE flags below this line, to avoid conflicts.
}
