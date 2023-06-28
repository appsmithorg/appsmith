package com.appsmith.server.exceptions;

import org.springframework.security.core.AuthenticationException;

public class InValidApiKeyException extends AuthenticationException {
    public InValidApiKeyException(String msg, Throwable cause) {
        super(msg, cause);
    }
}
