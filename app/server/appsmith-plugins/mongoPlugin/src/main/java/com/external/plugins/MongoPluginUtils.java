package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Property;
import org.bson.Document;
import org.bson.json.JsonParseException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.external.plugins.constants.ConfigurationIndex.MAX_SIZE;

public class MongoPluginUtils {

    public static Boolean validConfigurationPresent(List<Property> pluginSpecifiedTemplates, int index) {
        if (pluginSpecifiedTemplates != null) {
            if (pluginSpecifiedTemplates.size() > index) {
                if (pluginSpecifiedTemplates.get(index) != null) {
                    if (pluginSpecifiedTemplates.get(index).getValue() != null) {
                        return Boolean.TRUE;
                    }
                }
            }
        }

        return Boolean.FALSE;
    }

    public static Document parseSafely(String fieldName, String input) {
        try {
            return Document.parse(input);
        } catch (JsonParseException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, fieldName + " could not be parsed into expected JSON format.");
        }
    }

    public static List<Property> generateMongoFormConfigTemplates(Map<Integer, Object> configuration) {
        List<Property> templates = new ArrayList<>();
        for (int i = 0; i < MAX_SIZE; i++) {
            Property template = new Property();
            if (configuration.containsKey(i)) {
                template.setValue(configuration.get(i));
            }
            templates.add(template);
        }
        return templates;
    }
}
