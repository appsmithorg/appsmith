package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.TenantRepository;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import static com.appsmith.server.acl.AclPermission.MANAGE_TENANT;

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

    @Override
    public Mono<Tenant> updateTenantConfiguration(String tenantId, TenantConfiguration tenantConfiguration) {
        return tenantRepository.findById(tenantId, MANAGE_TENANT)
                .flatMap(tenant -> {
                    TenantConfiguration oldtenantConfiguration = tenant.getTenantConfiguration();
                    AppsmithBeanUtils.copyNestedNonNullProperties(tenantConfiguration, oldtenantConfiguration);
                    tenant.setTenantConfiguration(oldtenantConfiguration);
                    return tenantRepository.updateById(tenantId, tenant, MANAGE_TENANT);
                });
    }

    @Override
    public Mono<Tenant> findById(String tenantId, AclPermission permission) {
        return tenantRepository.findById(tenantId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "tenantId", tenantId)));
    }
}
