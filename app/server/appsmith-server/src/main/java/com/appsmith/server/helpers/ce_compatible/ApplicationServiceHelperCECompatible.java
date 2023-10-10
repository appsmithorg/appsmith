package com.appsmith.server.helpers.ce_compatible;

import com.appsmith.server.domains.Application;
import reactor.core.publisher.Mono;

public interface ApplicationServiceHelperCECompatible {
    public Mono<Application> updateApplicationDefaultRolesWhenApplicationUpdated(
            Application updateResource, Mono<Application> updatedApplicationMono);
}
