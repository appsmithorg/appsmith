package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.TenantRepository;
import reactor.core.publisher.Mono;

public class TenantServiceCEImpl implements TenantServiceCE {

    private final TenantRepository tenantRepository;

    public TenantServiceCEImpl(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    public Mono<String> getDefaultTenantId() {
        return tenantRepository.findBySlug(FieldName.DEFAULT)
                .map(Tenant::getId);
    }

}
