package com.external.connections;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.OAuth2;
import reactor.core.publisher.Mono;


public class APIConnectionFactory {

    public static Mono<APIConnection> createConnection(AuthenticationDTO authenticationType) {

        return Mono.from(OAuth2AuthorizationCode.create((OAuth2) authenticationType));

    }
}