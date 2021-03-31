package com.external.connections;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.services.SharedConfig;
import reactor.core.publisher.Mono;


public class APIConnectionFactory {

    public static Mono<APIConnection> createConnection(AuthenticationDTO authenticationType) {
        if (authenticationType instanceof OAuth2) {
            if (OAuth2.Type.CLIENT_CREDENTIALS.equals(((OAuth2) authenticationType).getGrantType())) {
                return Mono.from(OAuth2ClientCredentials.create((OAuth2) authenticationType));
            } else if (OAuth2.Type.AUTHORIZATION_CODE.equals(((OAuth2) authenticationType).getGrantType())) {
                return Mono.from(OAuth2AuthorizationCode.create((OAuth2) authenticationType));
            } else {
                return Mono.empty();
            }
        } else {
            return Mono.empty();
        }
    }
}