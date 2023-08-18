package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.domains.ActionDependencyEdge;
import com.appsmith.server.dtos.DslActionDTO;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface PageLoadActionsUtilCE {

    Mono<List<Set<DslActionDTO>>> findAllOnLoadActions(
            String pageId,
            Integer evaluatedVersion,
            Set<String> widgetNames,
            Set<ActionDependencyEdge> edges,
            Map<String, Set<String>> widgetDynamicBindingsMap,
            List<ActionDTO> flatPageLoadActions,
            Set<String> actionsUsedInDSL);
}
