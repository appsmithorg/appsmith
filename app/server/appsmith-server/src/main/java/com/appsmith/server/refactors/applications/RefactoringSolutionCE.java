package com.appsmith.server.refactors.applications;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import reactor.core.publisher.Mono;

public interface RefactoringSolutionCE {

    Mono<LayoutDTO> refactorEntityName(RefactorEntityNameDTO refactorEntityNameDTO, String branchName);

    Mono<Boolean> isNameAllowed(String contextId, CreatorContextType contextType, String layoutId, String newName);
}
