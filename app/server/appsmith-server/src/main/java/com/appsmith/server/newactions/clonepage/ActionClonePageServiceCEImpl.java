package com.appsmith.server.newactions.clonepage;

import com.appsmith.external.constants.ActionCreationSourceTypeEnum;
import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.clonepage.ClonePageServiceCE;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ClonePageMetaDTO;
import com.appsmith.server.dtos.CreateActionMetaDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Service
@RequiredArgsConstructor
public class ActionClonePageServiceCEImpl implements ClonePageServiceCE<NewAction> {
    private final NewActionService newActionService;
    private final ActionPermission actionPermission;
    private final LayoutActionService layoutActionService;

    @Override
    public Mono<Void> cloneEntities(ClonePageMetaDTO clonePageMetaDTO) {
        return getCloneableActions(clonePageMetaDTO.getBranchedSourcePageId())
                .flatMap(action -> {
                    // Set new page id in the actionDTO
                    ActionDTO actionDTO = action.getUnpublishedAction();
                    actionDTO.setBranchName(clonePageMetaDTO.getBranchName());

                    actionDTO.setPageId(clonePageMetaDTO.getClonedPageDTO().getId());

                    boolean isJsAction = StringUtils.hasLength(actionDTO.getCollectionId());

                    if (isJsAction) {
                        String newCollectionId =
                                clonePageMetaDTO.getOldToNewCollectionIds().get(actionDTO.getCollectionId());
                        actionDTO.setCollectionId(newCollectionId);
                    }
                    /*
                     * - Now create the new action from the template of the source action.
                     * - Use CLONE_PAGE context to make sure that page / application clone quirks are
                     *   taken care of - e.g. onPageLoad setting is copied from action setting instead of
                     *   being set to off by default.
                     */
                    AppsmithEventContext eventContext = new AppsmithEventContext(AppsmithEventContextType.CLONE_PAGE);
                    ActionDTO cloneActionDTO = new ActionDTO();

                    // Indicates that source of action creation is clone page action
                    cloneActionDTO.setSource(ActionCreationSourceTypeEnum.CLONE_PAGE);
                    copyNestedNonNullProperties(actionDTO, cloneActionDTO);
                    CreateActionMetaDTO createActionMetaDTO = new CreateActionMetaDTO();
                    createActionMetaDTO.setIsJsAction(isJsAction);
                    createActionMetaDTO.setEventContext(eventContext);
                    return layoutActionService.createAction(cloneActionDTO, createActionMetaDTO);
                })
                .then();
    }

    protected Flux<NewAction> getCloneableActions(String pageId) {
        return newActionService
                .findByPageId(pageId, actionPermission.getEditPermission())
                // In case there are no actions in the page being cloned, return empty
                .switchIfEmpty(Flux.empty());
    }
}
