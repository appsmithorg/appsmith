package com.external.plugins.pluginActions;

import org.springframework.http.ResponseEntity;
import reactor.core.publisher.Mono;

public interface PluginActions {
    Mono<ResponseEntity<String>> getResponse();
}
