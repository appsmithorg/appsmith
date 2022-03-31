package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.Condition;
import com.appsmith.external.models.TriggerRequestDTO;
import com.external.constants.FieldName;
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

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormDataOrDefault;
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
    String rowOffset;
    String rowIndex;
    String rowLimit;
    String sheetName;
    String deleteFormat;
    String rowObjects;
    Object body;
    Condition whereConditions;
    Pattern sheetRangePattern = Pattern.compile("https://docs.google.com/spreadsheets/d/([^/]+)/?.*");

    public MethodConfig(Map<String, Object> formData) {

        if (validConfigurationPresentInFormData(formData, FieldName.SHEET_URL)) {
            this.spreadsheetUrl = (String) getValueSafelyFromFormDataOrDefault(formData, FieldName.SHEET_URL, "");
            setSpreadsheetUrlFromSpreadsheetId();

        }
        this.spreadsheetRange = PluginUtils.getDataValueSafelyFromFormData(formData, FieldName.RANGE, String.class);
        this.spreadsheetName = PluginUtils.getDataValueSafelyFromFormData(formData, FieldName.SPREADSHEET_NAME, String.class);
        this.tableHeaderIndex = PluginUtils.getDataValueSafelyFromFormData(formData, FieldName.TABLE_HEADER_INDEX, String.class);
        this.queryFormat = PluginUtils.getDataValueSafelyFromFormData(formData, FieldName.QUERY_FORMAT, String.class);
        final Map<String, Object> paginationMap = PluginUtils.getDataValueSafelyFromFormData(formData, FieldName.PAGINATION, Map.class, new HashMap<>());
        this.rowLimit = (String) paginationMap.getOrDefault(FieldName.ROW_LIMIT, 10);
        this.rowOffset = (String) paginationMap.getOrDefault(FieldName.ROW_OFFSET, 0);
        this.rowIndex = PluginUtils.getDataValueSafelyFromFormData(formData, FieldName.ROW_INDEX, String.class);
        this.sheetName = PluginUtils.getDataValueSafelyFromFormData(formData, FieldName.SHEET_NAME, String.class);
        this.deleteFormat = PluginUtils.getDataValueSafelyFromFormData(formData, FieldName.DELETE_FORMAT, String.class);
        this.rowObjects = PluginUtils.getDataValueSafelyFromFormData(formData, FieldName.ROW_OBJECTS, String.class);

        if (validConfigurationPresentInFormData(formData, FieldName.WHERE)) {
            Map<String, Object> whereForm = (Map<String, Object>) PluginUtils.getDataValueSafelyFromFormData(formData, FieldName.WHERE, HashMap.class, new HashMap<>());
            this.whereConditions = parseWhereClause(whereForm);
        }
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