package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import reactor.core.publisher.Mono;

public interface OrganizationService extends CrudService<Organization, String> {

    Mono<Organization> getByName(String name);

    Mono<Organization> create(Organization object);

    Mono<Organization> findById(String id);

    Mono<Organization> save(Organization organization);

    Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId);
}
