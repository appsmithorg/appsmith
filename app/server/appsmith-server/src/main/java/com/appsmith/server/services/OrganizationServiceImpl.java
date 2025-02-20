package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.cakes.OrganizationRepositoryCake;
import com.appsmith.server.services.ce.OrganizationServiceCEImpl;
import com.appsmith.server.solutions.EnvManager;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Service
public class OrganizationServiceImpl extends OrganizationServiceCEImpl implements OrganizationService {

    public OrganizationServiceImpl(
            Validator validator,
            OrganizationRepositoryCake repository,
            OrganizationRepository repositoryDirect,
            AnalyticsService analyticsService,
            ConfigService configService,
            @Lazy EnvManager envManager,
            FeatureFlagMigrationHelper featureFlagMigrationHelper,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            CommonConfig commonConfig,
            ObservationRegistry observationRegistry,
            SessionUserService sessionUserService) {
        super(
                validator,
                repositoryDirect,
                repository,
                analyticsService,
                configService,
                envManager,
                featureFlagMigrationHelper,
                cacheableRepositoryHelper,
                commonConfig,
                observationRegistry,
                sessionUserService);
    }
}
