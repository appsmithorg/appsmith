package com.appsmith.server.services;

import com.appsmith.server.constants.AclPermission;
import com.appsmith.server.domains.Application;
import reactor.core.publisher.Mono;

public interface ApplicationService extends CrudService<Application, String> {

    Mono<Application> findById(String id);

    Mono<Application> findById(String id, AclPermission aclPermission);

    Mono<Application> findByIdAndOrganizationId(String id, String organizationId);

    Mono<Application> findByName(String name);

    Mono<Boolean> publish(String applicationId);

    Mono<Application> save(Application application);

    Mono<Application> archive(Application application);
}
