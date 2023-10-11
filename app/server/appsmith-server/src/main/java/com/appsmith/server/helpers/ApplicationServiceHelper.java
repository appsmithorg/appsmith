package com.appsmith.server.helpers;

import com.appsmith.server.domains.Application;
import com.appsmith.server.helpers.ce_compatible.ApplicationServiceHelperCECompatible;
import reactor.core.publisher.Mono;

public interface ApplicationServiceHelper extends ApplicationServiceHelperCECompatible {
    Mono<Application> updateApplicationDefaultRolesWhenApplicationUpdated(
            Application updateResource, Mono<Application> updatedApplicationMono);
}
