package com.appsmith.server.actioncollections.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ActionCollectionService extends ActionCollectionServiceCE {
    Mono<List<ActionCollection>> archiveActionCollectionsByModuleId(String moduleId);

    Flux<ActionCollection> findAllUnpublishedComposedActionsByContextIdAndContextTypeAndModuleInstanceId(
            String creatorId,
            CreatorContextType creatorContextType,
            String moduleInstanceId,
            AclPermission editPermission);
}
