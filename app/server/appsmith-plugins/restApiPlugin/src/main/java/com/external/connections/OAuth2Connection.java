package com.external.connections;

import com.appsmith.external.models.OAuth2;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;

public class OAuth2Connection extends APIConnection {

    private OAuth2Connection() {
    }

    public static Mono<OAuth2Connection> create(OAuth2 oAuth2) {
//        if (oAuth2.getToken() == null || !isValid(oAuth2)) {
//
//        }

        return null;
    }

    @Override
    public Mono<ClientResponse> filter(ClientRequest clientRequest, ExchangeFunction exchangeFunction) {
//        return getValidToken().map(token -> bearer(clientRequest, token)).flatMap(exchangeFunction::exchange)
//                .switchIfEmpty(exchangeFunction.exchange(clientRequest));
        return null;
    }
}