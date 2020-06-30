package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import reactor.core.publisher.Mono;

public abstract class BaseApiImporter implements ApiImporter {

    public abstract Mono<Action> importAction(Object input, String pageId, String name, String orgId);

}
