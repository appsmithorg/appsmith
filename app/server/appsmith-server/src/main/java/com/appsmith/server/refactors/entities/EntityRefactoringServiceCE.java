package com.appsmith.server.refactors.entities;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import reactor.core.publisher.Mono;

public interface EntityRefactoringServiceCE<T extends BaseDomain> {

    AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType);

    void sanitizeRefactorEntityDTO(RefactorEntityNameDTO refactorEntityNameDTO);

    Mono<Boolean> validateName(String newName);

    Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO, String branchName);
}
