package com.appsmith.server.newactions.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringService;
import com.appsmith.server.refactors.entities.EntityRefactoringServiceCE;
import com.appsmith.server.refactors.utils.RefactoringUtils;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import static com.appsmith.external.constants.AnalyticsEvents.REFACTOR_JSACTION;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;

@Slf4j
@RequiredArgsConstructor
public class JsActionRefactoringServiceCEImpl implements EntityRefactoringServiceCE<Void> {

    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final EntityRefactoringService<NewAction> newActionEntityRefactoringService;
    private final ActionPermission actionPermission;

    @Override
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return REFACTOR_JSACTION;
    }

    @Override
    public void sanitizeRefactorEntityDTO(RefactorEntityNameDTO refactorEntityNameDTO) {
        RefactoringUtils.updateFQNUsingCollectionName(refactorEntityNameDTO);
    }

    @Override
    public Mono<Void> refactorReferencesInExistingEntities(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO, String branchName) {
        ActionCollectionDTO defaultActionCollection = refactorEntityNameDTO.getActionCollection();

        // Fetch branched action as client only knows about the default action IDs
        Mono<RefactorEntityNameDTO> branchedActionMono = newActionService
                .findByBranchNameAndDefaultActionId(
                        branchName, refactorEntityNameDTO.getActionId(), actionPermission.getEditPermission())
                .map(branchedAction -> {
                    refactorEntityNameDTO.setActionId(branchedAction.getId());
                    defaultActionCollection.setPageId(
                            branchedAction.getUnpublishedAction().getPageId());
                    defaultActionCollection.setApplicationId(branchedAction.getApplicationId());
                    return refactorEntityNameDTO;
                });

        Mono<ActionCollection> branchedCollectionMono;
        if (!StringUtils.hasLength(branchName)) {
            branchedCollectionMono = actionCollectionService
                    .findById(defaultActionCollection.getId(), actionPermission.getEditPermission())
                    .switchIfEmpty(Mono.error(new AppsmithException(
                            AppsmithError.ACL_NO_RESOURCE_FOUND,
                            FieldName.ACTION_COLLECTION,
                            defaultActionCollection.getId())));
        } else {
            branchedCollectionMono = actionCollectionService.findByBranchNameAndDefaultCollectionId(
                    branchName, defaultActionCollection.getId(), actionPermission.getEditPermission());
        }

        return Mono.zip(branchedActionMono, branchedCollectionMono).flatMap(tuple -> {
            ActionCollection dbActionCollection = tuple.getT2();
            final ActionCollectionDTO actionCollectionDTO = refactorEntityNameDTO.getActionCollection();

            actionCollectionDTO.setName(
                    dbActionCollection.getUnpublishedCollection().getName());
            actionCollectionDTO.setDefaultToBranchedActionIdsMap(
                    dbActionCollection.getUnpublishedCollection().getDefaultToBranchedActionIdsMap());
            actionCollectionDTO.setDefaultToBranchedArchivedActionIdsMap(
                    dbActionCollection.getUnpublishedCollection().getDefaultToBranchedArchivedActionIdsMap());
            copyNewFieldValuesIntoOldObject(actionCollectionDTO, dbActionCollection.getUnpublishedCollection());

            // First perform refactor of the action itself
            final Mono<Void> updatedActionMono =
                    newActionEntityRefactoringService.updateRefactoredEntity(refactorEntityNameDTO, branchName);

            Mono<ActionCollection> updatedActionCollectionMono =
                    actionCollectionService.update(actionCollectionDTO.getId(), dbActionCollection);

            return updatedActionMono
                    .then(Mono.defer(() -> updatedActionCollectionMono))
                    .then();
        });
    }
}
