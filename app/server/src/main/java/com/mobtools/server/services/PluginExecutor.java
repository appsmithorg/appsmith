package com.mobtools.server.services;

import reactor.core.publisher.Flux;

public interface PluginExecutor {

    Flux<Object> execute();
}
