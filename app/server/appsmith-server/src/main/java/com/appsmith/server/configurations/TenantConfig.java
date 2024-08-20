package com.appsmith.server.configurations;

import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

import static com.appsmith.external.models.BaseDomain.policySetToMap;

@Configuration
@RequiredArgsConstructor
public class TenantConfig {

    private final TenantService tenantService;
    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    // Bean to cleanup the cache and update the default tenant policies on every server restart. This will make sure
    // cache will be updated if we update the tenant via migrations.
    @Bean
    public void cleanupAndUpdateRefreshDefaultTenantPolicies() {
        tenantService
                .getDefaultTenantId()
                .flatMap(cacheableRepositoryHelper::evictCachedTenant)
                .then(tenantService.getDefaultTenant())
                .flatMap(tenant -> {
                    if (CollectionUtils.isNullOrEmpty(tenant.getPolicyMap())) {
                        tenant.setPolicyMap(policySetToMap(tenant.getPolicies()));
                        return tenantService.save(tenant);
                    }
                    return Mono.just(tenant);
                })
                .subscribe();
    }
}
