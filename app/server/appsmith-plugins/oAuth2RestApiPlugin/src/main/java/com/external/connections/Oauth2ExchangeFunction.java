package com.external.connections;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.web.reactive.function.BodyExtractors;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;

@Slf4j
class Oauth2ExchangeFunction implements ExchangeFilterFunction {

    private Connection connection;
    private final Clock clock = Clock.systemUTC();

    Oauth2ExchangeFunction(Connection connection) {
        this.connection = connection;
    }

    @Override
    public Mono<ClientResponse> filter(ClientRequest clientRequest, ExchangeFunction exchangeFunction) {
        return getValidToken(exchangeFunction)
                .map(token -> bearer(clientRequest, token.getTokenValue()))
                .flatMap(exchangeFunction::exchange)
                .switchIfEmpty(exchangeFunction.exchange(clientRequest));
    }

    private Mono<OAuth2AccessToken> getValidToken(ExchangeFunction next) {
        return Mono.just(this.connection.getClientRegistration())
                .flatMap(request -> getCurrentTokenIfValid()
                        .switchIfEmpty(refreshAuth0Token(request, next)));
    }

    private Mono<OAuth2AccessToken> getCurrentTokenIfValid() {
        return Mono.justOrEmpty(connection.getToken())
                .filter(Objects::nonNull)
                .filter(token -> token.getExpiresAt() != null)
                .filter(token -> {
                    Instant now = this.clock.instant();
                    Instant expiresAt = token.getExpiresAt();
                    return now.isBefore(expiresAt.minus(Duration.ofMinutes(1)));
                });
    }

    private Mono<OAuth2AccessToken> refreshAuth0Token(ClientRegistration clientRegistration, ExchangeFunction next) {
        String tokenUri = clientRegistration
                .getProviderDetails().getTokenUri();
        ClientRequest clientCredentialsTokenRequest = ClientRequest.create(HttpMethod.POST, URI.create(tokenUri))
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .body(clientCredentialsTokenBody(clientRegistration))
                .build();
        return next.exchange(clientCredentialsTokenRequest)
                .flatMap(response -> response.body(BodyExtractors.toMono(Map.class)))
                .map(x -> {
                    Object issuedAtResponse = x.get("issued_at");
                    Instant issuedAt = Instant.now();
                    if (issuedAtResponse != null) {
                        issuedAt = Instant.ofEpochMilli(Long.parseLong((String) issuedAtResponse));
                    }

                    Object expiresAtResponse = x.get("expires_at");
                    Object expiresInResponse = x.get("expires_in");
                    Instant expiresAt = null;
                    if (expiresAtResponse != null) {
                        expiresAt = Instant.ofEpochMilli(Long.parseLong((String) expiresAtResponse));
                    } else if (expiresInResponse != null) {
                        expiresAt = issuedAt.plusMillis(Long.parseLong((String) expiresInResponse));
                    }

                    return new OAuth2AccessToken(
                            OAuth2AccessToken.TokenType.BEARER,
                            String.valueOf(x.get("access_token")),
                            issuedAt,
                            expiresAt);
                })
                .map(this.connection::setToken);
    }

    private static BodyInserters.FormInserter<String> clientCredentialsTokenBody(ClientRegistration clientRegistration) {
        return BodyInserters
                .fromFormData("grant_type", AuthorizationGrantType.CLIENT_CREDENTIALS.getValue())
                .with("client_id", clientRegistration.getClientId())
                .with("client_secret", clientRegistration.getClientSecret());
    }

    private ClientRequest bearer(ClientRequest request, String token) {
        return ClientRequest.from(request)
                .headers(headers -> headers.setBearerAuth(token))
                .build();
    }


}
