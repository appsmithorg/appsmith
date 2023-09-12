package com.appsmith.server.onpageload.internal;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.models.Executable;
import com.appsmith.server.domains.ExecutableDependencyEdge;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface PageLoadExecutablesUtilCE {

    Mono<List<Set<DslExecutableDTO>>> findAllOnLoadExecutables(
            String pageId,
            Integer evaluatedVersion,
            Set<String> widgetNames,
            Set<ExecutableDependencyEdge> edges,
            Map<String, Set<String>> widgetDynamicBindingsMap,
            List<Executable> flatPageLoadExecutables,
            Set<String> executablesUsedInDSL);
}
