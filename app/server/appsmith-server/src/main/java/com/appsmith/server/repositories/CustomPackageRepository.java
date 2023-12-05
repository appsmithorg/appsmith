package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Package;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface CustomPackageRepository extends AppsmithRepository<Package> {
    Flux<Package> findAllUserPackages(AclPermission permission);

    Flux<Package> findAllConsumablePackages(String workspaceId, AclPermission permission);

    Mono<UpdateResult> update(String id, Update updateObj, AclPermission permission);

    Mono<Package> findByBranchNameAndDefaultPackageId(
            String defaultPackageId, List<String> projectionFieldNames, String branchName, AclPermission aclPermission);

    Mono<UpdateResult> updateFieldByDefaultIdAndBranchName(
            String contextId,
            String defaultIdPath,
            Map<String, Object> fieldNameValueMap,
            String branchName,
            String branchNamePath,
            AclPermission aclPermission);
}
