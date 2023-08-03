package com.appsmith.server.exceptions;

import org.springframework.security.core.AuthenticationException;

public class InvalidApiKeyException extends AuthenticationException {
    public InvalidApiKeyException(String msg, Throwable cause) {
        super(msg, cause);
    }
}
