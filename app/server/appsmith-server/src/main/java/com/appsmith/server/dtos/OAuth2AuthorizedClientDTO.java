package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthenticationMethod;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;

import java.time.Instant;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OAuth2AuthorizedClientDTO {

    private String provider;

    private String principalName;

    private ClientRegistrationDTO clientRegistration;

    private OAuth2AccessTokenDTO accessToken;

    private OAuth2RefreshTokenDTO refreshToken;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class ClientRegistrationDTO {
        private String registrationId;
        private String clientId;
        private String clientSecret;
        private String clientAuthenticationMethod;
        private String authorizationGrantType;
        private String redirectUri;
        private Set<String> scopes;
        private String clientName;
        private String authorizationUri;
        private String tokenUri;
        private String jwkSetUri;
        private String issuerUri;
        private String userInfoUri;
        private String userInfoAuthenticationMethod;
        private String userNameAttributeName;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class OAuth2AccessTokenDTO {
        private String tokenType;
        private String tokenValue;
        private String issuedAt;
        private String expiresAt;
        private Set<String> scopes;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class OAuth2RefreshTokenDTO {
        private String tokenValue;
        private String issuedAt;
        private String expiresAt;
    }

    public static OAuth2AuthorizedClientDTO fromOAuth2AuthorizedClient(final String provider, final OAuth2AuthorizedClient client) {
        final ClientRegistration cr = client.getClientRegistration();
        final ClientRegistration.ProviderDetails pd = cr.getProviderDetails();
        final OAuth2AccessToken at = client.getAccessToken();
        final OAuth2RefreshToken rt = client.getRefreshToken();

        return new OAuth2AuthorizedClientDTO(
                provider,
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
                        at.getIssuedAt().toString(),
                        at.getExpiresAt().toString(),
                        at.getScopes()
                ),
                rt == null ? null : new OAuth2RefreshTokenDTO(
                        rt.getTokenValue(),
                        rt.getIssuedAt().toString(),
                        rt.getExpiresAt().toString()
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

        System.out.println("!!!!! registrationId: " + clientRegistration.registrationId);

        final OAuth2AuthorizedClient client = new OAuth2AuthorizedClient(
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
                        Instant.parse(accessToken.issuedAt),
                        Instant.parse(accessToken.expiresAt),
                        Set.copyOf(accessToken.scopes)
                ),
                refreshToken == null ? null : new OAuth2RefreshToken(
                        refreshToken.tokenValue,
                        Instant.parse(refreshToken.issuedAt),
                        Instant.parse(refreshToken.expiresAt)
                )
        );

        System.out.println("!!!!! client registrationId: " + client.getClientRegistration().getRegistrationId());

        return client;
    }

}
