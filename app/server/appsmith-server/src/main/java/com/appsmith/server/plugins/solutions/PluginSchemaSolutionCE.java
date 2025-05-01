package com.appsmith.server.plugins.solutions;

import com.fasterxml.jackson.databind.JsonNode;
import reactor.core.publisher.Mono;

public interface PluginSchemaSolutionCE {
    Mono<JsonNode> getPluginSchema(String pluginId);
}
