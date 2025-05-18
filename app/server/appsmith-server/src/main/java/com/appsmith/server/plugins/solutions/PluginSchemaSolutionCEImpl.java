package com.appsmith.server.plugins.solutions;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class PluginSchemaSolutionCEImpl implements PluginSchemaSolutionCE {
    @Override
    public Mono<JsonNode> getPluginSchema(String pluginId) {
        return Mono.empty();
    }
}
