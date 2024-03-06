package com.appsmith.server.searchentities.helpers;

import com.appsmith.server.domains.Workflow;
import reactor.core.publisher.Mono;

import java.util.List;

public interface SearchWorkflowHelper {
    Mono<List<Workflow>> searchWorkflowEntity(String searchString, int page, int size, Boolean isRequestedForHomepage);
}
