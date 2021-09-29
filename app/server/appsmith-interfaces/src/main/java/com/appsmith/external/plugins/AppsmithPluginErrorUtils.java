package com.appsmith.external.plugins;

/**
 * Defines a common interface that plugin agnostic code flow can use to work with plugin related error objects. Each
 * plugin must override the common methods to provide plugin specific functionality. One use case is to extract
 * human-readable strings from otherwise huge error messages. For this use case, each plugin must override
 * `getReadableError` method to define its own way of extracting the readable error message.
 */
public abstract class AppsmithPluginErrorUtils {
    public String getReadableError(Throwable error) {
        return error.getMessage();
    }
}
