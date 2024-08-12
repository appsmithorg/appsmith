package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.ce.TenantServiceCEImpl;
import com.appsmith.server.solutions.EnvManager;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Service
public class TenantServiceImpl extends TenantServiceCEImpl implements TenantService {

    public TenantServiceImpl(
            Validator validator,
            TenantRepository repository,
            AnalyticsService analyticsService,
            ConfigService configService,
            @Lazy EnvManager envManager,
            FeatureFlagMigrationHelper featureFlagMigrationHelper,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            CommonConfig commonConfig,
            ObservationRegistry observationRegistry) {
        super(
                validator,
                repository,
                analyticsService,
                configService,
                envManager,
                featureFlagMigrationHelper,
                cacheableRepositoryHelper,
                commonConfig,
                observationRegistry);
    }
}
