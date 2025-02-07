package com.appsmith.external.services.ce;

import lombok.NonNull;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

public interface RTSCallerCE {
    WebClient getWebClient();

    Mono<WebClient.RequestBodySpec> get(@NonNull String path);

    Mono<WebClient.RequestBodySpec> post(@NonNull String path, @NonNull Object requestBody);

    Mono<WebClient.RequestBodySpec> put(@NonNull String path, @NonNull Object requestBody);

    Mono<WebClient.RequestBodySpec> delete(@NonNull String path);
}
