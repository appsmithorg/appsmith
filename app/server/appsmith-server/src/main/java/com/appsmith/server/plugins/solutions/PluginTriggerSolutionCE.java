package com.appsmith.server.plugins.solutions;

import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PluginTriggerSolutionCE {
    Mono<TriggerResultDTO> trigger(
            String pluginId, String environmentId, TriggerRequestDTO triggerRequestDTO, HttpHeaders httpHeaders);

    Mono<TriggerResultDTO> trigger(
            String pluginId,
            String environmentId,
            String workspaceId,
            Flux<FilePart> filePartFlux,
            String requestType,
            HttpHeaders httpHeaders);
}
