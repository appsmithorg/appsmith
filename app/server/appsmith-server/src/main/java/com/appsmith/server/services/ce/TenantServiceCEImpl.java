package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.TenantRepository;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

public class TenantServiceCEImpl implements TenantServiceCE {

    private final TenantRepository tenantRepository;

    private String tenantId = null;

    public TenantServiceCEImpl(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    public Mono<String> getDefaultTenantId() {

        // If the value exists in cache, return it as is
        if (StringUtils.hasLength(tenantId)) {
            return Mono.just(tenantId);
        }

        return tenantRepository.findBySlug(FieldName.DEFAULT)
                .map(Tenant::getId)
                .map(tenantId -> {
                    // Set the cache value before returning.
                    this.tenantId = tenantId;
                    return tenantId;
                });
    }

}
