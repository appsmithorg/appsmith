package com.appsmith.server.services;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.services.ce.LayoutCollectionServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface LayoutCollectionService extends LayoutCollectionServiceCE {

    Flux<ActionCollection> findAllActionCollectionsByContextIdAndContextTypeAndViewMode(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean viewMode);

    Mono<ActionCollectionDTO> generateActionCollectionByViewMode(ActionCollection actionCollection, Boolean viewMode);
}
