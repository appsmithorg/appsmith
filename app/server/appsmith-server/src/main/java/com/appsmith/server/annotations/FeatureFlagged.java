package com.appsmith.server.annotations;

import com.appsmith.server.featureflags.FeatureFlagEnum;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Indicates that the annotated method or class is subject to feature flag-based execution control.
 * Use this annotation to mark methods or classes that should be executed based on the state of a
 * specified feature flag.
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface FeatureFlagged {
    /**
     * Specifies the feature flag to be used for controlling the execution of the annotated method
     * or class. The state of the specified feature flag determines whether the execution takes place.
     *
     * @return the feature flag to be checked before executing the annotated method or class.
     */
    FeatureFlagEnum featureFlagName();
}
