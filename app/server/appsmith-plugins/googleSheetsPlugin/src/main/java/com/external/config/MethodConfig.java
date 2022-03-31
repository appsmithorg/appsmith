package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Condition;
import com.appsmith.external.models.TriggerRequestDTO;
import com.external.constants.FieldName;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.parseWhereClause;
import static com.appsmith.external.helpers.PluginUtils.validConfigurationPresentInFormData;

@Getter
@Setter
@Builder(toBuilder = true)
@AllArgsConstructor
@ToString
public class MethodConfig {
    String spreadsheetId;
    String spreadsheetUrl;
    String spreadsheetRange;
    String sheetId;
    String spreadsheetName;
    String tableHeaderIndex;
    String queryFormat;
    String rowIndex;
    String sheetName;
    String deleteFormat;
    String rowObjects;
    Object body;
    Condition whereConditions;
    List<String> projection;
    List<Map<String, String>> sortBy;
    Map<String, String> paginateBy;
    Pattern sheetRangePattern = Pattern.compile("https://docs.google.com/spreadsheets/d/([^/]+)/?.*");

    public MethodConfig(Map<String, Object> formData) {

        if (validConfigurationPresentInFormData(formData, FieldName.SHEET_URL)) {
            this.spreadsheetUrl = getDataValueSafelyFromFormData(formData, FieldName.SHEET_URL, STRING_TYPE, "");
            setSpreadsheetUrlFromSpreadsheetId();

        }
        this.spreadsheetRange = getDataValueSafelyFromFormData(formData, FieldName.RANGE, STRING_TYPE);
        this.spreadsheetName = getDataValueSafelyFromFormData(formData, FieldName.SPREADSHEET_NAME, STRING_TYPE);
        this.tableHeaderIndex = getDataValueSafelyFromFormData(formData, FieldName.TABLE_HEADER_INDEX, STRING_TYPE);
        this.queryFormat = getDataValueSafelyFromFormData(formData, FieldName.QUERY_FORMAT, STRING_TYPE);
        this.rowIndex = getDataValueSafelyFromFormData(formData, FieldName.ROW_INDEX, STRING_TYPE);
        this.sheetName = getDataValueSafelyFromFormData(formData, FieldName.SHEET_NAME, STRING_TYPE);
        this.deleteFormat = getDataValueSafelyFromFormData(formData, FieldName.DELETE_FORMAT, STRING_TYPE);
        this.rowObjects = getDataValueSafelyFromFormData(formData, FieldName.ROW_OBJECTS, STRING_TYPE);

        if (validConfigurationPresentInFormData(formData, FieldName.WHERE)) {
            Map<String, Object> whereForm = getDataValueSafelyFromFormData(
                    formData,
                    FieldName.WHERE,
                    new TypeReference<Map<String, Object>>() {
                    },
                    new HashMap<>());
            this.whereConditions = parseWhereClause(whereForm);
        }

        this.projection = getDataValueSafelyFromFormData(formData, FieldName.PROJECTION, new TypeReference<List<String>>() {
        });
        this.sortBy = getDataValueSafelyFromFormData(formData, FieldName.SORT_BY, new TypeReference<List<Map<String, String>>>() {
        });
        this.paginateBy = getDataValueSafelyFromFormData(formData, FieldName.PAGINATION, new TypeReference<Map<String, String>>() {
        });
    }

    private void setSpreadsheetUrlFromSpreadsheetId() {
        final Matcher matcher = sheetRangePattern.matcher(spreadsheetUrl);
        if (matcher.find()) {
            this.spreadsheetId = matcher.group(1);
        } else {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Cannot read spreadsheet URL.");
        }
    }

    public MethodConfig(TriggerRequestDTO triggerRequestDTO) {
        final List<String> parameters = triggerRequestDTO.getParameters();
        switch (parameters.size()) {
            case 2:
                this.sheetName = parameters.get(1);
            case 1:
                this.spreadsheetUrl = parameters.get(0);
                setSpreadsheetUrlFromSpreadsheetId();
        }
    }

}