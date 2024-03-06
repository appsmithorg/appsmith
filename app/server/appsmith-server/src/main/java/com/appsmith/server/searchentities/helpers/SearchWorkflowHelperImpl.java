package com.appsmith.server.searchentities.helpers;

import com.appsmith.server.domains.Workflow;
import com.appsmith.server.workflows.search.SearchWorkflowService;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class SearchWorkflowHelperImpl implements SearchWorkflowHelper {

    private final SearchWorkflowService searchWorkflowService;

    public SearchWorkflowHelperImpl(SearchWorkflowService searchWorkflowService) {
        this.searchWorkflowService = searchWorkflowService;
    }

    @Override
    public Mono<List<Workflow>> searchWorkflowEntity(
            String searchString, int page, int size, Boolean isRequestedForHomepage) {
        return searchWorkflowService.searchWorkflowEntity(searchString, page, size, isRequestedForHomepage);
    }
}
