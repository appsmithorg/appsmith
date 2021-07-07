package com.external.connections;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.BearerTokenAuth;
import reactor.core.publisher.Mono;


public class APIConnectionFactory {

    public static Mono<APIConnection> createConnection(AuthenticationDTO authenticationType) {
        if (authenticationType instanceof OAuth2) {
            if (OAuth2.Type.CLIENT_CREDENTIALS.equals(((OAuth2) authenticationType).getGrantType())) {
                return Mono.from(OAuth2ClientCredentials.create((OAuth2) authenticationType));
            } else if (OAuth2.Type.AUTHORIZATION_CODE.equals(((OAuth2) authenticationType).getGrantType())) {
                if (!Boolean.TRUE.equals(authenticationType.getIsAuthorized())) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, "Please authorize datasource"));
                }
                return Mono.from(OAuth2AuthorizationCode.create((OAuth2) authenticationType));
            } else {
                return Mono.empty();
            }
        } else if (authenticationType instanceof BasicAuth) {
            return Mono.from(BasicAuthentication.create((BasicAuth) authenticationType));
        } else if (authenticationType instanceof ApiKeyAuth) {
            return Mono.from(ApiKeyAuthentication.create((ApiKeyAuth) authenticationType));
        } else if (authenticationType instanceof BearerTokenAuth) {
            return Mono.from(BearerTokenAuthentication.create((BearerTokenAuth) authenticationType));
        } else {
            return Mono.empty();
        }
    }
}