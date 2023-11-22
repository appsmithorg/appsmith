package com.appsmith.server.refactors.applications;

import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import reactor.core.publisher.Mono;

public interface RefactoringSolution extends RefactoringSolutionCE {

    Mono<LayoutDTO> refactorCompositeEntityName(RefactorEntityNameDTO refactorEntityNameDTO, String branchName);
}
