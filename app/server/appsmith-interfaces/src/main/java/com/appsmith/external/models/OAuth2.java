package com.appsmith.external.models;

import com.appsmith.external.annotations.documenttype.DocumentType;
import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.constants.Authentication;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

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

    public enum Type {
        @JsonProperty(Authentication.CLIENT_CREDENTIALS)
        CLIENT_CREDENTIALS,
        @JsonProperty(Authentication.AUTHORIZATION_CODE)
        AUTHORIZATION_CODE
    }

    public enum RefreshTokenClientCredentialsLocation {
        HEADER,
        BODY
    }

    @JsonView(Views.Api.class)
    Type grantType;

    // Send tokens as query params if false
    @JsonView(Views.Api.class)
    Boolean isTokenHeader = false;

    // Send auth details in body if false
    @JsonView(Views.Api.class)
    Boolean isAuthorizationHeader = false;

    @JsonView(Views.Api.class)
    String clientId;

    @Encrypted
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @JsonView(Views.Api.class)
    String clientSecret;

    @JsonView(Views.Api.class)
    String authorizationUrl;

    @JsonView(Views.Api.class)
    String accessTokenUrl;

    @Transient
    @JsonView(Views.Api.class)
    String scopeString;

    @JsonView(Views.Api.class)
    Set<String> scope;

    @JsonView(Views.Api.class)
    Boolean sendScopeWithRefreshToken;

    @JsonView(Views.Api.class)
    RefreshTokenClientCredentialsLocation refreshTokenClientCredentialsLocation;

    @JsonView(Views.Api.class)
    String headerPrefix;

    @JsonView(Views.Api.class)
    Set<Property> customTokenParameters;

    @JsonView(Views.Api.class)
    String audience;

    @JsonView(Views.Api.class)
    String resource;

    @JsonView(Views.Api.class)
    boolean useSelfSignedCert = false;

    @JsonView(Views.Api.class)
    public String getScopeString() {
        if (scopeString != null && !scopeString.isBlank()) {
            return scopeString;
        } else if (this.scope != null && !this.scope.isEmpty()) {
            return Strings.join(this.scope, ',');
        } else return null;
    }

    @JsonView(Views.Api.class)
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
