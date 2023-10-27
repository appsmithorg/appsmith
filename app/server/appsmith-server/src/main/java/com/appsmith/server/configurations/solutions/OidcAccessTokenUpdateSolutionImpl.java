package com.appsmith.server.configurations.solutions;

import com.appsmith.server.domains.AppsmithOidcAccessToken;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import io.jsonwebtoken.lang.Collections;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.endpoint.DefaultRefreshTokenTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2RefreshTokenGrantRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.endpoint.OAuth2AccessTokenResponse;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuples;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Component
@Slf4j
public class OidcAccessTokenUpdateSolutionImpl implements OidcAccessTokenUpdateSolution {

    //    private final Set<String> DONT_SHOW_RAW_ID_TOKEN_AND_CLAIMS_FOR_OIDC_CLIENTS = Set.of("amazoncognito.com",
    // "auth0.com");
    private final Set<String> DONT_SHOW_RAW_ID_TOKEN_AND_CLAIMS_FOR_OIDC_CLIENTS = Set.of();
    DefaultRefreshTokenTokenResponseClient refreshTokenClient = new DefaultRefreshTokenTokenResponseClient();

    public OidcAccessTokenUpdateSolutionImpl() {}

    private boolean shouldUpdateRawIdTokenAndClaims(OAuth2AuthorizedClient oidcClient) {
        ClientRegistration clientRegistration = oidcClient.getClientRegistration();
        ClientRegistration.ProviderDetails providerDetails = clientRegistration.getProviderDetails();
        String authorisationUrl = providerDetails.getAuthorizationUri();

        if (Collections.isEmpty(DONT_SHOW_RAW_ID_TOKEN_AND_CLAIMS_FOR_OIDC_CLIENTS)
                || (clientRegistration.getRegistrationId().equals("oidc")
                        && StringUtils.isNotEmpty(authorisationUrl))) {
            return DONT_SHOW_RAW_ID_TOKEN_AND_CLAIMS_FOR_OIDC_CLIENTS.stream()
                    .noneMatch(oidcClientString ->
                            authorisationUrl.trim().toLowerCase().contains(oidcClientString));
        }
        return Boolean.TRUE;
    }

    private UserData getUserDataUpdatesWithAccessToken(UserData userData, OAuth2AuthorizedClient oidcClient)
            throws AppsmithException {
        UserData updates = null;
        AppsmithOidcAccessToken accessToken = userData.getOidcAccessToken();
        Instant nowPlus1MinuteInstant = Instant.now().plus(1, ChronoUnit.MINUTES);
        Instant expiryAccessToken = accessToken.getExpiresAt();

        if (expiryAccessToken.isBefore(nowPlus1MinuteInstant)) {
            if (Objects.isNull(oidcClient.getRefreshToken())) {
                // Since there is no refresh token, we can't fetch the new access tokens
                log.debug("No refresh tokens present.");
                throw new AppsmithException(AppsmithError.UPDATE_ACCESS_TOKEN_FAILED, "No refresh tokens present.");
            }
            OAuth2AccessToken newAccessToken;
            try {
                Tuple3<OAuth2AuthorizedClient, String, Jwt> newAuthorisedClientRawIdTokenAndJwt =
                        this.getNewAuthorisedClientRawIdTokenAndJwt(oidcClient);
                OAuth2AuthorizedClient newAuthorisedClient = newAuthorisedClientRawIdTokenAndJwt.getT1();
                newAccessToken = newAuthorisedClient.getAccessToken();

            } catch (Exception exception) {
                // Invalidate the session for any unforeseen exceptions that will be thrown while
                // generating the access token
                log.debug("Unable to retrieve new access token with error {}", exception.getMessage());
                throw new AppsmithException(AppsmithError.UPDATE_ACCESS_TOKEN_FAILED, exception.getMessage());
            }

            updates = new UserData();
            updates.setOidcAccessToken(new AppsmithOidcAccessToken(
                    newAccessToken.getTokenType(),
                    newAccessToken.getScopes(),
                    newAccessToken.getTokenValue(),
                    newAccessToken.getIssuedAt(),
                    newAccessToken.getExpiresAt()));
        }
        return updates;
    }

    private UserData getUserDataUpdatesWithAccessTokenIdTokenAndClaims(
            UserData userData, OAuth2AuthorizedClient oidcClient) throws AppsmithException {
        UserData updates = null;
        AppsmithOidcAccessToken accessToken = userData.getOidcAccessToken();
        Map<String, Object> oidcIdTokenClaims = userData.getOidcIdTokenClaims();
        Instant nowPlus1MinuteInstant = Instant.now().plus(1, ChronoUnit.MINUTES);
        Instant expiryAccessToken = accessToken.getExpiresAt();
        Object expiryObjectIsTokenClaims = oidcIdTokenClaims.getOrDefault(IdTokenClaimNames.EXP, Instant.now());
        Instant expiryIdTokenClaims;
        try {
            if (expiryObjectIsTokenClaims instanceof Date) {
                expiryIdTokenClaims = ((Date) expiryObjectIsTokenClaims).toInstant();
            } else if (expiryObjectIsTokenClaims instanceof Instant) {
                expiryIdTokenClaims = (Instant) expiryObjectIsTokenClaims;
            } else {
                expiryIdTokenClaims = Instant.now();
            }
        } catch (Exception exception) {
            expiryIdTokenClaims = Instant.now();
        }

        if (expiryAccessToken.isBefore(nowPlus1MinuteInstant) || expiryIdTokenClaims.isBefore(nowPlus1MinuteInstant)) {

            if (Objects.isNull(oidcClient.getRefreshToken())) {
                // Since there is no refresh token, we can't fetch the new access tokens
                log.debug("No refresh tokens present.");
                throw new AppsmithException(AppsmithError.UPDATE_ACCESS_TOKEN_FAILED, "No refresh tokens present.");
            }

            OAuth2AccessToken newAccessToken;
            String newRawIdToken;
            Map<String, Object> newIdTokenClaims;
            try {
                Tuple3<OAuth2AuthorizedClient, String, Jwt> newAuthorisedClientRawIdTokenAndJwt =
                        this.getNewAuthorisedClientRawIdTokenAndJwt(oidcClient);
                OAuth2AuthorizedClient newAuthorisedClient = newAuthorisedClientRawIdTokenAndJwt.getT1();
                newRawIdToken = newAuthorisedClientRawIdTokenAndJwt.getT2();
                Jwt newDecodedJwt = newAuthorisedClientRawIdTokenAndJwt.getT3();
                newAccessToken = newAuthorisedClient.getAccessToken();
                newIdTokenClaims = newDecodedJwt.getClaims();

            } catch (Exception exception) {
                // Invalidate the session for any unforeseen exceptions that will be thrown while
                // generating the access token
                log.debug("Unable to retrieve new access token with error {}", exception.getMessage());
                throw new AppsmithException(AppsmithError.UPDATE_ACCESS_TOKEN_FAILED, exception.getMessage());
            }

            updates = new UserData();
            updates.setOidcAccessToken(new AppsmithOidcAccessToken(
                    newAccessToken.getTokenType(),
                    newAccessToken.getScopes(),
                    newAccessToken.getTokenValue(),
                    newAccessToken.getIssuedAt(),
                    newAccessToken.getExpiresAt()));

            updates.setRawIdToken(newRawIdToken);
            updates.setOidcIdTokenClaims(newIdTokenClaims);
        }
        return updates;
    }

    // Check if the access token has expired. If yes, refresh the token if available,
    // else invalidate the session so that the session can be re-authenticated
    // Also check for the expiry time of the IdToken claims.
    @Override
    public UserData getUserDataResourceForUpdatingAccessTokenAndOidcTokenIfRequired(
            UserData userData, OAuth2AuthorizedClient oidcClient) {

        UserData updates;

        if (shouldUpdateRawIdTokenAndClaims(oidcClient)) {
            updates = getUserDataUpdatesWithAccessTokenIdTokenAndClaims(userData, oidcClient);
        } else {
            updates = getUserDataUpdatesWithAccessToken(userData, oidcClient);
        }

        return updates;
    }

    private Tuple3<OAuth2AuthorizedClient, String, Jwt> getNewAuthorisedClientRawIdTokenAndJwt(
            OAuth2AuthorizedClient oidcClient) {

        final OAuth2RefreshTokenGrantRequest refreshTokenGrantRequest = new OAuth2RefreshTokenGrantRequest(
                oidcClient.getClientRegistration(),
                oidcClient.getAccessToken(),
                oidcClient.getRefreshToken(),
                oidcClient.getAccessToken().getScopes());

        JwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(
                        oidcClient.getClientRegistration().getProviderDetails().getJwkSetUri())
                .build();

        OAuth2AccessTokenResponse tokenResponse = refreshTokenClient.getTokenResponse(refreshTokenGrantRequest);

        OAuth2AuthorizedClient oAuth2AuthorizedClient = new OAuth2AuthorizedClient(
                oidcClient.getClientRegistration(),
                oidcClient.getPrincipalName(),
                tokenResponse.getAccessToken(),
                tokenResponse.getRefreshToken());

        String rawIdToken = (String) tokenResponse.getAdditionalParameters().get(OidcParameterNames.ID_TOKEN);
        Jwt decodedJwt = decoder.decode(rawIdToken);

        return Tuples.of(oAuth2AuthorizedClient, rawIdToken, decodedJwt);
    }
}
