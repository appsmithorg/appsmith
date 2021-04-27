package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import reactor.core.Exceptions;

@Slf4j
public class GoogleSheetsMethodStrategy {

    public static Method getMethod(String type, ObjectMapper objectMapper) {
        switch (type) {
            case MethodIdentifiers.APPEND:
                return new AppendMethod(objectMapper);
            case MethodIdentifiers.BULK_APPEND:
                return new BulkAppendMethod(objectMapper);
            case MethodIdentifiers.BULK_UPDATE:
                return new BulkUpdateMethod(objectMapper);
            case MethodIdentifiers.CLEAR:
                return new ClearMethod(objectMapper);
            case MethodIdentifiers.COPY:
                return new CopyMethod(objectMapper);
            case MethodIdentifiers.CREATE:
                return new CreateMethod(objectMapper);
            case MethodIdentifiers.DELETE:
                return new DeleteSheetMethod(objectMapper);
            case MethodIdentifiers.GET:
                return new GetValuesMethod(objectMapper);
            case MethodIdentifiers.INFO:
                return new InfoMethod(objectMapper);
            case MethodIdentifiers.LIST:
                return new ListSheetsMethod(objectMapper);
            case MethodIdentifiers.UPDATE:
                return new UpdateMethod(objectMapper);
            case MethodIdentifiers.DELETE_ROW:
                return new DeleteRowMethod(objectMapper);
            default:
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unknown method type: " + type));
        }
    }
}
