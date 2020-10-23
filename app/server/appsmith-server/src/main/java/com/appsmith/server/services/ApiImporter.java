package com.appsmith.server.services;

import com.appsmith.server.dtos.ActionDTO;
import reactor.core.publisher.Mono;

public interface ApiImporter {

    Mono<ActionDTO> importAction(Object input, String pageId, String name, String orgId);

}
