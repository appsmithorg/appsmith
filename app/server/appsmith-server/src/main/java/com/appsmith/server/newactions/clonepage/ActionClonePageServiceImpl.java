package com.appsmith.server.newactions.clonepage;

import com.appsmith.server.clonepage.ClonePageService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.ActionPermission;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class ActionClonePageServiceImpl extends ActionClonePageServiceCEImpl implements ClonePageService<NewAction> {
    public ActionClonePageServiceImpl(
            NewActionService newActionService,
            ActionPermission actionPermission,
            LayoutActionService layoutActionService) {
        super(newActionService, actionPermission, layoutActionService);
    }

    @Override
    protected Flux<NewAction> getCloneableActions(String pageId) {
        Flux<NewAction> sourceActionFlux = super.getCloneableActions(pageId)
                .filter(newAction -> newAction.getRootModuleInstanceId() == null)
                // Set collection reference in actions to null to reset to the new application's collections later
                .map(newAction -> {
                    if (newAction.getUnpublishedAction() != null) {
                        newAction.getUnpublishedAction().setCollectionId(null);
                    }
                    return newAction;
                })
                // In case there are no actions in the page being cloned, return empty
                .switchIfEmpty(Flux.empty());
        return sourceActionFlux;
    }
}
