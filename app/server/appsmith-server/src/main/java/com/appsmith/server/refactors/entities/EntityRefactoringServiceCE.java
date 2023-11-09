package com.appsmith.server.refactors.entities;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import reactor.core.publisher.Mono;

public interface EntityRefactoringServiceCE<T> {

    AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType);

    default void sanitizeRefactorEntityDTO(RefactorEntityNameDTO refactorEntityNameDTO) {
        refactorEntityNameDTO.setOldFullyQualifiedName(refactorEntityNameDTO.getOldName());
        refactorEntityNameDTO.setNewFullyQualifiedName(refactorEntityNameDTO.getNewName());
    }

    Mono<Boolean> validateName(String newName);

    Mono<Void> refactorReferencesInExistingEntities(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO);

    Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO, String branchName);
}
