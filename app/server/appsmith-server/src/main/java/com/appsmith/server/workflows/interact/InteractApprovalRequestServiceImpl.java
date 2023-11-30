package com.appsmith.server.workflows.interact;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.domains.QApprovalRequest;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.dtos.ApprovalRequestResolutionDTO;
import com.appsmith.server.dtos.ApprovalRequestResolutionProxyDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ObjectUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.repositories.ApprovalRequestRepository;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.workflows.helper.WorkflowProxyHelper;
import jakarta.validation.Validator;
import org.json.JSONObject;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.time.Instant;
import java.util.Optional;

import static com.appsmith.server.acl.AclPermission.RESOLVE_APPROVAL_REQUESTS;
import static com.appsmith.server.acl.AclPermission.RESOLVE_WORKFLOWS;
import static com.appsmith.server.constants.ApprovalRequestStatus.RESOLVED;
import static com.appsmith.server.constants.FieldName.REQUEST;
import static com.appsmith.server.constants.FieldName.WORKFLOW;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Service
public class InteractApprovalRequestServiceImpl extends InteractApprovalRequestServiceCECompatibleImpl
        implements InteractApprovalRequestService {
    private final SessionUserService sessionUserService;
    private final WorkflowProxyHelper workflowProxyHelper;
    private final WorkflowRepository workflowRepository;

    protected InteractApprovalRequestServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ApprovalRequestRepository repository,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            WorkflowProxyHelper workflowProxyHelper,
            WorkflowRepository workflowRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
        this.workflowProxyHelper = workflowProxyHelper;
        this.workflowRepository = workflowRepository;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<JSONObject> resolveApprovalRequest(ApprovalRequestResolutionDTO approvalRequestResolutionDTO) {
        Mono<User> currentUserMono = sessionUserService.getCurrentUser();

        Mono<Workflow> workflowMono = workflowRepository
                .findById(approvalRequestResolutionDTO.getWorkflowId(), RESOLVE_WORKFLOWS)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, WORKFLOW, approvalRequestResolutionDTO.getWorkflowId())));

        Mono<ApprovalRequest> approvalRequestMono = repository
                .findById(approvalRequestResolutionDTO.getRequestId(), RESOLVE_APPROVAL_REQUESTS)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, REQUEST, approvalRequestResolutionDTO.getRequestId())));

        Mono<JSONObject> resolveApprovalRequestMono = workflowMono
                .flatMap(workflow -> approvalRequestMono)
                .zipWith(currentUserMono)
                .flatMap(pair -> {
                    ApprovalRequest approvalRequest = pair.getT1();
                    User currentUser = pair.getT2();

                    ApprovalRequestResolutionProxyDTO approvalRequestResolutionProxyDTO =
                            this.getApprovalRequestResolutionProxyDTO(approvalRequestResolutionDTO, approvalRequest);
                    Mono<JSONObject> approvalRequestResolutionOnProxyMono = workflowProxyHelper
                            .updateApprovalRequestResolutionOnProxy(approvalRequestResolutionProxyDTO)
                            .cache();

                    Update approvalResolutionUpdate =
                            createApprovalRequestResolutionUpdate(approvalRequestResolutionDTO, currentUser);
                    Mono<ApprovalRequest> updateApprovalRequestMono = repository.updateAndReturn(
                            approvalRequestResolutionDTO.getRequestId(), approvalResolutionUpdate, Optional.empty());

                    return validateApprovalRequestResolutionAgainstActualData(
                                    approvalRequestResolutionDTO, approvalRequest)
                            .then(approvalRequestResolutionOnProxyMono.flatMap(updateApprovalRequestMono::thenReturn));
                });

        return validateApprovalResolutionRequest(approvalRequestResolutionDTO).then(resolveApprovalRequestMono);
    }

    private Mono<ApprovalRequestResolutionDTO> validateApprovalResolutionRequest(
            ApprovalRequestResolutionDTO approvalRequestResolutionDTO) {
        String workflowId = approvalRequestResolutionDTO.getWorkflowId();
        String requestId = approvalRequestResolutionDTO.getRequestId();
        String resolution = approvalRequestResolutionDTO.getResolution();
        if (ValidationUtils.isEmptyParam(workflowId)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_APPROVAL_REQUEST_RESOLUTION, "Workflow ID can't be empty"));
        }

        if (ValidationUtils.isEmptyParam(requestId)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_APPROVAL_REQUEST_RESOLUTION, "Request ID can't be empty"));
        }

        if (ValidationUtils.isEmptyParam(resolution)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_APPROVAL_REQUEST_RESOLUTION, "Resolution can't be empty"));
        }
        return Mono.just(approvalRequestResolutionDTO);
    }

    private Update createApprovalRequestResolutionUpdate(
            ApprovalRequestResolutionDTO approvalRequestResolutionDTO, User user) {
        Update updateObj = new Update();
        String resolutionStatusPath = fieldName(QApprovalRequest.approvalRequest.resolutionStatus);
        String resolutionReasonPath = fieldName(QApprovalRequest.approvalRequest.resolutionReason);
        String resolutionPath = fieldName(QApprovalRequest.approvalRequest.resolution);
        String resolvedAtPath = fieldName(QApprovalRequest.approvalRequest.resolvedAt);
        String resolvedByPath = fieldName(QApprovalRequest.approvalRequest.resolvedBy);

        ObjectUtils.setIfNotEmpty(updateObj, resolutionStatusPath, RESOLVED);
        ObjectUtils.setIfNotEmpty(updateObj, resolutionReasonPath, approvalRequestResolutionDTO.getResolutionReason());
        ObjectUtils.setIfNotEmpty(updateObj, resolutionPath, approvalRequestResolutionDTO.getResolution());
        ObjectUtils.setIfNotEmpty(updateObj, resolvedAtPath, Instant.now());
        ObjectUtils.setIfNotEmpty(updateObj, resolvedByPath, user.getUsername());

        return updateObj;
    }

    private Mono<ApprovalRequestResolutionDTO> validateApprovalRequestResolutionAgainstActualData(
            ApprovalRequestResolutionDTO approvalRequestResolutionDTO, ApprovalRequest approvalRequest) {
        if (RESOLVED.equals(approvalRequest.getResolutionStatus())) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_APPROVAL_REQUEST_RESOLUTION, "Request already resolved."));
        }

        if (!isResolutionAllowed(approvalRequest, approvalRequestResolutionDTO.getResolution())) {
            return Mono.error(
                    new AppsmithException(AppsmithError.INVALID_APPROVAL_REQUEST_RESOLUTION, "Invalid resolution."));
        }
        return Mono.just(approvalRequestResolutionDTO);
    }

    private Boolean isResolutionAllowed(ApprovalRequest approvalRequest, String resolution) {
        return approvalRequest.getAllowedResolutions().contains(resolution);
    }

    private ApprovalRequestResolutionProxyDTO getApprovalRequestResolutionProxyDTO(ApprovalRequest approvalRequest) {
        ApprovalRequestResolutionProxyDTO approvalRequestResolutionProxyDTO = new ApprovalRequestResolutionProxyDTO();
        approvalRequestResolutionProxyDTO.setRequestId(approvalRequest.getId());
        approvalRequestResolutionProxyDTO.setRunId(approvalRequest.getRunId());
        approvalRequestResolutionProxyDTO.setWorkflowId(approvalRequest.getWorkflowId());
        approvalRequestResolutionProxyDTO.setResolution(approvalRequest.getResolution());
        return approvalRequestResolutionProxyDTO;
    }

    private ApprovalRequestResolutionProxyDTO getApprovalRequestResolutionProxyDTO(
            ApprovalRequestResolutionDTO approvalRequestResolutionDTO, ApprovalRequest approvalRequest) {
        ApprovalRequestResolutionProxyDTO approvalRequestResolutionProxyDTO = new ApprovalRequestResolutionProxyDTO();
        approvalRequestResolutionProxyDTO.setRequestId(approvalRequest.getId());
        approvalRequestResolutionProxyDTO.setRunId(approvalRequest.getRunId());
        approvalRequestResolutionProxyDTO.setWorkflowId(approvalRequest.getWorkflowId());
        approvalRequestResolutionProxyDTO.setResolution(approvalRequestResolutionDTO.getResolution());
        return approvalRequestResolutionProxyDTO;
    }
}
