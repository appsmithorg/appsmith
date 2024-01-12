package com.appsmith.server.workflows.interact;

import com.appsmith.server.dtos.ApprovalRequestResolutionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApprovalRequestRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.base.BaseApprovalRequestServiceImpl;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
public class InteractApprovalRequestServiceCECompatibleImpl extends BaseApprovalRequestServiceImpl
        implements InteractApprovalRequestServiceCECompatible {
    protected InteractApprovalRequestServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ApprovalRequestRepository repository,
            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Mono<JsonNode> resolveApprovalRequest(ApprovalRequestResolutionDTO approvalRequestResolutionDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
