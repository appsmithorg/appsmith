package com.appsmith.server.applications.base;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import reactor.core.publisher.Mono;

public interface ApplicationService extends ApplicationServiceCECompatible {
    Mono<PermissionGroup> createDefaultRole(Application application, String roleType);

    Mono<Void> deleteDefaultRole(Application application, PermissionGroup role);
}
