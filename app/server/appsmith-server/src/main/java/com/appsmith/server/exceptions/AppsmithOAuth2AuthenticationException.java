package com.appsmith.server.exceptions;

import lombok.Getter;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

@Getter
public class AppsmithOAuth2AuthenticationException extends OAuth2AuthenticationException {

    private final OAuth2Error error;
    /**
     * Constructs an {@code AppsmithOAuth2AuthenticationException} using the provided parameters.
     * @param error the {@link OAuth2Error OAuth 2.0 Error}
     */
    public AppsmithOAuth2AuthenticationException(OAuth2Error error) {
        this(error, error.getDescription(), null);
    }

    /**
     * Constructs an {@code AppsmithOAuth2AuthenticationException} using the provided parameters.
     * @param error the {@link OAuth2Error OAuth 2.0 Error}
     * @param message the detail message
     * @param cause the root cause
     */
    public AppsmithOAuth2AuthenticationException(OAuth2Error error, String message, Throwable cause) {
        super(error, message, cause);
        this.error = error;
    }
}
