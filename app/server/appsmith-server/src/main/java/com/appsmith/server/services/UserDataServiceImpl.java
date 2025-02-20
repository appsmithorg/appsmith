package com.appsmith.server.services;

import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.UserDataRepositoryCake;
import com.appsmith.server.repositories.cakes.UserRepositoryCake;
import com.appsmith.server.services.ce.UserDataServiceCEImpl;
import com.appsmith.server.solutions.ReleaseNotesService;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;

@Service
public class UserDataServiceImpl extends UserDataServiceCEImpl implements UserDataService {

    public UserDataServiceImpl(
            Validator validator,
            UserDataRepository repositoryDirect,
            UserDataRepositoryCake repository,
            AnalyticsService analyticsService,
            UserRepositoryCake userRepository,
            SessionUserService sessionUserService,
            AssetService assetService,
            ReleaseNotesService releaseNotesService,
            FeatureFlagService featureFlagService,
            ApplicationRepositoryCake applicationRepository,
            OrganizationService organizationService) {

        super(
                validator,
                repositoryDirect,
                repository,
                analyticsService,
                userRepository,
                sessionUserService,
                assetService,
                releaseNotesService,
                featureFlagService,
                applicationRepository,
                organizationService);
    }
}
