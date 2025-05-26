package com.appsmith.server.plugins.solutions;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class PluginSchemaSolutionCEImpl implements PluginSchemaSolutionCE {
    @Override
    public Mono<List<Object>> getPluginSchema(String pluginId) {
        return Mono.empty();
    }
}
