package com.appsmith.server.repositories;

import com.appsmith.server.domains.Organization;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface OrganizationRepository extends BaseRepository<Organization, String> {
    Mono<Organization> findByName(String name);

    Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId);
}
