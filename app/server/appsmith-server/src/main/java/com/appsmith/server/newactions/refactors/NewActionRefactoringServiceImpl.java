package com.appsmith.server.newactions.refactors;

import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.ActionPermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class NewActionRefactoringServiceImpl extends NewActionRefactoringServiceCEImpl
        implements EntityRefactoringService<NewAction> {
    public NewActionRefactoringServiceImpl(
            NewActionService newActionService,
            ActionPermission actionPermission,
            AstService astService,
            InstanceConfig instanceConfig,
            ObjectMapper objectMapper) {
        super(newActionService, actionPermission, astService, instanceConfig, objectMapper);
    }
}
