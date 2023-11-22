package com.appsmith.server.repositories;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.List;

public interface CustomActionCollectionRepository extends CustomActionCollectionRepositoryCE {
    Flux<ActionCollection> findAllByModuleIds(List<String> moduleIds, List<String> includeFields);

    Flux<ActionCollection> findAllUnpublishedComposedCollectionsByContextIdAndContextTypeAndModuleInstanceId(
            String contextId, CreatorContextType contextType, String moduleInstanceId, AclPermission permission);
}
