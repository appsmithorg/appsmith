package com.appsmith.external.exceptions.pluginExceptions;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class StaleConnectionException extends RuntimeException {
    String message = "";

    public StaleConnectionException(String message) {
        super(message);
        this.message = message;
    }

    public StaleConnectionException(String message, Throwable cause) {
        super(message, cause);
        this.message = message;
    }
}
