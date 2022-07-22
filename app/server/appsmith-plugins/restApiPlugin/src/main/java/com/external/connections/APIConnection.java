package com.external.connections;

import com.appsmith.external.helpers.SSLHelper;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import reactor.netty.http.client.HttpClient;

// Parent type for all API connections that need to be created during datasource create method.
public abstract class APIConnection implements ExchangeFilterFunction {

    HttpClient getSecuredHttpClient(DatasourceConfiguration datasourceConfiguration) {
        final OAuth2 oAuth2 = (OAuth2) datasourceConfiguration.getAuthentication();
        HttpClient httpClient = HttpClient.create();

        if (oAuth2.isUseSelfSignedCert()) {
            httpClient = httpClient.secure(SSLHelper.sslCheckForHttpClient(datasourceConfiguration));
        }

        return httpClient;
    }
}