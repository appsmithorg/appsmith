package com.appsmith.server.actions.clonepage;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.clonepage.ClonePageServiceCE;
import com.appsmith.server.domains.Action;
import com.appsmith.server.dtos.ClonePageMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Service
@RequiredArgsConstructor
public class ActionClonePageServiceCEImpl implements ClonePageServiceCE<Action> {
    private final ActionService actionService;
    private final ActionPermission actionPermission;
    private final LayoutActionService layoutActionService;

    @Override
    public Mono<Void> cloneEntities(ClonePageMetaDTO clonePageMetaDTO) {
        return getCloneableActions(clonePageMetaDTO.getBranchedSourcePageId())
                .flatMap(action -> {
                    String originalActionId = action.getId();
                    // Set new page id in the actionDTO
                    final DefaultResources clonedPageDefaultResources =
                            clonePageMetaDTO.getClonedPageDTO().getDefaultResources();
                    action.getUnpublishedAction()
                            .setPageId(clonePageMetaDTO.getClonedPageDTO().getId());
                    action.getUnpublishedAction().setDefaultResources(clonedPageDefaultResources);
                    /*
                     * - Now create the new action from the template of the source action.
                     * - Use CLONE_PAGE context to make sure that page / application clone quirks are
                     *   taken care of - e.g. onPageLoad setting is copied from action setting instead of
                     *   being set to off by default.
                     */
                    AppsmithEventContext eventContext = new AppsmithEventContext(AppsmithEventContextType.CLONE_PAGE);
                    ActionDTO cloneActionDTO = new ActionDTO();
                    copyNestedNonNullProperties(action.getUnpublishedAction(), cloneActionDTO);
                    return Mono.zip(
                            layoutActionService
                                    .createAction(cloneActionDTO, eventContext, Boolean.FALSE)
                                    .map(clonedAction -> {
                                        clonePageMetaDTO
                                                .getOldToNewActionIdMap()
                                                .put(action.getId(), clonedAction.getId());
                                        return clonedAction.getId();
                                    }),
                            Mono.justOrEmpty(originalActionId));
                })
                .collect(HashMap<String, String>::new, (map, tuple2) -> map.put(tuple2.getT2(), tuple2.getT1()))
                .flatMap(oldToClonedActionIdMap -> {
                    clonePageMetaDTO.setOldToNewActionIdMap(oldToClonedActionIdMap);
                    return Mono.empty().then();
                });
    }

    @Override
    public Mono<Void> updateClonedEntities(ClonePageMetaDTO clonePageMetaDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    protected Flux<Action> getCloneableActions(String pageId) {
        Flux<Action> sourceActionFlux = actionService
                .findByPageId(pageId, actionPermission.getEditPermission())
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
