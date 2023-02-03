package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthenticationMethod;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import java.time.Instant;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OAuth2AuthorizedClientDTO {

    @JsonView(Views.Public.class)
    private String principalName;

    @JsonView(Views.Public.class)
    private ClientRegistrationDTO clientRegistration;

    @JsonView(Views.Public.class)
    private OAuth2AccessTokenDTO accessToken;

    @JsonView(Views.Public.class)
    private OAuth2RefreshTokenDTO refreshToken;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class ClientRegistrationDTO {
        @JsonView(Views.Public.class)
        private String registrationId;

        @JsonView(Views.Public.class)
        private String clientId;
        
        @JsonView(Views.Public.class)
        private String clientSecret;

        @JsonView(Views.Public.class)
        private String clientAuthenticationMethod;

        @JsonView(Views.Public.class)
        private String authorizationGrantType;

        @JsonView(Views.Public.class)
        private String redirectUri;

        @JsonView(Views.Public.class)
        private Set<String> scopes;

        @JsonView(Views.Public.class)
        private String clientName;

        @JsonView(Views.Public.class)
        private String authorizationUri;

        @JsonView(Views.Public.class)
        private String tokenUri;

        @JsonView(Views.Public.class)
        private String jwkSetUri;

        @JsonView(Views.Public.class)
        private String issuerUri;

        @JsonView(Views.Public.class)
        private String userInfoUri;

        @JsonView(Views.Public.class)
        private String userInfoAuthenticationMethod;

        @JsonView(Views.Public.class)
        private String userNameAttributeName;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class OAuth2AccessTokenDTO {
        @JsonView(Views.Public.class)
        private String tokenType;

        @JsonView(Views.Public.class)
        private String tokenValue;

        @JsonView(Views.Public.class)
        private String issuedAt;

        @JsonView(Views.Public.class)
        private String expiresAt;

        @JsonView(Views.Public.class)
        private Set<String> scopes;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class OAuth2RefreshTokenDTO {
        @JsonView(Views.Public.class)
        private String tokenValue;

        @JsonView(Views.Public.class)
        private String issuedAt;

        @JsonView(Views.Public.class)
        private String expiresAt;
    }

    public static OAuth2AuthorizedClientDTO fromOAuth2AuthorizedClient(final OAuth2AuthorizedClient client) {
        final ClientRegistration cr = client.getClientRegistration();
        final ClientRegistration.ProviderDetails pd = cr.getProviderDetails();
        final OAuth2AccessToken at = client.getAccessToken();
        final OAuth2RefreshToken rt = client.getRefreshToken();

        return new OAuth2AuthorizedClientDTO(
                client.getPrincipalName(),
                new ClientRegistrationDTO(
                        cr.getRegistrationId(),
                        cr.getClientId(),
                        cr.getClientSecret(),
                        cr.getClientAuthenticationMethod().getValue(),
                        cr.getAuthorizationGrantType().getValue(),
                        cr.getRedirectUri(),
                        cr.getScopes(),
                        cr.getClientName(),
                        pd.getAuthorizationUri(),
                        pd.getTokenUri(),
                        pd.getJwkSetUri(),
                        pd.getIssuerUri(),
                        pd.getUserInfoEndpoint().getUri(),
                        pd.getUserInfoEndpoint().getAuthenticationMethod().getValue(),
                        pd.getUserInfoEndpoint().getUserNameAttributeName()
                ),
                new OAuth2AccessTokenDTO(
                        at.getTokenType().getValue(),
                        at.getTokenValue(),
                        ObjectUtils.defaultIfNull(at.getIssuedAt(), "").toString(),
                        ObjectUtils.defaultIfNull(at.getExpiresAt(), "").toString(),
                        at.getScopes()
                ),
                rt == null ? null : new OAuth2RefreshTokenDTO(
                        rt.getTokenValue(),
                        ObjectUtils.defaultIfNull(rt.getIssuedAt(), "").toString(),
                        ObjectUtils.defaultIfNull(rt.getExpiresAt(), "").toString()
                )
        );
    }

    public OAuth2AuthorizedClient makeOAuth2AuthorizedClient() {
        OAuth2AccessToken.TokenType tokenType;
        if (OAuth2AccessToken.TokenType.BEARER.getValue().equals(accessToken.tokenType)) {
            tokenType = OAuth2AccessToken.TokenType.BEARER;
        } else {
            throw new IllegalArgumentException("Could not deserialize OAuth2AuthorizedClient, unknown token type: " + accessToken.tokenType);
        }

        return new OAuth2AuthorizedClient(
                ClientRegistration
                        .withRegistrationId(clientRegistration.registrationId)
                        .clientId(clientRegistration.clientId)
                        .clientSecret(clientRegistration.clientSecret)
                        // TODO: Don't recreate this object, use one of the static constants already in that class.
                        .clientAuthenticationMethod(new ClientAuthenticationMethod(clientRegistration.clientAuthenticationMethod))
                        // TODO: Don't recreate this object, use one of the static constants already in that class.
                        .authorizationGrantType(new AuthorizationGrantType(clientRegistration.authorizationGrantType))
                        .redirectUri(clientRegistration.redirectUri)
                        .scope(clientRegistration.scopes)
                        .clientName(clientRegistration.clientName)
                        .authorizationUri(clientRegistration.authorizationUri)
                        .tokenUri(clientRegistration.tokenUri)
                        .issuerUri(clientRegistration.issuerUri)
                        .jwkSetUri(clientRegistration.jwkSetUri)
                        .userInfoUri(clientRegistration.userInfoUri)
                        .userInfoAuthenticationMethod(new AuthenticationMethod(clientRegistration.userInfoAuthenticationMethod))
                        .userNameAttributeName(clientRegistration.userNameAttributeName)
                        .build(),
                principalName,
                new OAuth2AccessToken(
                        tokenType,
                        accessToken.tokenValue,
                        parseInstant(accessToken.issuedAt),
                        parseInstant(accessToken.expiresAt),
                        Set.copyOf(accessToken.scopes)
                ),
                refreshToken == null ? null : new OAuth2RefreshToken(
                        refreshToken.tokenValue,
                        parseInstant(refreshToken.issuedAt),
                        parseInstant(refreshToken.expiresAt)
                )
        );
    }

    private Instant parseInstant(String refreshToken) {
        return StringUtils.isEmpty(refreshToken) ? null : Instant.parse(refreshToken);
    }

}
