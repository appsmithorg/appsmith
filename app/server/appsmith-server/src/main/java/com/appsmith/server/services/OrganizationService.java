package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

public interface OrganizationService extends CrudService<Organization, String> {

    Mono<Organization> getByName(String name);

    Mono<Organization> create(Organization organization);

    Mono<Organization> create(Organization organization, User user);

    Mono<Organization> findById(String id);

    Mono<Organization> save(Organization organization);

    Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId);
}
