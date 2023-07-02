package com.appsmith.server.services;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.services.ce.CacheableFeatureFlagHelperCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CacheableFeatureFlagHelperImpl extends CacheableFeatureFlagHelperCEImpl implements CacheableFeatureFlagHelper {
    public CacheableFeatureFlagHelperImpl(TenantService tenantService, ConfigService configService,
                                          CloudServicesConfig cloudServicesConfig) {
        super(tenantService, configService, cloudServicesConfig);
    }
}
