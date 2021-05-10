package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Property;
import org.bson.Document;
import org.bson.json.JsonParseException;

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

    public static Document parseSafely(String fieldName, String input) {
        try {
            Document document = Document.parse(input);
            return document;
        } catch (JsonParseException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, fieldName + " could not be parsed into expected JSON format." );
        }
    }
}
