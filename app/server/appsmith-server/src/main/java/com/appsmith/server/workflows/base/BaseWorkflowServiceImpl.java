package com.appsmith.server.workflows.base;

import com.appsmith.server.repositories.WorkflowRepository;

public abstract class BaseWorkflowServiceImpl extends BaseWorkflowServiceCECompatibleImpl
        implements BaseWorkflowService {

    private final WorkflowRepository workflowRepository;

    public BaseWorkflowServiceImpl(WorkflowRepository workflowRepository) {
        this.workflowRepository = workflowRepository;
    }
}
