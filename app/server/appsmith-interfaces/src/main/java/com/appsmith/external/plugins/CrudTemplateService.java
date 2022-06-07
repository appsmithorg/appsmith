package com.appsmith.external.plugins;

import org.springframework.util.CollectionUtils;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public interface CrudTemplateService {

    // Pattern to match all words in the text
    Pattern WORD_PATTERN = Pattern.compile("\\w+");

    /**
     * This method will recursively replace the column names from template table to user provided table
     * This generic implementation makes sure that CRUD generation for each plugin goes through by default
     * The guideline to follow to figure out if this implementation applies to the plugin is:
     * - The plugin follows pre-UQI data structure for queries
     * - The plugin has a datasource structure that is used to generate query templates
     * @param formData form data from action configuration object
     * @param mappedColumns column name map from template table to user defined table
     * @param pluginSpecificTemplateParams plugin specified fields like S3 bucket name etc
     */
    default void updateCrudTemplateFormData(Map<String, Object> formData,
                                Map<String, String> mappedColumns,
                                Map<String, String> pluginSpecificTemplateParams) {
        for (Map.Entry<String,Object> property : formData.entrySet()) {
            if (property.getValue() != null) {
                if (property.getKey() != null && !CollectionUtils.isEmpty(pluginSpecificTemplateParams)
                        && pluginSpecificTemplateParams.get(property.getKey()) != null){
                    property.setValue(pluginSpecificTemplateParams.get(property.getKey()));
                } else {
                    // Recursively replace the column names from template table with user provided table using mappedColumns
                    if (property.getValue() instanceof String) {

                        // In case the entire value finds a match in the mappedColumns, replace it
                        Pattern replacePattern = Pattern.compile(Pattern.quote(property.getValue().toString()));
                        Matcher matcher = replacePattern.matcher(property.getValue().toString());
                        property.setValue(matcher.replaceAll(key ->
                                mappedColumns.get(key.group()) == null ? key.group() : mappedColumns.get(key.group()))
                        );

                        // If the column name is present inside a string (like json), then find all the words and replace
                        // the column name with user one.
                        matcher = WORD_PATTERN.matcher(property.getValue().toString());
                        property.setValue(matcher.replaceAll(key ->
                                mappedColumns.get(key.group()) == null ? key.group() : mappedColumns.get(key.group()))
                        );
                    }
                    if (property.getValue() instanceof Map) {
                        updateCrudTemplateFormData((Map<String, Object>)property.getValue(), mappedColumns, pluginSpecificTemplateParams);
                    }
                }
            }
        }
    }
}
