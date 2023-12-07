package com.appsmith.server.actioncollections.refactors;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class ActionCollectionRefactoringServiceImpl extends ActionCollectionRefactoringServiceCEImpl
        implements EntityRefactoringService<ActionCollection> {
    public ActionCollectionRefactoringServiceImpl(
            ActionCollectionService actionCollectionService,
            NewActionService newActionService,
            ActionPermission actionPermission,
            AstService astService) {
        super(actionCollectionService, newActionService, actionPermission, astService);
    }
}
