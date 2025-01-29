package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Mono;

public interface OrganizationRepositoryCE extends BaseRepository<Organization, String>, CustomOrganizationRepositoryCE {
    // Use organizationService.getDefaultOrganization() instead of this method as it is cached to redis.
    @Deprecated(forRemoval = true)
    Mono<Organization> findBySlug(String slug);
}
