package com.appsmith.external.models;

import com.appsmith.external.annotations.documenttype.DocumentType;
import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.constants.Authentication;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.views.Views;
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

    @JsonView(Views.Public.class)
    Type grantType;

    // Send tokens as query params if false
    @JsonView(Views.Public.class)
    Boolean isTokenHeader = false;

    // Send auth details in body if false
    @JsonView(Views.Public.class)
    Boolean isAuthorizationHeader = false;

    @JsonView(Views.Public.class)
    String clientId;

    @Encrypted
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @JsonView(Views.Public.class)
    String clientSecret;

    @JsonView(Views.Public.class)
    String authorizationUrl;

    @JsonView(Views.Public.class)
    String accessTokenUrl;

    @Transient
    @JsonView(Views.Public.class)
    String scopeString;

    @JsonView(Views.Public.class)
    Set<String> scope;

    @JsonView(Views.Public.class)
    Boolean sendScopeWithRefreshToken;

    @JsonView(Views.Public.class)
    RefreshTokenClientCredentialsLocation refreshTokenClientCredentialsLocation;

    @JsonView(Views.Public.class)
    String headerPrefix;

    @JsonView(Views.Public.class)
    Set<Property> customTokenParameters;

    @JsonView(Views.Public.class)
    String audience;

    @JsonView(Views.Public.class)
    String resource;

    @JsonView(Views.Public.class)
    boolean useSelfSignedCert = false;

    @JsonView(Views.Public.class)
    public String getScopeString() {
        if (scopeString != null && !scopeString.isBlank()) {
            return scopeString;
        } else if (this.scope != null && !this.scope.isEmpty()) {
            return Strings.join(this.scope, ',');
        } else return null;
    }

    @JsonView(Views.Public.class)
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
