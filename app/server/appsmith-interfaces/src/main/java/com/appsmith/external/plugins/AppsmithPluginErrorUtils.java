package com.appsmith.external.plugins;

public abstract class AppsmithPluginErrorUtils {
    public String getReadableError(Throwable error) {
        return error.getMessage();
    }
}
