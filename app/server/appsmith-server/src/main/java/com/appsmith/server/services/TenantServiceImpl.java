package com.appsmith.server.services;

import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.cakes.TenantRepositoryCake;
import com.appsmith.server.services.ce.TenantServiceCEImpl;
import com.appsmith.server.solutions.EnvManager;
import jakarta.validation.Validator;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
public class TenantServiceImpl extends TenantServiceCEImpl implements TenantService {

    public TenantServiceImpl(
            Scheduler scheduler,
            Validator validator,
            TenantRepository repositoryDirect,
            TenantRepositoryCake repository,
            AnalyticsService analyticsService,
            ConfigService configService,
            @Lazy EnvManager envManager,
            FeatureFlagMigrationHelper featureFlagMigrationHelper,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(
                validator,
                repositoryDirect,
                repository,
                analyticsService,
                configService,
                envManager,
                featureFlagMigrationHelper,
                cacheableRepositoryHelper);
    }
}
