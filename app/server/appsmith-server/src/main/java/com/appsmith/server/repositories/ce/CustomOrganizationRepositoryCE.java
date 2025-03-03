package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomOrganizationRepositoryCE extends AppsmithRepository<Organization> {
    Mono<Integer> disableRestartForAllOrganizations();
}
