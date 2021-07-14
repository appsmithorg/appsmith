package com.appsmith.server.repositories;

import com.appsmith.server.domains.Organization;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface OrganizationRepository extends BaseRepository<Organization, String>, CustomOrganizationRepository {

    Mono<Organization> findBySlug(String slug);

    Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId);

    Mono<Organization> findByName(String name);

    Mono<Void> updateUserRoleNames(String userId, String userName);

}
