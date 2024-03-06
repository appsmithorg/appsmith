package com.external.plugins.pluginActions;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import reactor.core.publisher.Mono;

public class PluginActionsImpl implements PluginActions {

    protected HttpMethod getHttpMethod() {
        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_UNSUPPORTED_OPERATION);
    }

    protected String getRequestBody() {
        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_UNSUPPORTED_OPERATION);
    }

    @Override
    public Mono<ResponseEntity<String>> getResponse() {
        return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_UNSUPPORTED_OPERATION));
    }
}
