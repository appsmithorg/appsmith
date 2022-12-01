package com.appsmith.external.plugins;

import org.springframework.util.CollectionUtils;

import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.replaceMappedColumnInStringValue;

public interface CrudTemplateService {

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
                        final String replacedValue = replaceMappedColumnInStringValue(mappedColumns, property.getValue());
                        property.setValue(replacedValue);
                    }
                    if (property.getValue() instanceof Map) {
                        updateCrudTemplateFormData((Map<String, Object>) property.getValue(), mappedColumns, pluginSpecificTemplateParams);
                    }
                }
            }
        }
    }
}
