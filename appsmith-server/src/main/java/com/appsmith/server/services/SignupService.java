package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import reactor.core.publisher.Mono;

public interface SignupService {

    /**
     * This function creates the organization and maps the user who is creating the org to the org itself.
     * The functions {@link com.appsmith.server.services.UserService#create} &
     * {@link com.appsmith.server.services.OrganizationService#create} perform the individual actions.
     * This is a hybrid function that executes both the functions in a single API call
     *
     * @param organization
     * @return
     */
    Mono<Organization> createOrganization(Organization organization);
}
