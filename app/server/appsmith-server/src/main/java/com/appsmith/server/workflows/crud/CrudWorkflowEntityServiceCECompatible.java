package com.appsmith.server.workflows.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.workflows.base.BaseWorkflowService;
import reactor.core.publisher.Mono;

public interface CrudWorkflowEntityServiceCECompatible extends BaseWorkflowService {
    Mono<ActionDTO> createWorkflowAction(ActionDTO actionDTO, String branchName);

    Mono<ActionDTO> updateWorkflowAction(String actionId, ActionDTO actionDTO);
}
