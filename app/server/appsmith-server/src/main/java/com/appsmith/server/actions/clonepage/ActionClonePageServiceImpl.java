package com.appsmith.server.actions.clonepage;

import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.clonepage.ClonePageService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class ActionClonePageServiceImpl extends ActionClonePageServiceCEImpl implements ClonePageService<Action> {
    public ActionClonePageServiceImpl(
            ActionService actionService, ActionPermission actionPermission, LayoutActionService layoutActionService) {
        super(actionService, actionPermission, layoutActionService);
    }
}
