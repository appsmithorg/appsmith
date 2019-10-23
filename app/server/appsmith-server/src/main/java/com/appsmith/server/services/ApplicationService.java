package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Page;
import reactor.core.publisher.Mono;

public interface ApplicationService extends CrudService<Application, String> {
    Mono<Application> findById(String id);

    Mono<Application> findByIdAndOrganizationId(String id, String organizationId);

    Mono<Application> findByName(String name);

    Mono<Application> publish(String applicationId);

    Mono<Application> addPageToApplication(String applicationId, Page page);

}
