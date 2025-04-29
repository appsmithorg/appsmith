package com.appsmith.server.plugins.solutions;

import lombok.NonNull;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface PluginTransformationSolutionCE {
    Mono<Map<?, ?>> transform(@NonNull String pluginId, @NonNull Map<?, ?> input);
}
