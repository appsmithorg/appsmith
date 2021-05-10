package com.external.plugins.commands;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import lombok.Getter;
import lombok.Setter;
import org.bson.Document;
import org.pf4j.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;
import static com.external.plugins.constants.ConfigurationIndex.COLLECTION;

@Getter
@Setter
public abstract class MongoCommand {
    String collection;
    List<String> fieldNamesWithNoConfiguration;

    public MongoCommand(ActionConfiguration actionConfiguration) {

        this.fieldNamesWithNoConfiguration = new ArrayList<>();

        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, COLLECTION)) {
            this.collection = (String) pluginSpecifiedTemplates.get(COLLECTION).getValue();
        }
    }

    public Boolean isValid() {
        if (StringUtils.isNullOrEmpty(this.collection)) {
            fieldNamesWithNoConfiguration.add("Collection");
            return Boolean.FALSE;
        }
        return Boolean.TRUE;
    }

    public Document parseCommand() {
        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation : All mongo commands must implement parseCommand");
    }
}
