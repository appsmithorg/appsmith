package com.appsmith.server.repositories;

import com.appsmith.server.constants.AclPermission;
import com.appsmith.server.domains.Application;
import reactor.core.publisher.Mono;

public interface CustomApplicationRepository extends AppsmithRepository<Application> {

    Mono<Application> findByIdAndOrganizationId(String id, String orgId, AclPermission permission);

    Mono<Application> findByName(String name, AclPermission permission);
}
