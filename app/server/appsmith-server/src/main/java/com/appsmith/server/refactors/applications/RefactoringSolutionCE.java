package com.appsmith.server.refactors.applications;

import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import reactor.core.publisher.Mono;

public interface RefactoringSolutionCE {

    Mono<LayoutDTO> refactorEntityName(RefactorEntityNameDTO refactorEntityNameDTO, String branchName);
}
