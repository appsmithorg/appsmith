package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import lombok.extern.slf4j.Slf4j;
import reactor.core.Exceptions;

@Slf4j
public class GoogleSheetsMethodStrategy {

    public static Method getMethod(String type) {
        switch (type) {
            case MethodIdentifiers.APPEND:
                return new AppendMethod();
            case MethodIdentifiers.BULK_UPDATE:
                return new BulkUpdateMethod();
            case MethodIdentifiers.CLEAR:
                return new ClearMethod();
            case MethodIdentifiers.COPY:
                return new CopyMethod();
            case MethodIdentifiers.CREATE:
                return new CreateMethod();
            case MethodIdentifiers.DELETE:
                return new DeleteMethod();
            case MethodIdentifiers.GET:
                return new GetValuesMethod();
            case MethodIdentifiers.INFO:
                return new InfoMethod();
            case MethodIdentifiers.LIST:
                return new ListSheetsMethod();
            case MethodIdentifiers.UPDATE:
                return new UpdateMethod();
            default:
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unknown method type: " + type));
        }
    }
}
