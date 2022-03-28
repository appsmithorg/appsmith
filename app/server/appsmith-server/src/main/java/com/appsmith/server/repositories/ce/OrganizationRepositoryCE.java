package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomOrganizationRepository;
import reactor.core.publisher.Mono;

public interface OrganizationRepositoryCE extends BaseRepository<Organization, String>, CustomOrganizationRepository {

    Mono<Organization> findBySlug(String slug);

    Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId);

    Mono<Organization> findByName(String name);

    Mono<Void> updateUserRoleNames(String userId, String userName);

    Mono<Long> countByDeletedAtNull();

}
