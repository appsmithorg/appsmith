package com.appsmith.server.solutions.ce;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.models.Executable;
import com.appsmith.server.domains.ExecutionDependencyEdge;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface PageLoadActionsUtilCE {

    Mono<List<Set<DslExecutableDTO>>> findAllOnLoadExecutables(
            String pageId,
            Integer evaluatedVersion,
            Set<String> widgetNames,
            Set<ExecutionDependencyEdge> edges,
            Map<String, Set<String>> widgetDynamicBindingsMap,
            List<Executable> flatPageLoadExecutables,
            Set<String> executablesUsedInDSL);

    Flux<Executable> getAllExecutablesByPageIdFlux(String providedPageId);
}
