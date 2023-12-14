package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface CustomNewActionRepository extends CustomNewActionRepositoryCE {

    Flux<NewAction> findAllNonJSActionsByApplicationIds(List<String> applicationIds, List<String> includeFields);

    Flux<NewAction> findAllByActionCollectionIdWithoutPermissions(
            List<String> collectionIds, List<String> includeFields);

    Flux<NewAction> findAllNonJSActionsByModuleId(String moduleId);

    Mono<NewAction> findPublicActionByModuleId(String moduleId, ResourceModes resourceMode);

    Flux<NewAction> findAllByRootModuleInstanceId(
            String rootModuleInstanceId, Optional<AclPermission> permission, boolean includeJs);

    Flux<NewAction> findUnpublishedActionsByModuleIdAndExecuteOnLoadSetByUserTrue(
            String moduleId, AclPermission editPermission);

    Flux<NewAction> findByWorkflowId(
            String workflowId, Optional<AclPermission> aclPermission, Optional<List<String>> includeFields);

    Flux<NewAction> findByWorkflowIds(
            List<String> workflowIds, Optional<AclPermission> aclPermission, Optional<List<String>> includeFields);

    Mono<UpdateResult> archiveDeletedUnpublishedActionsForWorkflows(String workflowId, AclPermission aclPermission);

    Mono<List<BulkWriteResult>> publishActionsForWorkflows(String workflowId, AclPermission aclPermission);

    Flux<NewAction> findPublicActionsByModuleInstanceId(String moduleInstanceId, Optional<AclPermission> permission);

    Flux<NewAction> findAllByCollectionIds(List<String> collectionIds, List<String> includeFields, boolean viewMode);
}
