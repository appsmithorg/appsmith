package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.TenantRepository;
import reactor.core.publisher.Mono;

public class TenantServiceCEImpl implements TenantServiceCE {

    private final TenantRepository tenantRepository;

    private Mono<String> defaultTenantIdCacheMono = null;

    public TenantServiceCEImpl(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    public Mono<String> getDefaultTenantId() {
        // If the default tenant id does not exist in cache, find from repository and set the cache.
        if (defaultTenantIdCacheMono == null ) {
            defaultTenantIdCacheMono = getDefaultTenantIdFromRepository();
        }

        return defaultTenantIdCacheMono
                .onErrorResume(throwable -> {
                    // In case the cache is in error state, re-fetch the tenant
                    return getDefaultTenantIdFromRepository();
                });
    }

    private Mono<String> getDefaultTenantIdFromRepository() {
        return tenantRepository.findBySlug(FieldName.DEFAULT)
                .map(Tenant::getId);
    }
}
