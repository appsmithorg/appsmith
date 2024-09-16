package com.appsmith.server.actioncollections.base;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ActionCollectionServiceImpl extends ActionCollectionServiceCEImpl implements ActionCollectionService {
    public ActionCollectionServiceImpl(
            Validator validator,
            ActionCollectionRepository repository,
            AnalyticsService analyticsService,
            NewActionService newActionService,
            PolicyGenerator policyGenerator,
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            ActionPermission actionPermission,
            ObservationRegistry observationRegistry) {
        super(
                validator,
                repository,
                analyticsService,
                newActionService,
                policyGenerator,
                applicationService,
                applicationPermission,
                actionPermission,
                observationRegistry);
    }
}
