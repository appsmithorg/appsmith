package com.appsmith.server.newactions.clonepage;

import com.appsmith.server.clonepage.ClonePageService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;

@Service
public class ActionClonePageServiceImpl extends ActionClonePageServiceCEImpl implements ClonePageService<NewAction> {
    public ActionClonePageServiceImpl(
            NewActionService newActionService,
            ActionPermission actionPermission,
            LayoutActionService layoutActionService) {
        super(newActionService, actionPermission, layoutActionService);
    }
}
