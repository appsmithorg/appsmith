package com.appsmith.server.plugins.solutions;

import reactor.core.publisher.Mono;

import java.util.List;

public interface PluginSchemaSolutionCE {
    Mono<List<Object>> getPluginSchema(String pluginId);
}
