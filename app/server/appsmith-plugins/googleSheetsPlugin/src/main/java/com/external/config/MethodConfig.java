package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Condition;
import com.external.constants.FieldName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormDataOrDefault;
import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormDataOrDefaultByType;
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
            final Matcher matcher = sheetRangePattern.matcher(spreadsheetUrl);
            if (matcher.find()) {
                this.spreadsheetId = matcher.group(1);
            } else {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Cannot read spreadsheet URL.");
            }

        }
        this.spreadsheetRange = getValueSafelyFromFormData(formData, FieldName.RANGE, String.class);
        this.spreadsheetName = getValueSafelyFromFormData(formData, FieldName.SPREADSHEET_NAME, String.class);
        this.tableHeaderIndex = getValueSafelyFromFormData(formData, FieldName.TABLE_HEADER_INDEX, String.class);
        this.queryFormat = getValueSafelyFromFormData(formData, FieldName.QUERY_FORMAT, String.class);
        this.rowLimit = getValueSafelyFromFormData(formData, FieldName.ROW_LIMIT, String.class);
        this.rowOffset = getValueSafelyFromFormData(formData, FieldName.ROW_OFFSET, String.class);
        this.rowIndex = getValueSafelyFromFormData(formData, FieldName.ROW_INDEX, String.class);
        this.sheetName = getValueSafelyFromFormData(formData, FieldName.SHEET_NAME, String.class);
        this.deleteFormat = getValueSafelyFromFormData(formData, FieldName.DELETE_FORMAT, String.class);
        this.rowObjects = getValueSafelyFromFormData(formData, FieldName.ROW_OBJECTS, String.class);

        if (validConfigurationPresentInFormData(formData, FieldName.WHERE)) {
            Map<String, Object> whereForm = getValueSafelyFromFormDataOrDefaultByType(formData, FieldName.WHERE, new HashMap<String, Object>());
            this.whereConditions = parseWhereClause(whereForm);
        }
    }

}