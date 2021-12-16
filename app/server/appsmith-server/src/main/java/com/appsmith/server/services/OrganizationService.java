package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.services.ce.OrganizationServiceCE;
import reactor.core.publisher.Mono;

public interface OrganizationService extends OrganizationServiceCE {

    Mono<Organization> retrieveById(String organizationId);

}
