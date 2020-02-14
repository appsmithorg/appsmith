package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import reactor.core.publisher.Mono;

public interface ApiImporter {

    Mono<Action> importAction(Object input, String pageId, String name);

}
