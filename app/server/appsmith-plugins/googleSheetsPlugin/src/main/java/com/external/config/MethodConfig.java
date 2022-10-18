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
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.getTrimmedStringDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.getValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.parseWhereClause;
import static com.appsmith.external.helpers.PluginUtils.validDataConfigurationPresentInFormData;
import static com.external.constants.FieldName.SHEET_NAME;
import static com.external.constants.FieldName.SHEET_URL;
import static com.external.constants.FieldName.TABLE_HEADER_INDEX;

@Getter
@Setter
@Builder(toBuilder = true)
@AllArgsConstructor
@ToString
public class MethodConfig {
    public static final String PATH_KEY = "path";
    public static final String VALUE_KEY = "value";
    public static final String OPERATOR_KEY = "operator";

    String spreadsheetId;
    String spreadsheetUrl;
    String spreadsheetRange;
    String sheetId;
    String spreadsheetName;
    String tableHeaderIndex;
    String queryFormat;
    String rowIndex;
    String sheetName;
    String rowObjects;
    Object body;
    Condition whereConditions;
    List<String> projection;
    List<Map<String, String>> sortBy;
    Map<String, String> paginateBy;
    Pattern sheetRangePattern = Pattern.compile("https://docs.google.com/spreadsheets/d/([^/]+)/?.*");

    public MethodConfig(Map<String, Object> formData) {

        if (validDataConfigurationPresentInFormData(formData, SHEET_URL, STRING_TYPE)) {
            this.spreadsheetUrl = getDataValueSafelyFromFormData(formData, SHEET_URL, STRING_TYPE, "");
            setSpreadsheetUrlFromSpreadsheetId();
        }
        this.spreadsheetRange = getTrimmedStringDataValueSafelyFromFormData(formData, FieldName.RANGE);
        this.spreadsheetName = getTrimmedStringDataValueSafelyFromFormData(formData, FieldName.SPREADSHEET_NAME);
        this.tableHeaderIndex = getTrimmedStringDataValueSafelyFromFormData(formData, FieldName.TABLE_HEADER_INDEX);
        this.queryFormat = getTrimmedStringDataValueSafelyFromFormData(formData, FieldName.QUERY_FORMAT);
        this.rowIndex = getTrimmedStringDataValueSafelyFromFormData(formData, FieldName.ROW_INDEX);
        this.sheetName = getTrimmedStringDataValueSafelyFromFormData(formData, SHEET_NAME);
        this.rowObjects = getTrimmedStringDataValueSafelyFromFormData(formData, FieldName.ROW_OBJECTS);

        if (validDataConfigurationPresentInFormData(formData, FieldName.WHERE, new TypeReference<Map<String, Object>>() {
        })) {
            Map<String, Object> whereForm = getDataValueSafelyFromFormData(
                    formData,
                    FieldName.WHERE,
                    new TypeReference<Map<String, Object>>() {
                    },
                    new HashMap<>());
            this.whereConditions = parseWhereClause(whereForm);
        }

        this.projection = getDataValueSafelyFromFormData(formData, FieldName.PROJECTION, new TypeReference<>() {
        });
        // Always add rowIndex to a valid projection
        if (this.projection != null && !this.projection.isEmpty()) {
            this.projection.add("rowIndex");
        }
        this.sortBy = getDataValueSafelyFromFormData(formData, FieldName.SORT_BY, new TypeReference<>() {
        });
        this.paginateBy = getDataValueSafelyFromFormData(formData, FieldName.PAGINATION, new TypeReference<>() {
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
        final Map<String, Object> parameters = triggerRequestDTO.getParameters();
        switch (parameters.size()) {
            case 3:
            case 2:
                this.tableHeaderIndex = (String) getValueSafelyFromFormData(parameters, TABLE_HEADER_INDEX);
                if (!StringUtils.hasLength(this.tableHeaderIndex)) {
                    this.tableHeaderIndex = "1";
                }
                this.sheetName = (String) getValueSafelyFromFormData(parameters, SHEET_NAME);
            case 1:
                this.spreadsheetUrl = (String) getValueSafelyFromFormData(parameters, SHEET_URL);
                setSpreadsheetUrlFromSpreadsheetId();
        }
    }

}