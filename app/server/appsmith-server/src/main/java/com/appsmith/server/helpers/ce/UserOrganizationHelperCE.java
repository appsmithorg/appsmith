package com.appsmith.server.helpers.ce;

import reactor.core.publisher.Mono;

public interface UserOrganizationHelperCE {
    /**
     * Gets the organization ID for the current user. If not found in user context, falls back to default organization.
     * @return Mono containing the organization ID
     */
    Mono<String> getCurrentUserOrganizationId();
}
