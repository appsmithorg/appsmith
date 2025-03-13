package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Mono;

public interface OrganizationRepositoryCE extends BaseRepository<Organization, String>, CustomOrganizationRepositoryCE {
    Mono<Organization> findBySlug(String slug);
}
