package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ApplicationService extends CrudService<Application, String> {

    Mono<Application> findById(String id);

    Mono<Application> findById(String id, AclPermission aclPermission);

    Mono<Application> findByIdAndOrganizationId(String id, String organizationId, AclPermission permission);

    Flux<Application> findByOrganizationId(String organizationId, AclPermission permission);

    Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission);

    Mono<Application> findByName(String name, AclPermission permission);

    Mono<Boolean> publish(String applicationId);

    Mono<Application> save(Application application);

    Mono<Application> createDefault(Application object);

    Mono<Application> archive(Application application);

    Mono<Application> changeViewAccess (String id, ApplicationAccessDTO applicationAccessDTO);
}
