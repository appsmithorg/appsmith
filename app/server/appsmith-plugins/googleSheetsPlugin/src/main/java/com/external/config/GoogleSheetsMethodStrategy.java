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
            case MethodIdentifiers.ROWS_APPEND:
                return new RowsAppendMethod(objectMapper);
            case MethodIdentifiers.ROWS_BULK_APPEND:
                return new RowsBulkAppendMethod(objectMapper);
            case MethodIdentifiers.ROWS_BULK_UPDATE:
                return new RowsBulkUpdateMethod(objectMapper);
            case MethodIdentifiers.CLEAR:
                return new ClearMethod(objectMapper);
            case MethodIdentifiers.COPY:
                return new CopyMethod(objectMapper);
            case MethodIdentifiers.FILE_CREATE:
                return new FileCreateMethod(objectMapper);
            case MethodIdentifiers.SHEET_DELETE:
                return new SheetDeleteMethod(objectMapper);
            case MethodIdentifiers.FILE_DELETE:
                return new FileDeleteMethod(objectMapper);
            case MethodIdentifiers.ROWS_GET:
                return new RowsGetMethod(objectMapper);
            case MethodIdentifiers.GET_STRUCTURE:
                return new GetStructureMethod(objectMapper);
            case MethodIdentifiers.FILE_INFO:
                return new FileInfoMethod(objectMapper);
            case MethodIdentifiers.FILE_LIST:
                return new FileListMethod(objectMapper);
            case MethodIdentifiers.ROWS_UPDATE:
                return new RowsUpdateMethod(objectMapper);
            case MethodIdentifiers.ROWS_DELETE:
                return new RowsDeleteMethod(objectMapper);
            default:
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unknown method type: " + type));
        }
    }
}
