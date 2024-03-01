package com.appsmith.server.workflows.base;

import com.appsmith.server.repositories.ApprovalRequestRepository;
import com.appsmith.server.services.AnalyticsService;
import jakarta.validation.Validator;

public abstract class BaseApprovalRequestServiceImpl extends BaseApprovalRequestServiceCECompatibleImpl
        implements BaseApprovalRequestService {

    protected BaseApprovalRequestServiceImpl(
            Validator validator, ApprovalRequestRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }
}
