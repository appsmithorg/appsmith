package com.external.plugins;

import com.appsmith.external.models.Property;

import java.util.List;

public class MongoPluginUtils {

    public static Boolean validConfigurationPresent(List<Property> pluginSpecifiedTemplates, int index) {
        if (pluginSpecifiedTemplates != null) {
            if (pluginSpecifiedTemplates.size()>=index) {
                if (pluginSpecifiedTemplates.get(index) != null) {
                    if (pluginSpecifiedTemplates.get(index).getValue() != null) {
                        return Boolean.TRUE;
                    }
                }
            }
        }

        return Boolean.FALSE;
    }
}
