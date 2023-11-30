package com.appsmith.server.refactors.entities;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.regex.Pattern;

public interface EntityRefactoringServiceCECompatible<T> extends EntityRefactoringServiceCE<T> {
    Mono<Object> refactorCurrentEntity(
            Object currentEntity,
            RefactorEntityNameDTO refactorEntityNameDTO,
            Pattern oldNamePattern,
            Mono<Integer> evalVersionMono);

    Flux<RefactorEntityNameDTO> getRefactorDTOsForExistingEntityNames(
            String contextId, CreatorContextType contextType, String layoutId);
}
