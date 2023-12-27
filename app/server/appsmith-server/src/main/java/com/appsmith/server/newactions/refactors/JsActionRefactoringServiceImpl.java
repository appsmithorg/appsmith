package com.appsmith.server.newactions.refactors;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class JsActionRefactoringServiceImpl extends JsActionRefactoringServiceCEImpl
        implements EntityRefactoringService<Void> {
    public JsActionRefactoringServiceImpl(
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            EntityRefactoringService<NewAction> newActionEntityRefactoringService,
            ActionPermission actionPermission) {
        super(newActionService, actionCollectionService, newActionEntityRefactoringService, actionPermission);
    }
}
