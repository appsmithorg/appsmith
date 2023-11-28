package com.appsmith.server.refactors.applications;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface RefactoringService extends RefactoringServiceCE {
    Mono<Object> refactorCurrentEntity(
            Object currentEntity,
            EntityType entityType,
            RefactorEntityNameDTO refactorEntityNameDTO,
            Mono<Integer> evalVersionMono);

    Mono<LayoutDTO> refactorCompositeEntityName(RefactorEntityNameDTO refactorEntityNameDTO, String branchName);

    Mono<Set<RefactorEntityNameDTO>> getRefactorDTOsForAllExistingEntitiesMono(
            String contextId, CreatorContextType contextType, String layoutId, boolean isFQN);
}
