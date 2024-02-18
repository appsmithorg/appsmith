package com.appsmith.server.actions.refactors;

import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.domains.Action;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.ActionPermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class NewActionRefactoringServiceImpl extends NewActionRefactoringServiceCEImpl
        implements EntityRefactoringService<Action> {
    public NewActionRefactoringServiceImpl(
            ActionService actionService,
            ActionPermission actionPermission,
            AstService astService,
            InstanceConfig instanceConfig,
            ObjectMapper objectMapper) {
        super(actionService, actionPermission, astService, instanceConfig, objectMapper);
    }
}
