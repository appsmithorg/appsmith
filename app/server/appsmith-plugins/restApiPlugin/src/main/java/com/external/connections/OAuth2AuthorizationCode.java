package com.external.connections;

import com.appsmith.external.constants.Authentication;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.UpdatableConnection;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.internal.Base64;
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

import static com.appsmith.external.models.OAuth2.RefreshTokenClientCredentialsLocation.BODY;
import static com.appsmith.external.models.OAuth2.RefreshTokenClientCredentialsLocation.HEADER;
import static org.apache.commons.lang3.StringUtils.isBlank;

@Setter
@Getter
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class OAuth2AuthorizationCode extends APIConnection implements UpdatableConnection {

    private final Clock clock = Clock.systemUTC();
    private String token;
    private String refreshToken;
    private String headerPrefix;
    private boolean isHeader;
    private Instant expiresAt;
    private Object tokenResponse;
    private static final int MAX_IN_MEMORY_SIZE = 10 * 1024 * 1024; // 10 MB

    private static void updateConnection(OAuth2AuthorizationCode connection, OAuth2 token) {
        connection.setToken(token.getAuthenticationResponse().getToken());
        connection.setHeader(token.getIsTokenHeader());
        connection.setHeaderPrefix(token.getHeaderPrefix());
        connection.setExpiresAt(token.getAuthenticationResponse().getExpiresAt());
        connection.setRefreshToken(token.getAuthenticationResponse().getRefreshToken());
        connection.setTokenResponse(token.getAuthenticationResponse().getTokenResponse());
    }

    private static boolean isAuthenticationResponseValid(OAuth2 oAuth2) {
        if (oAuth2.getAuthenticationResponse() == null
                || isBlank(oAuth2.getAuthenticationResponse().getToken())
                || isExpired(oAuth2)) {
            return false;
        }

        return true;
    }

    public static Mono<OAuth2AuthorizationCode> create(OAuth2 oAuth2) {
        if (oAuth2 == null) {
            return Mono.empty();
        }
        // Create OAuth2Connection
        OAuth2AuthorizationCode connection = new OAuth2AuthorizationCode();

        if (!isAuthenticationResponseValid(oAuth2)) {
            return connection.generateOAuth2Token(oAuth2)
                    .flatMap(token -> {
                        updateConnection(connection, token);
                        return Mono.just(connection);
                    });
        }

        updateConnection(connection, oAuth2);
        return Mono.just(connection);
    }

    private static boolean isExpired(OAuth2 oAuth2) {
        if (oAuth2.getAuthenticationResponse().getExpiresAt() == null) {
            return true;
        }

        OAuth2AuthorizationCode connection = new OAuth2AuthorizationCode();
        Instant now = connection.clock.instant();
        Instant expiresAt = oAuth2.getAuthenticationResponse().getExpiresAt();

        return now.isAfter(expiresAt.minus(Duration.ofMinutes(1)));
    }

    private Mono<OAuth2> generateOAuth2Token(OAuth2 oAuth2) {
        WebClient.Builder webClientBuilder = WebClient.builder()
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .exchangeStrategies(ExchangeStrategies
                        .builder()
                        .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE))
                        .build());

        if (HEADER.equals(oAuth2.getRefreshTokenClientCredentialsLocation())) {
            byte[] clientCredentials = (oAuth2.getClientId() + ":" + oAuth2.getClientSecret()).getBytes();
            final String authorizationHeader = "Basic " + Base64.encode(clientCredentials);
            webClientBuilder.defaultHeader("Authorization", authorizationHeader);
        }

        // Webclient
        WebClient webClient = webClientBuilder.build();

        // Send oauth2 generic request
        return webClient
                .method(HttpMethod.POST)
                .uri(oAuth2.getAccessTokenUrl())
                .body(getTokenBody(oAuth2))
                .exchange()
                .flatMap(response -> response.body(BodyExtractors.toMono(Map.class)))
                // Receive and parse response
                .map(mappedResponse -> {
                    AuthenticationResponse authenticationResponse = new AuthenticationResponse();
                    // Store received response as is for reference
                    authenticationResponse.setTokenResponse(mappedResponse);
                    // Parse useful fields for quick access
                    Object issuedAtResponse = mappedResponse.get(Authentication.ISSUED_AT);
                    // Default issuedAt to current time
                    Instant issuedAt = Instant.now();
                    if (issuedAtResponse != null) {
                        issuedAt = Instant.ofEpochMilli(Long.parseLong((String) issuedAtResponse));
                    }

                    // We expect at least one of the following to be present
                    Object expiresAtResponse = mappedResponse.get(Authentication.EXPIRES_AT);
                    Object expiresInResponse = mappedResponse.get(Authentication.EXPIRES_IN);
                    Instant expiresAt = null;
                    if (expiresAtResponse != null) {
                        expiresAt = Instant.ofEpochSecond(Long.valueOf((Integer) expiresAtResponse));
                    } else if (expiresInResponse != null) {
                        expiresAt = issuedAt.plusSeconds(Long.valueOf((Integer) expiresInResponse));
                    }
                    authenticationResponse.setExpiresAt(expiresAt);
                    authenticationResponse.setIssuedAt(issuedAt);
                    if (mappedResponse.containsKey(Authentication.REFRESH_TOKEN)) {
                        authenticationResponse.setRefreshToken(String.valueOf(mappedResponse.get(Authentication.REFRESH_TOKEN)));
                    }
                    authenticationResponse.setToken(String.valueOf(mappedResponse.get(Authentication.ACCESS_TOKEN)));
                    oAuth2.setAuthenticationResponse(authenticationResponse);
                    return oAuth2;
                });
    }

    @Override
    public Mono<ClientResponse> filter(ClientRequest clientRequest, ExchangeFunction exchangeFunction) {
        // Validate token before execution
        Instant now = this.clock.instant();
        Instant expiresAt = this.expiresAt;

        if (this.expiresAt != null && now.isAfter(expiresAt.minus(Duration.ofMillis(500)))) {
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
                    this.getHeaderPrefix().trim() + " "
                    : "";
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

    private BodyInserters.FormInserter<String> getTokenBody(OAuth2 oAuth2) {
        BodyInserters.FormInserter<String> body = BodyInserters
                .fromFormData(Authentication.GRANT_TYPE, Authentication.REFRESH_TOKEN)
                .with(Authentication.REFRESH_TOKEN, oAuth2.getAuthenticationResponse().getRefreshToken());

        if (BODY.equals(oAuth2.getRefreshTokenClientCredentialsLocation())
                || oAuth2.getRefreshTokenClientCredentialsLocation() == null) {
            body.with(Authentication.CLIENT_ID, oAuth2.getClientId())
                    .with(Authentication.CLIENT_SECRET, oAuth2.getClientSecret());
        }

        // Adding optional audience parameter
        if (!StringUtils.isEmpty(oAuth2.getAudience())) {
            body.with(Authentication.AUDIENCE, oAuth2.getAudience());
        }
        // Adding optional resource parameter
        if (!StringUtils.isEmpty(oAuth2.getResource())) {
            body.with(Authentication.RESOURCE, oAuth2.getResource());
        }
        // Optionally add scope, if applicable
        if (!CollectionUtils.isEmpty(oAuth2.getScope())
                && (Boolean.TRUE.equals(oAuth2.getSendScopeWithRefreshToken()) || oAuth2.getSendScopeWithRefreshToken() == null)) {
            body.with(Authentication.SCOPE, StringUtils.collectionToDelimitedString(oAuth2.getScope(), " "));
        }
        return body;
    }

    @Override
    public AuthenticationDTO getAuthenticationDTO(AuthenticationDTO authenticationDTO) {
        OAuth2 oAuth2 = (OAuth2) authenticationDTO;
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        authenticationResponse.setToken(this.token);
        oAuth2.setHeaderPrefix(this.headerPrefix);
        oAuth2.setIsTokenHeader(this.isHeader);
        authenticationResponse.setRefreshToken(this.refreshToken);
        authenticationResponse.setExpiresAt(this.expiresAt);
        authenticationResponse.setTokenResponse(this.tokenResponse);
        oAuth2.setAuthenticationResponse(authenticationResponse);

        return oAuth2;
    }
}