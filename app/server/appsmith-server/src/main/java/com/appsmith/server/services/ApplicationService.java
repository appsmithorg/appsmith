package com.appsmith.server.services;

import com.appsmith.server.constants.AclConstants;
import com.appsmith.server.domains.Application;
import reactor.core.publisher.Mono;

public interface ApplicationService extends CrudService<Application, String> {

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<Application> findById(String id);

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<Application> findByIdAndOrganizationId(String id, String organizationId);

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<Application> findByName(String name);

    @AclPermission(values = AclConstants.PUBLISH_PERMISSION)
    Mono<Boolean> publish(String applicationId);

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<Application> save(Application application);

    @AclPermission(values = {AclConstants.ARCHIVE_PERMISSION, AclConstants.DELETE_PERMISSION})
    Mono<Application> archive(Application application);
}
