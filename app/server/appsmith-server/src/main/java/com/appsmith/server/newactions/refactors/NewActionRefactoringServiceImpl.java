package com.appsmith.server.newactions.refactors;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class NewActionRefactoringServiceImpl extends NewActionRefactoringServiceCEImpl
        implements EntityRefactoringService<NewAction> {
    public NewActionRefactoringServiceImpl(NewActionService newActionService, ActionPermission actionPermission) {
        super(newActionService, actionPermission);
    }
}
