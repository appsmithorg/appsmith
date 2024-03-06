package com.appsmith.server.workflows.base;

import com.appsmith.server.domains.Workflow;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import jakarta.validation.Validator;

public class BaseWorkflowServiceCECompatibleImpl extends BaseService<WorkflowRepository, Workflow, String>
        implements BaseWorkflowServiceCECompatible {
    public BaseWorkflowServiceCECompatibleImpl(
            Validator validator, WorkflowRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }
}
