package com.appsmith.server.actioncollections.base;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
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
            ResponseUtils responseUtils,
            ApplicationPermission applicationPermission,
            ActionPermission actionPermission,
            DefaultResourcesService<ActionCollection> defaultResourcesService,
            DefaultResourcesService<ActionCollectionDTO> dtoDefaultResourcesService,
            DefaultResourcesService<NewAction> newActionDefaultResourcesService,
            DefaultResourcesService<ActionDTO> actionDTODefaultResourcesService) {
        super(
                validator,
                repository,
                analyticsService,
                newActionService,
                policyGenerator,
                applicationService,
                responseUtils,
                applicationPermission,
                actionPermission,
                defaultResourcesService,
                dtoDefaultResourcesService,
                newActionDefaultResourcesService,
                actionDTODefaultResourcesService);
    }
}
