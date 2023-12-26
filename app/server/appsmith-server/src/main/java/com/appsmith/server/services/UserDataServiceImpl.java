package com.appsmith.server.services;

import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.UserDataRepositoryCake;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import com.appsmith.server.services.ce.UserDataServiceCEImpl;
import com.appsmith.server.solutions.ReleaseNotesService;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
public class UserDataServiceImpl extends UserDataServiceCEImpl implements UserDataService {

    public UserDataServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            UserDataRepositoryCake repository,
            AnalyticsService analyticsService,
            UserRepositoryCake userRepository,
            SessionUserService sessionUserService,
            AssetService assetService,
            ReleaseNotesService releaseNotesService,
            FeatureFlagService featureFlagService,
            ApplicationRepositoryCake applicationRepository,
            TenantService tenantService) {

        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                userRepository,
                sessionUserService,
                assetService,
                releaseNotesService,
                featureFlagService,
                applicationRepository,
                tenantService);
    }
}
