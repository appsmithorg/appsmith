package com.appsmith.server.services.ce;

import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.dtos.ConsolidatedAPIResponseDTO;
import reactor.core.publisher.Mono;

public interface ConsolidatedAPIServiceCE {

    Mono<ConsolidatedAPIResponseDTO> getConsolidatedInfoForPageLoad(
            String defaultPageId, String applicationId, String branchName, ApplicationMode mode);
}
