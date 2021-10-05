package com.external.connections;

import com.appsmith.external.models.BearerTokenAuth;
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

import static com.appsmith.external.constants.Authentication.AUTHORIZATION_HEADER;
import static com.appsmith.external.constants.Authentication.BEARER_HEADER_PREFIX;

@Setter
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class BearerTokenAuthentication extends APIConnection {
    private String bearerToken;

    public static Mono<BearerTokenAuthentication> create(BearerTokenAuth bearerTokenAuth) {
        return Mono.just(
                BearerTokenAuthentication.builder()
                        .bearerToken(bearerTokenAuth.getBearerToken())
                        .build()
        );
    }

    @Override
    public Mono<ClientResponse> filter(ClientRequest request, ExchangeFunction next) {
        return Mono.justOrEmpty(ClientRequest.from(request)
                .headers(header -> header.set(AUTHORIZATION_HEADER, getHeaderValue()))
                .build())
                // Carry on to next exchange function
                .flatMap(next::exchange)
                // Default to next exchange function if something went wrong
                .switchIfEmpty(next.exchange(request));
    }

    private String getHeaderValue() {
        return BEARER_HEADER_PREFIX + " " + this.bearerToken;
    }
}