package com.external.connections;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.OAuth2;
import reactor.core.publisher.Mono;


public class APIConnectionFactory {

    public static Mono<APIConnection> createConnection(AuthenticationDTO authenticationType) {
        if (authenticationType instanceof OAuth2) {
            return Mono.from(OAuth2Connection.create((OAuth2) authenticationType));
        } else {
            return Mono.empty();
        }
    }
}