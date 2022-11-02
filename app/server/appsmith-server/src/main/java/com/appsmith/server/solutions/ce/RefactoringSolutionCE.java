package com.appsmith.server.solutions.ce;

import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorActionNameDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import reactor.core.publisher.Mono;

public interface RefactoringSolutionCE {

    Mono<LayoutDTO> refactorWidgetName(RefactorNameDTO refactorNameDTO);

    Mono<LayoutDTO> refactorWidgetName(RefactorNameDTO refactorNameDTO, String branchName);

    Mono<LayoutDTO> refactorActionName(RefactorActionNameDTO refactorActionNameDTO);

    Mono<LayoutDTO> refactorActionName(RefactorActionNameDTO refactorActionNameDTO, String branchName);

    Mono<LayoutDTO> refactorName(String pageId, String layoutId, String oldName, String newName);
}
