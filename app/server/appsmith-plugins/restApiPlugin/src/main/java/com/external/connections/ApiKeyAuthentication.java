package com.external.connections;

import com.appsmith.external.models.ApiKeyAuth;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;

import static com.appsmith.external.constants.Authentication.API_KEY_PARAM;

@Setter
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ApiKeyAuthentication extends APIConnection{
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
                .url(appendApiKeyParamToUrl(request.url()))
                .build())
                // Carry on to next exchange function
                .flatMap(next::exchange)
                // Default to next exchange function if something went wrong
                .switchIfEmpty(next.exchange(request));
    }

    private URI appendApiKeyParamToUrl(URI oldUrl) {
        String query = appendApiKeyParamToQuery(oldUrl.getQuery());

        return UriComponentsBuilder
                .newInstance()
                .scheme(oldUrl.getScheme())
                .host(oldUrl.getHost())
                .port(oldUrl.getPort())
                .path(oldUrl.getPath())
                .query(query)
                .fragment(oldUrl.getFragment())
                .build()
                .toUri();
    }

    private String appendApiKeyParamToQuery(String oldQuery) {
        return StringUtils.isEmpty(oldQuery) ?
                API_KEY_PARAM + "=" + this.key :
                oldQuery + "&" + API_KEY_PARAM + "=" + this.key;
    }
}
