package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.ActionDTO;
import reactor.core.publisher.Mono;

public abstract class BaseApiImporterCE implements ApiImporterCE {

    public abstract Mono<ActionDTO> importAction(Object input, String pageId, String name, String orgId, String branchName);

}
