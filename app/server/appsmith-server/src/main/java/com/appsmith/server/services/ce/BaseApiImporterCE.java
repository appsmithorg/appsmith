package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import reactor.core.publisher.Mono;

public abstract class BaseApiImporterCE implements ApiImporterCE {

    public abstract Mono<ActionDTO> importAction(
            Object input, CreatorContextType contextType, String branchedContextId, String name, String workspaceId);
}
