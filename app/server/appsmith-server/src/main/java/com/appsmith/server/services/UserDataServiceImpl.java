package com.appsmith.server.services;

import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.UserDataServiceCEImpl;
import com.appsmith.server.solutions.ReleaseNotesService;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;

@Service
public class UserDataServiceImpl extends UserDataServiceCEImpl implements UserDataService {

    public UserDataServiceImpl(
            Validator validator,
            UserDataRepository repository,
            AnalyticsService analyticsService,
            UserRepository userRepository,
            SessionUserService sessionUserService,
            AssetService assetService,
            ReleaseNotesService releaseNotesService,
            FeatureFlagService featureFlagService,
            ApplicationRepository applicationRepository,
            OrganizationService organizationService) {

        super(
                validator,
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
