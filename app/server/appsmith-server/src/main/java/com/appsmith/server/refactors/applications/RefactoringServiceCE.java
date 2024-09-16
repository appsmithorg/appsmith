package com.appsmith.server.refactors.applications;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface RefactoringServiceCE {

    Mono<LayoutDTO> refactorEntityName(RefactorEntityNameDTO refactorEntityNameDTO);

    Mono<Boolean> isNameAllowed(String contextId, CreatorContextType contextType, String layoutId, String newName);

    Mono<Set<String>> getAllExistingEntitiesMono(
            String contextId, CreatorContextType contextType, String layoutId, boolean isFQN);
}
