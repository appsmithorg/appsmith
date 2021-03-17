package com.appsmith.external.exceptions.pluginExceptions;

public class StaleConnectionException extends RuntimeException {
    public StaleConnectionException() {
    }

    public StaleConnectionException(String message) {
        super(message);
    }

    public StaleConnectionException(String message, Throwable cause) {
        super(message, cause);
    }
}
