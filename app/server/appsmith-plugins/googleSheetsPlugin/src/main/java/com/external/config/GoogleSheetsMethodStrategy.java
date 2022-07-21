package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.TriggerRequestDTO;
import com.external.constants.FieldName;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import reactor.core.Exceptions;

import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;

@Slf4j
public class GoogleSheetsMethodStrategy {

    public static ExecutionMethod getExecutionMethod(Map<String, Object> formData, ObjectMapper objectMapper) {
        final String type = getDataValueSafelyFromFormData(formData, FieldName.ENTITY_TYPE, STRING_TYPE)
                + "_"
                + getDataValueSafelyFromFormData(formData, FieldName.COMMAND, STRING_TYPE);
        switch (type) {
            case MethodIdentifiers.ROWS_INSERT_ONE:
                return new RowsAppendMethod(objectMapper);
            case MethodIdentifiers.ROWS_INSERT_MANY:
                return new RowsBulkAppendMethod(objectMapper);
            case MethodIdentifiers.ROWS_UPDATE_MANY:
                return new RowsBulkUpdateMethod(objectMapper);
            case MethodIdentifiers.CLEAR:
                return new ClearMethod(objectMapper);
            case MethodIdentifiers.COPY:
                return new CopyMethod(objectMapper);
            case MethodIdentifiers.SPREADSHEET_INSERT_ONE:
                return new FileCreateMethod(objectMapper);
            case MethodIdentifiers.SHEET_DELETE_ONE:
                return new SheetDeleteMethod(objectMapper);
            case MethodIdentifiers.SPREADSHEET_DELETE_ONE:
                return new FileDeleteMethod(objectMapper);
            case MethodIdentifiers.ROWS_FETCH_MANY:
                return new RowsGetMethod(objectMapper);
            case MethodIdentifiers.GET_STRUCTURE:
                return new GetStructureMethod(objectMapper);
            case MethodIdentifiers.SPREADSHEET_FETCH_DETAILS:
                return new FileInfoMethod(objectMapper);
            case MethodIdentifiers.SPREADSHEET_FETCH_MANY:
                return new FileListMethod(objectMapper);
            case MethodIdentifiers.ROWS_UPDATE_ONE:
                return new RowsUpdateMethod(objectMapper);
            case MethodIdentifiers.ROWS_DELETE_ONE:
                return new RowsDeleteMethod(objectMapper);
            default:
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unknown execution method type: " + type));
        }
    }

    public static TriggerMethod getTriggerMethod(TriggerRequestDTO triggerRequestDTO, ObjectMapper objectMapper) {
        switch (triggerRequestDTO.getRequestType()) {
            case MethodIdentifiers.TRIGGER_SPREADSHEET_SELECTOR:
                return new FileListMethod(objectMapper);
            case MethodIdentifiers.TRIGGER_SHEET_SELECTOR:
                return new FileInfoMethod(objectMapper);
            case MethodIdentifiers.TRIGGER_COLUMNS_SELECTOR:
                return new GetStructureMethod(objectMapper);
            default:
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unknown trigger method type: " + triggerRequestDTO.getRequestType()));
        }

    }

    public static TemplateMethod getTemplateMethod(Map<String, Object> formData) {
        final String type = getDataValueSafelyFromFormData(formData, FieldName.ENTITY_TYPE, STRING_TYPE)
                + "_"
                + getDataValueSafelyFromFormData(formData, FieldName.COMMAND, STRING_TYPE);

        switch (type) {
            case MethodIdentifiers.ROWS_INSERT_ONE:
                return new RowsAppendMethod();
            case MethodIdentifiers.ROWS_FETCH_MANY:
                return new RowsGetMethod();
            case MethodIdentifiers.ROWS_UPDATE_ONE:
                return new RowsUpdateMethod();
            case MethodIdentifiers.ROWS_DELETE_ONE:
                return new RowsDeleteMethod();
            default:
                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unknown execution method type: " + type));
        }
    }
}
