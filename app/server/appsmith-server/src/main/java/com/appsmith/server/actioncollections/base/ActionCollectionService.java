package com.appsmith.server.actioncollections.base;

import com.appsmith.server.domains.ActionCollection;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ActionCollectionService extends ActionCollectionServiceCE {
    Mono<List<ActionCollection>> archiveActionCollectionsByModuleId(String moduleId);
}
