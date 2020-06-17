package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CustomApplicationRepository extends AppsmithRepository<Application> {

    Mono<Application> findByIdAndOrganizationId(String id, String orgId, AclPermission permission);

    Mono<Application> findByName(String name, AclPermission permission);

    Flux<Application> findByOrganizationId(String orgId, AclPermission permission);

    Flux<Application> findByMultipleOrganizationIds(Set<String> orgIds, AclPermission permission);
}
