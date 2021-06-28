package com.external.connections;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.ApiKeyAuth.Type;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;

@Setter
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ApiKeyAuthentication extends APIConnection {
    private String label;
    private String value;
    Type addTo;

    public static Mono<ApiKeyAuthentication> create(ApiKeyAuth apiKeyAuth) {
        return Mono.just(
                ApiKeyAuthentication.builder()
                        .label(apiKeyAuth.getLabel())
                        .value(apiKeyAuth.getValue())
                        .addTo(apiKeyAuth.getAddTo())
                        .build()
        );
    }

    @Override
    public Mono<ClientResponse> filter(ClientRequest request, ExchangeFunction next) {
        ClientRequest.Builder requestBuilder = ClientRequest.from(request);
        switch (addTo) {
            case QUERY_PARAMS:
                requestBuilder.url(appendApiKeyParamToUrl(request.url()));
                break;
            case HEADER:
                requestBuilder.headers(header -> header.set(label, value));
                break;
            default:
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Appsmith server has found an unsupported api key authentication type. Please reach " +
                                        "out to Appsmith customer support to resolve this."
                        )
                );
        }

        return Mono.justOrEmpty(requestBuilder.build())
                // Carry on to next exchange function
                .flatMap(next::exchange)
                // Default to next exchange function if something went wrong
                .switchIfEmpty(next.exchange(request));
    }

    private URI appendApiKeyParamToUrl(URI oldUrl) {

        return UriComponentsBuilder
                .newInstance()
                .scheme(oldUrl.getScheme())
                .host(oldUrl.getHost())
                .port(oldUrl.getPort())
                .path(oldUrl.getPath())
                .query(oldUrl.getQuery())
                .queryParam(label, value)
                .fragment(oldUrl.getFragment())
                .build()
                .toUri();
    }
}