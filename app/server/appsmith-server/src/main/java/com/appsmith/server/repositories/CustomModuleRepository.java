package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Module;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomModuleRepository extends AppsmithRepository<Module> {
    Flux<Module> getAllModulesByPackageId(String packageId, AclPermission permission);

    Flux<Module> getAllConsumableModulesByPackageIds(List<String> packageIds, AclPermission permission);

    Mono<UpdateResult> update(String id, Update updateObj, AclPermission permission);

    Mono<Module> findByIdAndLayoutsIdAndViewMode(
            String creatorId, String layoutId, AclPermission permission, ResourceModes resourceModes);

    Flux<Module> findAllByIds(Set<String> ids, List<String> projectionFields, Optional<AclPermission> permission);

    Mono<Module> findConsumableModuleByPackageIdAndOriginModuleId(
            String packageId, String originModuleId, Optional<AclPermission> permission);
}
