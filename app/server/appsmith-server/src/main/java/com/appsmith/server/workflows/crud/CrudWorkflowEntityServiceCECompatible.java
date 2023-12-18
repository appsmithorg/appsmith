package com.appsmith.server.workflows.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.workflows.base.BaseWorkflowService;
import reactor.core.publisher.Mono;

public interface CrudWorkflowEntityServiceCECompatible extends BaseWorkflowService {
    Mono<NewAction> createWorkflowAction(ActionDTO actionDTO, String branchName);

    Mono<ActionDTO> updateWorkflowAction(String actionId, ActionDTO actionDTO);

    Mono<ActionCollection> createWorkflowActionCollection(ActionCollectionDTO actionCollectionDTO, String branchName);
}
