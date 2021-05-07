package com.external.plugins.commands;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.constants.ConfigurationIndex;

import java.util.List;

import static com.external.plugins.MongoPluginUtils.validConfigurationPresent;

public abstract class BaseCommand {
    String collection;

    BaseCommand(ActionConfiguration actionConfiguration) {
        List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();

        if (validConfigurationPresent(pluginSpecifiedTemplates, ConfigurationIndex.COLLECTION)) {
            this.collection = (String) pluginSpecifiedTemplates.get(ConfigurationIndex.COLLECTION).getValue();
        }
    }
}
