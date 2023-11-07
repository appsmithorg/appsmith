package com.appsmith.server.solutions;

import com.appsmith.server.domains.License;
import reactor.core.publisher.Mono;

public interface LicenseCacheHelper {
    /**
     * Get license details mapped to tenantId, returns empty mono if not present
     */
    Mono<License> get(String tenantId);

    Mono<License> getDefault();

    /**
     * Put license details mapped to tenantId
     */
    Mono<License> put(String tenantId, License license);

    /**
     * Remove license details mapped to tenantId
     */
    Mono<License> remove(String tenantId);
}
