package com.appsmith.server.solutions.roles.ce_compatible;

import com.appsmith.server.solutions.roles.CommonAppsmithObjectData;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import reactor.core.publisher.Mono;

public interface WorkflowResourcesCECompatible {
    Mono<RoleTabDTO> getWorkflowTabInfo(
            String permissionGroupId, CommonAppsmithObjectData dataFromRepositoryForAllTabs);
}
