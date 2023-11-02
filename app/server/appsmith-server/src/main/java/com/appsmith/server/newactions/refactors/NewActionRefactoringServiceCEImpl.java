package com.appsmith.server.newactions.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.entities.EntityRefactoringServiceCE;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import static com.appsmith.external.constants.AnalyticsEvents.REFACTOR_ACTION;
import static com.appsmith.external.constants.AnalyticsEvents.REFACTOR_JSACTION;

@Slf4j
@RequiredArgsConstructor
public class NewActionRefactoringServiceCEImpl implements EntityRefactoringServiceCE<NewAction> {

    private final NewActionService newActionService;
    private final ActionPermission actionPermission;

    @Override
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return switch (entityType) {
            case JS_ACTION -> REFACTOR_JSACTION;
            case ACTION -> REFACTOR_ACTION;
            default -> null;
        };
    }

    @Override
    public void sanitizeRefactorEntityDTO(RefactorEntityNameDTO refactorEntityNameDTO) {

        String oldName = refactorEntityNameDTO.getOldName();
        final String oldFullyQualifiedName = StringUtils.hasLength(refactorEntityNameDTO.getCollectionName())
                ? refactorEntityNameDTO.getCollectionName() + "." + oldName
                : oldName;
        String newName = refactorEntityNameDTO.getNewName();
        final String newFullyQualifiedName = StringUtils.hasLength(refactorEntityNameDTO.getCollectionName())
                ? refactorEntityNameDTO.getCollectionName() + "." + newName
                : newName;

        refactorEntityNameDTO.setOldFullyQualifiedName(oldFullyQualifiedName);
        refactorEntityNameDTO.setNewFullyQualifiedName(newFullyQualifiedName);
    }

    @Override
    public Mono<Boolean> validateName(String name) {
        return Mono.just(newActionService.validateActionName(name));
    }

    @Override
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO, String branchName) {
        return newActionService
                .findActionDTObyIdAndViewMode(
                        refactorEntityNameDTO.getActionId(), false, actionPermission.getEditPermission())
                .flatMap(action -> {
                    action.setName(refactorEntityNameDTO.getNewName());
                    if (StringUtils.hasLength(refactorEntityNameDTO.getCollectionName())) {
                        action.setFullyQualifiedName(refactorEntityNameDTO.getNewFullyQualifiedName());
                    }
                    return newActionService.updateUnpublishedAction(refactorEntityNameDTO.getActionId(), action);
                })
                .then();
    }
}
