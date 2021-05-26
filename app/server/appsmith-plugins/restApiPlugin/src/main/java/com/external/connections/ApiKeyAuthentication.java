package com.external.connections;

import com.appsmith.external.models.ApiKeyAuth;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;

@Setter
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ApiKeyAuthentication extends APIConnection{
    private final String PARAM_NAME = "api_key";
    private String key;

    public static Mono<ApiKeyAuthentication> create(ApiKeyAuth apiKeyAuth) {
        return Mono.just(
                ApiKeyAuthentication.builder()
                        .key(apiKeyAuth.getKey())
                        .build()
        );
    }

    @Override
    public Mono<ClientResponse> filter(ClientRequest request, ExchangeFunction next) {
        return Mono.justOrEmpty(ClientRequest.from(request)
                .attribute(PARAM_NAME, this.key)
                .build())
                // Carry on to next exchange function
                .flatMap(next::exchange)
                // Default to next exchange function if something went wrong
                .switchIfEmpty(next.exchange(request));
    }
}
