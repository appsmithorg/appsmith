package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Page;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomPageRepository extends AppsmithRepository<Page> {
    Mono<Page> findByIdAndLayoutsId(String id, String layoutId, AclPermission aclPermission);

    Mono<Page> findByName(String name, AclPermission aclPermission);

    Flux<Page> findByApplicationId(String applicationId, AclPermission aclPermission);

    Mono<Page> findByNameAndApplicationId(String name, String applicationId, AclPermission aclPermission);
}
