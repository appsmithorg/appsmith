package com.appsmith.server.workflows.search;

import com.appsmith.server.domains.Workflow;
import reactor.core.publisher.Mono;

import java.util.List;

public interface SearchWorkflowServiceCECompatible {
    Mono<List<Workflow>> searchWorkflowEntity(String searchString, int page, int size, Boolean isRequestedForHomepage);
}
