package com.appsmith.server.services;

import com.appsmith.server.dtos.ActionDTO;
import reactor.core.publisher.Mono;

public abstract class BaseApiImporter implements ApiImporter {

    public abstract Mono<ActionDTO> importAction(Object input, String pageId, String name, String orgId);

}
