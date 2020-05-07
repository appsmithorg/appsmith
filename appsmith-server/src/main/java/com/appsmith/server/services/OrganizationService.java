package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface OrganizationService extends CrudService<Organization, String> {

    Mono<Organization> create(Organization organization);

    Mono<Organization> getBySlug(String slug);

    Mono<String> getNextUniqueSlug(String initialSlug);

    Mono<Organization> create(Organization organization, User user);

    Mono<Organization> findById(String id);

    Mono<Organization> findById(String id, AclPermission permission);

    Mono<Organization> save(Organization organization);

    Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId);

    Flux<Organization> findByIdsIn(Set<String> ids,AclPermission permission);
}
