package com.appsmith.server.actions.refactors;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class JsActionRefactoringServiceImpl extends JsActionRefactoringServiceCEImpl
        implements EntityRefactoringService<Void> {
    public JsActionRefactoringServiceImpl(
            ActionService actionService,
            ActionCollectionService actionCollectionService,
            EntityRefactoringService<Action> newActionEntityRefactoringService,
            ActionPermission actionPermission) {
        super(actionService, actionCollectionService, newActionEntityRefactoringService, actionPermission);
    }
}
