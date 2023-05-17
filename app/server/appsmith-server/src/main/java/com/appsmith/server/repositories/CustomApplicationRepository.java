package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.Optional;
import java.util.Set;

public interface CustomApplicationRepository extends CustomApplicationRepositoryCE {

    Flux<Application> findDefaultApplicationsByWorkspaceIds(Set<String> workspaceIds);

    Flux<Application> getAllApplicationsInWorkspace(String workspaceId, Optional<AclPermission> aclPermission);

}
