package com.appsmith.server.solutions.roles.ce_compatible;

import com.appsmith.server.solutions.roles.CommonAppsmithObjectData;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class WorkflowResourcesCECompatibleImpl implements WorkflowResourcesCECompatible {
    @Override
    public Mono<RoleTabDTO> getWorkflowTabInfo(
            String permissionGroupId, CommonAppsmithObjectData dataFromRepositoryForAllTabs) {
        return Mono.just(new RoleTabDTO());
    }
}
