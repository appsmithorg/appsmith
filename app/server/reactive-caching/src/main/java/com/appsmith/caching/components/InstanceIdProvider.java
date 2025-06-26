package com.appsmith.caching.components;

import reactor.core.publisher.Mono;

/**
 * Interface to provide instanceId for distributed lock keys.
 * This allows the reactive-caching module to get instanceId without depending on higher-level modules.
 */
public interface InstanceIdProvider {

    /**
     * Get the instance ID for this Appsmith instance
     * @return Mono containing the instance ID
     */
    Mono<String> getInstanceId();
}
