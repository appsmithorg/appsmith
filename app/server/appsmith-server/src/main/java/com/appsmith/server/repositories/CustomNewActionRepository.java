package com.appsmith.server.repositories;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomNewActionRepository extends CustomNewActionRepositoryCE {

    Flux<NewAction> findAllNonJSActionsByApplicationIds(List<String> applicationIds, List<String> includeFields);

    Flux<NewAction> findAllByActionCollectionIdWithoutPermissions(
            List<String> collectionIds, List<String> includeFields);

    Flux<NewAction> findAllNonJSActionsByModuleId(String moduleId);

    Mono<NewAction> findPublicActionByModuleId(String moduleId);

    Flux<NewAction> findUnpublishedActionsByModuleIdAndExecuteOnLoadSetByUserTrue(
            String moduleId, AclPermission editPermission);

    Flux<NewAction> findAllUnpublishedComposedActionsByContextIdAndContextTypeAndModuleInstanceId(
            String contextId,
            CreatorContextType contextType,
            String moduleInstanceId,
            AclPermission permission,
            boolean includeJs);
}
