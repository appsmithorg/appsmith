package com.appsmith.server.workflows.base;

import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import jakarta.validation.Validator;

public abstract class BaseWorkflowServiceImpl extends BaseWorkflowServiceCECompatibleImpl
        implements BaseWorkflowService {
    public BaseWorkflowServiceImpl(
            Validator validator, WorkflowRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }
}
