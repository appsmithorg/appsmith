package com.appsmith.server.workflows.search;

import com.appsmith.server.domains.Workflow;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.base.BaseWorkflowServiceImpl;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class SearchWorkflowServiceCECompatibleImpl extends BaseWorkflowServiceImpl
        implements SearchWorkflowServiceCECompatible {
    public SearchWorkflowServiceCECompatibleImpl(
            Validator validator, WorkflowRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }

    @Override
    public Mono<List<Workflow>> searchWorkflowEntity(
            String searchString, int page, int size, Boolean isRequestedForHomepage) {
        return Mono.just(List.of());
    }
}
