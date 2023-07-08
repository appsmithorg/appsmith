package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import reactor.core.publisher.Mono;

public interface ApiImporterCE {

    Mono<ActionDTO> importAction(Object input, String pageId, String name, String workspaceId, String branchName);
}
