package com.appsmith.server.services;

import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.dtos.ConsolidatedAPIResponseDTO;
import io.opentelemetry.api.trace.Span;
import reactor.core.publisher.Mono;

public interface ConsolidatedAPIService {
    Mono<ConsolidatedAPIResponseDTO> getConsolidatedInfoForPageLoad(
            String defaultPageId, String applicationId, String branchName, ApplicationMode mode, Span parentSpan);
}
