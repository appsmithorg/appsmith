package com.appsmith.server.repositories;

import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.ce.CustomWorkspaceRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.List;

public interface CustomWorkspaceRepository extends CustomWorkspaceRepositoryCE {

    Flux<Workspace> findAllByTenantIdWithoutPermission(String tenantId, List<String> includeFields);

}
