package com.appsmith.server.workflows.crud;

import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.dtos.ApprovalRequestCreationDTO;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApprovalRequestRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.base.BaseApprovalRequestServiceImpl;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
public class CrudApprovalRequestServiceCECompatibleImpl extends BaseApprovalRequestServiceImpl
        implements CrudApprovalRequestServiceCECompatible {
    protected CrudApprovalRequestServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ApprovalRequestRepository repository,
            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Mono<ApprovalRequest> createApprovalRequest(ApprovalRequestCreationDTO approvalRequestCreationDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ApprovalRequest> getApprovalRequestById(String id) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<PagedDomain<ApprovalRequest>> getPaginatedApprovalRequests(MultiValueMap<String, String> filters) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
