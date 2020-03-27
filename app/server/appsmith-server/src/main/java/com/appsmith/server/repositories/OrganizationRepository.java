package com.appsmith.server.repositories;

import com.appsmith.server.domains.Organization;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface OrganizationRepository extends BaseRepository<Organization, String> {
    Mono<Organization> findBySlug(String slug);

    Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId);

    @Query(value = "{slug: {$regex: ?0}}", count = true)
    Mono<Long> countSlugsByPrefix(String keyword);
}
