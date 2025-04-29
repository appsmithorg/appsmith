package com.appsmith.server.plugins.solutions;

import lombok.NonNull;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class PluginTransformationSolutionCEImpl implements PluginTransformationSolutionCE {
    @Override
    public Mono<Map<?, ?>> transform(@NonNull String pluginId, @NonNull Map<?, ?> input) {
        return Mono.just(input);
    }
}
