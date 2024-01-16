package com.appsmith.server.plugins.solutions;

import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import org.springframework.http.HttpHeaders;
import reactor.core.publisher.Mono;

public interface PluginTriggerSolutionCE {
    Mono<TriggerResultDTO> trigger(
            String pluginId, String environmentId, TriggerRequestDTO triggerRequestDTO, HttpHeaders httpHeaders);
}
