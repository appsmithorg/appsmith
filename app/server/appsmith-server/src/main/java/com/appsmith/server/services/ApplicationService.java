package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.services.ce.ApplicationServiceCE;
import reactor.core.publisher.Mono;

public interface ApplicationService extends ApplicationServiceCE {
    Mono<PermissionGroup> createDefaultRole(Application application, String roleType);
}
