package com.appsmith.external.models;

import com.appsmith.external.annotations.documenttype.DocumentType;
import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.constants.Authentication;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.apache.logging.log4j.util.Strings;
import org.springframework.data.annotation.Transient;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@DocumentType(Authentication.OAUTH2)
public class OAuth2 extends AuthenticationDTO {
    public enum RefreshTokenClientCredentialsLocation {
        HEADER,
        BODY
    }

    RefreshTokenClientCredentialsLocation refreshTokenClientCredentialsLocation;

    public enum Type {
        @JsonProperty(Authentication.CLIENT_CREDENTIALS)
        CLIENT_CREDENTIALS,
        @JsonProperty(Authentication.AUTHORIZATION_CODE)
        AUTHORIZATION_CODE
    }

    Type grantType;

    // Send tokens as query params if false
    Boolean isTokenHeader = false;

    // Send auth details in body if false
    Boolean isAuthorizationHeader = false;

    String clientId;

    @Encrypted
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String clientSecret;

    String authorizationUrl;

    String accessTokenUrl;

    @Transient
    String scopeString;

    Set<String> scope;

    Boolean sendScopeWithRefreshToken;

    String headerPrefix;

    Set<Property> customTokenParameters;

    String audience;

    String resource;

    public String getScopeString() {
        if (scopeString != null && !scopeString.isBlank()) {
            return scopeString;
        } else if (this.scope != null && !this.scope.isEmpty()) {
            return Strings.join(this.scope, ',');
        } else return null;
    }

    public void setScopeString(String scopeString) {
        this.scopeString = scopeString;
        if (scopeString != null && !scopeString.isBlank()) {
            this.scope = Arrays.stream(scopeString.split(","))
                    .filter(x -> !StringUtils.isEmpty(x))
                    .map(String::trim)
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public Mono<Boolean> hasExpired() {
        if (this.authenticationResponse == null) {
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_AUTHENTICATION_ERROR));
        }

        if (this.authenticationResponse.expiresAt == null) {
            // If the token did not return with an expiry time, assume that it has always expired
            return Mono.just(Boolean.TRUE);
        }

        return Mono.just(authenticationResponse.expiresAt.isBefore(Instant.now().plusSeconds(60)));
    }
}
