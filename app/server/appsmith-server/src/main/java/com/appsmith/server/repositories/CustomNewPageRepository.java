package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewPage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomNewPageRepository extends AppsmithRepository<NewPage> {
    Flux<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission);

    Mono<NewPage> findByIdAndLayoutsIdAndViewMode(String id, String layoutId, AclPermission aclPermission, Boolean viewMode);

    Mono<NewPage> findByNameAndViewMode(String name, AclPermission aclPermission, Boolean viewMode);

    Mono<NewPage> findByNameAndApplicationIdAndViewMode(String name, String applicationId, AclPermission aclPermission, Boolean viewMode);
}
