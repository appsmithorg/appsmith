package com.appsmith.server.solutions.ce;

import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.CRUDPageResponseDTO;
import reactor.core.publisher.Mono;

public interface CreateDBTablePageSolutionCE {

    Mono<CRUDPageResponseDTO> createPageFromDBTable(String pageId, CRUDPageResourceDTO pageResourceDTO);

}