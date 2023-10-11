package com.appsmith.server.connectionpoolconfig.configurations;

import com.appsmith.external.connectionpoolconfig.configurations.ConnectionPoolConfig;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.TenantService;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class ConnectionPoolConfigImpl extends ConnectionPoolConfigCECompatibleImpl implements ConnectionPoolConfig {

    private final TenantService tenantService;
    private static final Integer MAXIMUM_CONFIGURABLE_POOL_SIZE = 50;

    public ConnectionPoolConfigImpl(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_connection_pool_size_enabled)
    public Mono<Integer> getMaxConnectionPoolSize() {
        return tenantService.getDefaultTenant().flatMap(tenant -> {
            if (tenant.getTenantConfiguration() == null) {
                return super.getMaxConnectionPoolSize();
            }

            Integer connectionMaxPoolSize = tenant.getTenantConfiguration().getConnectionMaxPoolSize();
            // this check is for ensuring that the maxPoolSize ∈ [5, 50]
            if (connectionMaxPoolSize == null
                    || connectionMaxPoolSize < DEFAULT_MINIMUM_MAX_POOL_SIZE
                    || connectionMaxPoolSize > MAXIMUM_CONFIGURABLE_POOL_SIZE) {
                return super.getMaxConnectionPoolSize();
            }

            return Mono.just(connectionMaxPoolSize);
        });
    }
}
