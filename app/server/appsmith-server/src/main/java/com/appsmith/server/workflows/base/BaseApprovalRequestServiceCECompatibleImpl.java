package com.appsmith.server.workflows.base;

import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.repositories.ApprovalRequestRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import jakarta.validation.Validator;

public class BaseApprovalRequestServiceCECompatibleImpl
        extends BaseService<ApprovalRequestRepository, ApprovalRequest, String>
        implements BaseApprovalRequestServiceCECompatible {
    public BaseApprovalRequestServiceCECompatibleImpl(
            Validator validator, ApprovalRequestRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }
}
