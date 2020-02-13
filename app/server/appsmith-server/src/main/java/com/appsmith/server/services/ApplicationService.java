package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import org.springframework.security.access.prepost.PreAuthorize;
import reactor.core.publisher.Mono;

//@Domain("applications")
public interface ApplicationService extends CrudService<Application, String> {

//    @Override
//    @PreAuthorize("hasPermission('someValue', T(com.appsmith.server.constants.AclConstants).READ_APPLICATION_PERMISSION)")
//    Mono<Application> getById(String id);

    @PreAuthorize("hasPermission(#user, T(com.appsmith.server.constants.AclConstants).READ_APPLICATION_PERMISSION)")
    Mono<Application> findById(String id);

    @PreAuthorize("hasPermission(#user, T(com.appsmith.server.constants.AclConstants).READ_APPLICATION_PERMISSION)")
    Mono<Application> findByIdAndOrganizationId(String id, String organizationId);

    @PreAuthorize("hasPermission(#user, T(com.appsmith.server.constants.AclConstants).READ_APPLICATION_PERMISSION)")
    Mono<Application> findByName(String name);

    @PreAuthorize("hasPermission(#user, T(com.appsmith.server.constants.AclConstants).PUBLISH_APPLICATION_PERMISSION)")
    Mono<Boolean> publish(String applicationId);

    @PreAuthorize("hasPermission(#user, T(com.appsmith.server.constants.AclConstants).CREATE_APPLICATION_PERMISSION)")
    Mono<Application> save(Application application);

    @PreAuthorize("hasPermission(#user, T(com.appsmith.server.constants.AclConstants).DELETE_APPLICATION_PERMISSION)")
    Mono<Application> archive(Application application);
}
