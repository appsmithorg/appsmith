package com.appsmith.server.helpers.ce_compatible;

import com.appsmith.server.domains.Application;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class ApplicationServiceHelperCECompatibleImpl implements ApplicationServiceHelperCECompatible {
    @Override
    public Mono<Application> updateApplicationDefaultRolesWhenApplicationUpdated(
            Application updateResource, Mono<Application> updatedApplicationMono) {
        return updatedApplicationMono;
    }
}
