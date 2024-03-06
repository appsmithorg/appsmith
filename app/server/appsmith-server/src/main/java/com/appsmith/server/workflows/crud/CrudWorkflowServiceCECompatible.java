package com.appsmith.server.workflows.crud;

import com.appsmith.server.domains.Workflow;
import com.appsmith.server.workflows.base.BaseWorkflowServiceCECompatible;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CrudWorkflowServiceCECompatible extends BaseWorkflowServiceCECompatible {

    Mono<Workflow> createWorkflow(Workflow resource, String workspaceId);

    Mono<Workflow> updateWorkflow(Workflow workflowUpdate, String workflowId);

    Flux<Workflow> getAllWorkflows(String workspaceId);

    Mono<Workflow> getWorkflowById(String workflowId);

    Mono<Workflow> deleteWorkflow(String workflowId);
}
