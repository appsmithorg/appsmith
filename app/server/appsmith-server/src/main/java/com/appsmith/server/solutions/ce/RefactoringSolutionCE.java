package com.appsmith.server.solutions.ce;

import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorActionNameDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Set;

public interface RefactoringSolutionCE {

    Mono<LayoutDTO> refactorWidgetName(RefactorNameDTO refactorNameDTO);

    Mono<LayoutDTO> refactorWidgetName(RefactorNameDTO refactorNameDTO, String branchName);

    Mono<LayoutDTO> refactorActionName(RefactorActionNameDTO refactorActionNameDTO);

    Mono<LayoutDTO> refactorActionName(RefactorActionNameDTO refactorActionNameDTO, String branchName);

    Mono<LayoutDTO> refactorActionCollectionName(String appId, String pageId, String layoutId, String oldName, String newName);

    /**
     * This method is responsible for the core logic of refactoring a valid name inside an Appsmith page.
     * This includes refactoring inside the DSL, in actions, and JS objects.
     * @param pageId The page where the refactor needs to happen
     * @param layoutId The layout where the refactor needs to happen
     * @param oldName The valid name to convert from. For JS functions, this would be the FQN
     * @param newName The new name to convert into. For JS functions, this would be FQN
     * @return A tuple of the updated layout after refactoring and a set of all the paths in the page that ended up getting refactored
     */
    Mono<Tuple2<LayoutDTO, Set<String>>> refactorName(String pageId, String layoutId, String oldName, String newName);
}
