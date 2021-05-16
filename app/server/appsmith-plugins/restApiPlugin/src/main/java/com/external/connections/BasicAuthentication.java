package com.external.connections;

import com.appsmith.external.models.BasicAuth;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Setter
@Getter
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class BasicAuthentication extends APIConnection {

    private String encodedAuthorizationHeader;
    final private static String HEADER_PREFIX = "Basic ";

    public static Mono<BasicAuthentication> create(BasicAuth basicAuth) {
        final BasicAuthentication basicAuthentication = new BasicAuthentication();
        final String decodedAuthorizationHeader = basicAuth.getUsername() + ":" + basicAuth.getPassword();

        basicAuthentication.setEncodedAuthorizationHeader(
                Base64.getEncoder().encodeToString(decodedAuthorizationHeader.getBytes(StandardCharsets.UTF_8)));

        return Mono.just(basicAuthentication);
    }


    @Override
    public Mono<ClientResponse> filter(ClientRequest request, ExchangeFunction next) {
        return Mono.justOrEmpty(ClientRequest.from(request)
                .headers(headers -> headers.set("Authorization", HEADER_PREFIX + this.getEncodedAuthorizationHeader()))
                .build())
                // Carry on to next exchange function
                .flatMap(next::exchange)
                // Default to next exchange function if something went wrong
                .switchIfEmpty(next.exchange(request));
    }
}
