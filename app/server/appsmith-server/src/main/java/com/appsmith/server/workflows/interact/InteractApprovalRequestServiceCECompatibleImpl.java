package com.appsmith.server.workflows.interact;

import com.appsmith.server.dtos.ApprovalRequestResolutionDTO;
import com.appsmith.server.dtos.ApprovalRequestResolvedResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApprovalRequestRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.base.BaseApprovalRequestServiceImpl;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class InteractApprovalRequestServiceCECompatibleImpl extends BaseApprovalRequestServiceImpl
        implements InteractApprovalRequestServiceCECompatible {
    protected InteractApprovalRequestServiceCECompatibleImpl(
            Validator validator, ApprovalRequestRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }

    @Override
    public Mono<ApprovalRequestResolvedResponseDTO> resolveApprovalRequest(
            ApprovalRequestResolutionDTO approvalRequestResolutionDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
