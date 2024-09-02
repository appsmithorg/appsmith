package com.appsmith.server.newpages.base;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NewPageServiceImpl extends NewPageServiceCEImpl implements NewPageService {

    public NewPageServiceImpl(
            Validator validator,
            NewPageRepository repository,
            AnalyticsService analyticsService,
            ApplicationService applicationService,
            UserDataService userDataService,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ObservationRegistry observationRegistry) {
        super(
                validator,
                repository,
                analyticsService,
                applicationService,
                userDataService,
                applicationPermission,
                pagePermission,
                observationRegistry);
    }
}
