package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface FeatureFlagServiceCE {

    /**
     * Used to check if a particular feature is enabled for a given user. Useful in contexts where we already have the
     * User object and simply wish to do a boolean check
     *
     * @param featureEnum
     * @param user
     * @return Boolean
     */
    Mono<Boolean> check(FeatureFlagEnum featureEnum, User user);

    /**
     * Check if a particular feature is enabled for the current logged in user. Useful in chaining reactive functions
     * while writing business logic that may depend on a feature flag
     *
     * @param featureEnum
     * @return Mono<Boolean>
     */
    Mono<Boolean> check(FeatureFlagEnum featureEnum);

    Boolean check(String featureName, User user);

    /**
     * Fetch all the flags and their values for the current logged in user
     *
     * @return Mono<Map < String, Boolean>>
     */
    Mono<Map<String, Boolean>> getAllFeatureFlagsForUser();

}