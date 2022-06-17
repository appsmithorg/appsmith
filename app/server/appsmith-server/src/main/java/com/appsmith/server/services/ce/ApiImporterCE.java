package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.ActionDTO;
import reactor.core.publisher.Mono;

public interface ApiImporterCE {

    Mono<ActionDTO> importAction(Object input, String pageId, String name, String orgId, String branchName);

}
