package com.appsmith.server.featureflags;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import org.apache.commons.lang3.StringUtils;
import org.ff4j.core.FeatureStore;
import org.ff4j.core.FlippingExecutionContext;
import org.ff4j.core.FlippingStrategy;
import org.ff4j.strategy.AbstractFlipStrategy;
import org.ff4j.strategy.PonderationStrategy;

/**
 * This enum lists all the feature flags available along with their flipping strategy.
 * In order to create a new feature flag, create another enum entry and define a class that implements FlippingStrategy
 * The feature flag implementation class should extend an existing feature flag implementation like PonderationStrategy,
 * OfficeHourStrategy etc. These default classes provide a lot of basic functionality out of the box.
 *
 */
public enum FeatureFlagEnum {

    JS_EDITOR(new JSEditorFeature()),
    // example feature flag
    WEIGHTAGE(new WeightageFeature()),
    COMMENT(new JSEditorFeature());

    FlippingStrategy strategy;

    FeatureFlagEnum(FlippingStrategy strategy) {
        this.strategy = strategy;
    }

    public FlippingStrategy getStrategy() {
        return this.strategy;
    }

    public static class JSEditorFeature extends AbstractFlipStrategy {

        @Override
        public boolean evaluate(String featureName, FeatureStore store, FlippingExecutionContext executionContext) {
            System.out.println("In the awesomeFeature flipStrategy");
            User user = (User) executionContext.getValue(FieldName.USER, true);
            return StringUtils.endsWith(user.getEmail(), "@appsmith.com");
        }
    }

    // This is an example feature to show different strategies
    public static class WeightageFeature extends PonderationStrategy {
        public WeightageFeature() {
            super(0.5);
        }
    }
}

