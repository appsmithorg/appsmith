package com.external.connections;

import com.appsmith.external.constants.Authentication;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.UpdatableConnection;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyExtractors;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

@Setter
@Getter
public class OAuth2ClientCredentials extends APIConnection implements UpdatableConnection {

    private final Clock clock = Clock.systemUTC();
    private String token;
    private String headerPrefix;
    private boolean isHeader;
    private Instant expiresAt;
    private Object tokenResponse;
    private static final int MAX_IN_MEMORY_SIZE = 10 * 1024 * 1024; // 10 MB

    private OAuth2ClientCredentials() {
    }

    public static Mono<OAuth2ClientCredentials> create(OAuth2 oAuth2) {
        if (oAuth2 == null) {
            return Mono.empty();
        }
        // Create OAuth2Connection
        OAuth2ClientCredentials connection = new OAuth2ClientCredentials();

        return Mono.just(oAuth2)
                // Validate existing token
                .filter(x -> x.getToken() != null && !x.getToken().isBlank())
                .filter(x -> x.getExpiresAt() != null)
                .filter(x -> {
                    Instant now = connection.clock.instant();
                    Instant expiresAt = x.getExpiresAt();
                    return now.isBefore(expiresAt.minus(Duration.ofMinutes(1)));
                })
                // If invalid, regenerate token
                .switchIfEmpty(connection.generateOAuth2Token(oAuth2))
                // Store valid token
                .flatMap(token -> {
                    connection.setToken(token.getToken());
                    connection.setHeader(token.getIsTokenHeader());
                    connection.setHeaderPrefix(token.getHeaderPrefix());
                    connection.setExpiresAt(token.getExpiresAt());
                    connection.setTokenResponse(token.getTokenResponse());
                    return Mono.just(connection);
                });
    }

    private Mono<OAuth2> generateOAuth2Token(OAuth2 oAuth2) {
        // Webclient
        WebClient webClient = WebClient.builder()
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .exchangeStrategies(ExchangeStrategies
                        .builder()
                        .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE))
                        .build())
                .build();

        // Send oauth2 generic request
        return webClient
                .method(HttpMethod.POST)
                .uri(oAuth2.getAccessTokenUrl())
                .body(clientCredentialsTokenBody(oAuth2))
                .exchange()
                .flatMap(response -> response.body(BodyExtractors.toMono(Map.class)))
                // Receive and parse response
                .map(mappedResponse -> {
                    // Store received response as is for reference
                    oAuth2.setTokenResponse(mappedResponse);
                    // Parse useful fields for quick access
                    Object issuedAtResponse = mappedResponse.get(Authentication.ISSUED_AT);
                    // Default issuedAt to current time
                    Instant issuedAt = Instant.now();
                    if (issuedAtResponse != null) {
                        issuedAt = Instant.ofEpochSecond(Long.parseLong((String) issuedAtResponse));
                    }

                    // We expect at least one of the following to be present
                    Object expiresAtResponse = mappedResponse.get(Authentication.EXPIRES_AT);
                    Object expiresInResponse = mappedResponse.get(Authentication.EXPIRES_IN);
                    Instant expiresAt = null;
                    if (expiresAtResponse != null) {
                        expiresAt = Instant.ofEpochSecond(Long.parseLong((String) expiresAtResponse));
                    } else if (expiresInResponse != null) {
                        expiresAt = issuedAt.plusSeconds(Long.valueOf((Integer) expiresInResponse));
                    }
                    oAuth2.setExpiresAt(expiresAt);
                    oAuth2.setIssuedAt(issuedAt);
                    oAuth2.setToken(String.valueOf(mappedResponse.get(Authentication.ACCESS_TOKEN)));
                    System.out.println("Entered token generation...");
                    return oAuth2;
                });
    }

    @Override
    public Mono<ClientResponse> filter(ClientRequest clientRequest, ExchangeFunction exchangeFunction) {
        // Validate token before execution
        Instant now = this.clock.instant();
        Instant expiresAt = this.expiresAt;
        if (this.expiresAt != null && now.isAfter(expiresAt.minus(Duration.ofMinutes(1)))) {
            return Mono.error(new StaleConnectionException("The access token has expired"));
        }
        // Pick the token that has been created/retrieved
        return addTokenToRequest(clientRequest)
                // Carry on to next exchange function
                .flatMap(exchangeFunction::exchange)
                // Default to next exchange function if something went wrong
                .switchIfEmpty(exchangeFunction.exchange(clientRequest));
    }

    private Mono<ClientRequest> addTokenToRequest(ClientRequest clientRequest) {
        // Check to see where the token needs to be added
        if (this.isHeader()) {
            final String finalHeaderPrefix = this.getHeaderPrefix() != null && !this.getHeaderPrefix().isBlank() ?
                    this.getHeaderPrefix() + " "
                    : "Bearer ";
            return Mono.justOrEmpty(ClientRequest.from(clientRequest)
                    .headers(headers -> headers.set("Authorization", finalHeaderPrefix + this.getToken()))
                    .build());
        } else {
            final URI url = UriComponentsBuilder.fromUri(clientRequest.url())
                    .queryParam(Authentication.ACCESS_TOKEN, this.getToken())
                    .build()
                    .toUri();
            return Mono.justOrEmpty(ClientRequest.from(clientRequest)
                    .url(url)
                    .build());
        }
    }

    private BodyInserters.FormInserter<String> clientCredentialsTokenBody(OAuth2 oAuth2) {
        BodyInserters.FormInserter<String> body = BodyInserters
                .fromFormData(Authentication.GRANT_TYPE, Authentication.CLIENT_CREDENTIALS)
                .with(Authentication.CLIENT_ID, oAuth2.getClientId())
                .with(Authentication.CLIENT_SECRET, oAuth2.getClientSecret());
        // Optionally add scope, if applicable
        if (!CollectionUtils.isEmpty(oAuth2.getScope())) {
            body.with(Authentication.SCOPE, StringUtils.collectionToDelimitedString(oAuth2.getScope(), " "));
        }
        return body;
    }

    @Override
    public AuthenticationDTO getAuthenticationDTO(AuthenticationDTO authenticationDTO) {
        OAuth2 oAuth2 = (OAuth2) authenticationDTO;
        oAuth2.setToken(this.token);
        oAuth2.setHeaderPrefix(this.headerPrefix);
        oAuth2.setIsTokenHeader(this.isHeader);
        oAuth2.setExpiresAt(this.expiresAt);
        oAuth2.setTokenResponse(this.tokenResponse);

        return oAuth2;
    }
}