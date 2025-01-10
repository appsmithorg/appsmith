package com.appsmith.server.services.ce;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.dtos.ConsolidatedAPIResponseDTO;
import reactor.core.publisher.Mono;

public interface ConsolidatedAPIServiceCE {

    Mono<ConsolidatedAPIResponseDTO> getConsolidatedInfoForPageLoad(
            String defaultPageId, String applicationId, RefType refType, String refName, ApplicationMode mode);
}
