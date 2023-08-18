package com.appsmith.server.services;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.ce.CacheableFeatureFlagHelperCEImpl;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CacheableFeatureFlagHelperImpl extends CacheableFeatureFlagHelperCEImpl
        implements CacheableFeatureFlagHelper {
    public CacheableFeatureFlagHelperImpl(
            TenantRepository tenantRepository,
            ConfigService configService,
            CloudServicesConfig cloudServicesConfig,
            CommonConfig commonConfig,
            UserIdentifierService userIdentifierService,
            ReleaseNotesService releaseNotesService) {
        super(
                tenantRepository,
                configService,
                cloudServicesConfig,
                commonConfig,
                userIdentifierService,
                releaseNotesService);
    }
}
