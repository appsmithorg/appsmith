package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import reactor.core.publisher.Mono;

public interface ApiImporterCE {

    Mono<ActionDTO> importAction(
            Object input, CreatorContextType contextType, String branchedContextId, String name, String workspaceId);
}
