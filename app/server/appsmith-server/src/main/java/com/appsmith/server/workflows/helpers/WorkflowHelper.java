package com.appsmith.server.workflows.helpers;

import com.appsmith.server.domains.Workflow;
import com.appsmith.server.dtos.ActionCollectionDTO;
import reactor.core.publisher.Mono;

public interface WorkflowHelper {
    String generateWorkflowBotUserEmail(Workflow workflow);

    String generateWorkflowBotUserName(Workflow workflow);

    String generateWorkflowBotRoleName(Workflow workflow);

    Mono<Boolean> updateWorkflowBotRoleAndUserDetails(Workflow actualWorkflow, Workflow updatedWorkflow);

    Mono<Boolean> archiveWorkflowBotRoleAndUser(Workflow workflow);

    Mono<ActionCollectionDTO> generateMainActionCollectionDTO(Workflow workflow);
}
