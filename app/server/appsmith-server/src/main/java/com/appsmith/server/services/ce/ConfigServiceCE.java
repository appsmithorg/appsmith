package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Config;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface ConfigServiceCE {

    Mono<Config> getByName(String name);

    Mono<Config> save(Config config);

    Mono<Config> save(String name, Map<String, Object> config);

    Mono<String> getInstanceId();

    Mono<Void> delete(String name);

    /**
     * Get the instance variables from the instance config
     * @return Map containing the instance variables
     */
    Mono<Map<String, Object>> getInstanceVariables();

    /**
     * Update the instance variables in the instance config
     * @param instanceVariables JSONObject containing the instance variables to update
     * @return Updated Config object
     */
    Mono<Config> updateInstanceVariables(Map<String, Object> instanceVariables);

    /**
     * Check whether bootstrap (first super-user creation) has been completed.
     * Reads the durable {@code bootstrapCompleted} flag from instanceConfig.
     * Missing flag on upgraded instances is treated as complete if users already exist.
     */
    Mono<Boolean> isBootstrapCompleted();

    /**
     * Mark the bootstrap as completed by setting the durable flag on instanceConfig.
     */
    Mono<Config> markBootstrapCompleted();
}
