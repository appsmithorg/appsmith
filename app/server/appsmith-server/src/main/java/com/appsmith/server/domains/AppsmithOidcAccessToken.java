package com.appsmith.server.domains;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.oauth2.core.OAuth2AccessToken;

import java.time.Instant;
import java.util.Set;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class AppsmithOidcAccessToken {

    private OAuth2AccessToken.TokenType tokenType;

    private Set<String> scopes;

    private String tokenValue;

    private Instant issuedAt;

    private Instant expiresAt;
}
